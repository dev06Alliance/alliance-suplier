using AllianceSupplier.Api.DTOs.Tickets;
using AllianceSupplier.Domain.Enums;
using FluentValidation;

namespace AllianceSupplier.Api.Validators;

public class CreateTicketRequestValidator : AbstractValidator<CreateTicketRequestDto>
{
    private static readonly string[] AllowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    private const long MaxImageBytes = 5 * 1024 * 1024; // 5 MB

    public CreateTicketRequestValidator()
    {
        RuleFor(x => x.Type)
            .NotEmpty()
            .Must(t => Enum.TryParse<TicketType>(t, ignoreCase: true, out _))
            .WithMessage("Type must be 'Broken' or 'Empty'");

        RuleFor(x => x.Deadline)
            .GreaterThan(DateTime.UtcNow.Date).WithMessage("Deadline must be a future date");

        // productId XOR (freeTextDesc + optional image)
        RuleFor(x => x)
            .Must(x => x.ProductId.HasValue ^ !string.IsNullOrWhiteSpace(x.FreeTextDesc))
            .WithMessage("Either ProductId OR FreeTextDesc (with optional Image) must be provided, not both");

        When(x => !x.ProductId.HasValue, () =>
        {
            RuleFor(x => x.FreeTextDesc)
                .NotEmpty().WithMessage("FreeTextDesc is required when ProductId is not provided")
                .MaximumLength(1000);
        });

        When(x => x.Image != null, () =>
        {
            RuleFor(x => x.Image!.Length)
                .LessThanOrEqualTo(MaxImageBytes)
                .WithMessage("Image must not exceed 5 MB");

            RuleFor(x => x.Image!.ContentType)
                .Must(ct => AllowedImageTypes.Contains(ct))
                .WithMessage("Image must be JPEG, PNG, or WEBP");
        });
    }
}
