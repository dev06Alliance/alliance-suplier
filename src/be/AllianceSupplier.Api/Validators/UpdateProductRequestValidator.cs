using AllianceSupplier.Api.DTOs.Products;
using FluentValidation;

namespace AllianceSupplier.Api.Validators;

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequestDto>
{
    private static readonly string[] AllowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    private const long MaxImageBytes = 5 * 1024 * 1024;

    public UpdateProductRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("CategoryId is required");

        When(x => x.Image is not null, () =>
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
