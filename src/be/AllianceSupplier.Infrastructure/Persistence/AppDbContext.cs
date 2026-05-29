using AllianceSupplier.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AllianceSupplier.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<DeadlineHistory> DeadlineHistories => Set<DeadlineHistory>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
}
