using AllianceSupplier.Domain.Interfaces.Repositories;
using AllianceSupplier.Service.DTOs.Reports;
using AllianceSupplier.Service.Interfaces;

namespace AllianceSupplier.Service;

public class ReportService(ITicketRepository ticketRepo) : IReportService
{
    public async Task<ReportDto> GetReportAsync(DateTime? date, DateTime? from, DateTime? to)
    {
        DateTime? resolvedFrom = from;
        DateTime? resolvedTo = to;

        if (date.HasValue)
        {
            resolvedFrom = date.Value.Date;
            resolvedTo = date.Value.Date.AddDays(1).AddTicks(-1);
        }

        var (total, confirmed, done) = await ticketRepo.GetCountsByStatusAsync(resolvedFrom, resolvedTo);
        return new ReportDto(total, confirmed, done);
    }
}
