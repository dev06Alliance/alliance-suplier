using AllianceSupplier.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AllianceSupplier.Api.Controllers;

[Authorize(Roles = "Admin")]
public class ReportsController(IReportService reportService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] DateTime? date,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to
    )
    {
        var result = await reportService.GetReportAsync(date, from, to);
        return ApiOk(result);
    }
}
