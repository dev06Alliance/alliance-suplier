using AllianceSupplier.Api.DTOs.Tickets;
using FluentValidation;

namespace AllianceSupplier.Api.Validators;

public class ExtendDeadlineRequestValidator : AbstractValidator<ExtendDeadlineRequestDto>
{
    public ExtendDeadlineRequestValidator()
    {
        RuleFor(x => x.NewDeadline)
            .GreaterThan(DateTime.UtcNow).WithMessage("NewDeadline must be a future date");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required")
            .MaximumLength(500);
    }
}
