using AllianceSupplier.Service.DTOs.Reports;

namespace AllianceSupplier.Service.Interfaces;

public interface IReportService
{
    Task<ReportDto> GetReportAsync(DateTime? date, DateTime? from, DateTime? to);
}
