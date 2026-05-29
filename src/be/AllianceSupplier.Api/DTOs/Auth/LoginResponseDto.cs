using AllianceSupplier.Service.DTOs;

namespace AllianceSupplier.Api.DTOs.Auth;

public record LoginResponseDto(string AccessToken, UserDto User);
