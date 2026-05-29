using System.Security.Claims;
using AllianceSupplier.Api.Exceptions;
using AllianceSupplier.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace AllianceSupplier.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class BaseController : ControllerBase
{
    protected Guid GetCurrentUserId()
    {
        var value =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new UnauthorizedException();
        return Guid.Parse(value);
    }

    protected Role GetCurrentUserRole()
    {
        var value = User.FindFirstValue(ClaimTypes.Role) ?? throw new UnauthorizedException();
        return Enum.Parse<Role>(value);
    }

    protected IActionResult ApiOk<T>(T data) => Ok(new { success = true, data });
}
