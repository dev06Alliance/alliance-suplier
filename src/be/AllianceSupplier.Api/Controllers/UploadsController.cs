using AllianceSupplier.Domain.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllianceSupplier.Api.Controllers;

[Authorize]
public class UploadsController(IStorageService storage) : BaseController
{
    private static readonly string[] AllowedTypes = ["image/jpeg", "image/png", "image/webp"];
    private const long MaxBytes = 5 * 1024 * 1024;

    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is required");

        if (file.Length > MaxBytes)
            throw new ArgumentException("File must not exceed 5 MB");

        if (!AllowedTypes.Contains(file.ContentType))
            throw new ArgumentException("File must be JPEG, PNG, or WEBP");

        var url = await storage.UploadAsync(file);
        return StatusCode(201, new { success = true, data = new { url } });
    }
}
