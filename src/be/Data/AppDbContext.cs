using Microsoft.EntityFrameworkCore;

namespace AllianceSupplier.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options) { }
