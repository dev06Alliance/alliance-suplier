namespace AllianceSupplier.Api.Exceptions;

public class ForbiddenException(string message = "Forbidden") : Exception(message);
