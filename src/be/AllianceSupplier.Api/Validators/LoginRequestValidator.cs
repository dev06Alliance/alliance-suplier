using AllianceSupplier.Api.DTOs.Auth;
using FluentValidation;

namespace AllianceSupplier.Api.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Username).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Password).NotEmpty();
    }
}
