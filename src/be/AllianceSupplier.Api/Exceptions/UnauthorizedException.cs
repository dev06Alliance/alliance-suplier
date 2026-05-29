namespace AllianceSupplier.Api.Exceptions;

public class UnauthorizedException(string message = "Unauthorized") : Exception(message);
