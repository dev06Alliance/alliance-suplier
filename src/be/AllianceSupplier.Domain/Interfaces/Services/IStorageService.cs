using Microsoft.AspNetCore.Http;

namespace AllianceSupplier.Domain.Interfaces.Services;

public interface IStorageService
{
    Task<string> UploadAsync(IFormFile file);
    Task DeleteAsync(string url);
}
