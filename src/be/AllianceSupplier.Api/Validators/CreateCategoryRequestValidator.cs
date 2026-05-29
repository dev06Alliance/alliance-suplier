using AllianceSupplier.Api.DTOs.Categories;
using FluentValidation;

namespace AllianceSupplier.Api.Validators;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequestDto>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters");
    }
}
