using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AllianceSupplier.Domain.Interfaces.Repositories;
using AllianceSupplier.Service.DTOs;
using AllianceSupplier.Service.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AllianceSupplier.Service;

public class AuthService(IUserRepository users, IConfiguration config) : IAuthService
{
    public async Task<LoginResult> LoginAsync(LoginRequest request)
    {
        var user = await users.GetByUsernameAsync(request.Username)
            ?? throw new UnauthorizedAccessException("Invalid credentials");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials");

        var token = GenerateAccessToken(user.Id, user.Role.ToString());
        var dto = new UserDto(user.Id, user.Name, user.Username, user.Role.ToString());
        return new LoginResult(token, dto);
    }

    public Task<string> RefreshAsync(string refreshToken)
    {
        // Validate the refresh token JWT to extract claims
        var handler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));

        ClaimsPrincipal principal;
        try
        {
            principal = handler.ValidateToken(refreshToken, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = config["Jwt:Issuer"],
                ValidAudience = config["Jwt:Audience"],
                IssuerSigningKey = key,
                ClockSkew = TimeSpan.Zero
            }, out _);
        }
        catch
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token");
        }

        var userId = Guid.Parse(principal.Claims.First(c => c.Type == ClaimTypes.NameIdentifier).Value);
        var role = principal.Claims.First(c => c.Type == ClaimTypes.Role).Value;
        return Task.FromResult(GenerateAccessToken(userId, role));
    }

    public async Task<UserDto> GetMeAsync(Guid userId)
    {
        var user = await users.GetByIdAsync(userId)
            ?? throw new UnauthorizedAccessException("User not found");
        return new UserDto(user.Id, user.Name, user.Username, user.Role.ToString());
    }

    private string GenerateAccessToken(Guid userId, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = int.Parse(config["Jwt:AccessTokenExpiryMinutes"] ?? "15");

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: [
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role)
            ],
            expires: DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
