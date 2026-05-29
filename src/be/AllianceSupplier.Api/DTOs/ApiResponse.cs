namespace AllianceSupplier.Api.DTOs;

public record ApiResponse<T>(bool Success, T? Data, ApiError? Error);
