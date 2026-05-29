using AllianceSupplier.Api.DTOs.Tickets;
using AllianceSupplier.Domain.Enums;
using FluentValidation;

namespace AllianceSupplier.Api.Validators;

public class TicketQueryParamsValidator : AbstractValidator<TicketQueryParams>
{
    public TicketQueryParamsValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page must be >= 1");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50).WithMessage("PageSize must be between 1 and 50");

        When(x => !string.IsNullOrWhiteSpace(x.Status), () =>
        {
            RuleFor(x => x.Status)
                .Must(s => Enum.TryParse<TicketStatus>(s, true, out _))
                .WithMessage("Status must be Pending, Confirmed, or Done");
        });

        When(x => !string.IsNullOrWhiteSpace(x.Type), () =>
        {
            RuleFor(x => x.Type)
                .Must(t => Enum.TryParse<TicketType>(t, true, out _))
                .WithMessage("Type must be Broken or Empty");
        });
    }
}
