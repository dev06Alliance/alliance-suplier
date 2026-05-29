using Microsoft.AspNetCore.Mvc;

namespace AllianceSupplier.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet("/health")]
    public IActionResult Get() => Ok(new { status = "ok" });
}
