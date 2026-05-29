using AllianceSupplier.Domain.Interfaces.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace AllianceSupplier.Infrastructure.Storage;

public class LocalStorageService(IWebHostEnvironment env) : IStorageService
{
    public async Task<string> UploadAsync(IFormFile file)
    {
        var uploadsDir = Path.Combine(env.WebRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName);
        var filename = $"{Guid.NewGuid()}{ext}";
        var path = Path.Combine(uploadsDir, filename);

        await using var stream = File.Create(path);
        await file.CopyToAsync(stream);

        return $"/uploads/{filename}";
    }

    public Task DeleteAsync(string url)
    {
        var filename = Path.GetFileName(url);
        var path = Path.Combine(env.WebRootPath, "uploads", filename);
        if (File.Exists(path))
            File.Delete(path);
        return Task.CompletedTask;
    }
}
