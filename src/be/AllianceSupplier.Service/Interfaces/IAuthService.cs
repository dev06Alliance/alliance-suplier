using AllianceSupplier.Service.DTOs;

namespace AllianceSupplier.Service.Interfaces;

public interface IAuthService
{
    Task<LoginResult> LoginAsync(LoginRequest request);
    Task<string> RefreshAsync(string refreshToken);
    Task<UserDto> GetMeAsync(Guid userId);
}
