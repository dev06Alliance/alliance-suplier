using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AllianceSupplier.Api.DTOs.Auth;
using AllianceSupplier.Api.Exceptions;
using AllianceSupplier.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace AllianceSupplier.Api.Controllers;

public class AuthController(IAuthService authService, IConfiguration config) : BaseController
{
    private const string RefreshTokenCookie = "refresh_token";

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var result = await authService.LoginAsync(new(dto.Username, dto.Password));

        SetRefreshCookie(BuildRefreshToken(result.User.Id, result.User.Role));

        return ApiOk(new LoginResponseDto(result.AccessToken, result.User));
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var cookie =
            Request.Cookies[RefreshTokenCookie]
            ?? throw new UnauthorizedException("No refresh token");

        var accessToken = await authService.RefreshAsync(cookie);
        return ApiOk(new { accessToken });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(RefreshTokenCookie);
        return ApiOk<object?>(null);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await authService.GetMeAsync(GetCurrentUserId());
        return ApiOk(user);
    }

    // Signed JWT used as refresh token value inside HttpOnly cookie
    private string BuildRefreshToken(Guid userId, string role)
    {
        var expDays = int.Parse(config["Jwt:RefreshTokenExpiryDays"] ?? "7");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims:
            [
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role),
            ],
            expires: DateTime.UtcNow.AddDays(expDays),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private void SetRefreshCookie(string value)
    {
        Response.Cookies.Append(
            RefreshTokenCookie,
            value,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // true in production (HTTPS)
                SameSite = SameSiteMode.Strict,
                Expires = DateTimeOffset.UtcNow.AddDays(7),
            }
        );
    }
}
