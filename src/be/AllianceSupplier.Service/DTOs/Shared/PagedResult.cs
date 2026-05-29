namespace AllianceSupplier.Service.DTOs.Shared;

public record PagedResult<T>(
    IEnumerable<T> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages
);
