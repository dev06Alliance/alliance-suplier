using AllianceSupplier.Domain.Entities;
using AllianceSupplier.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AllianceSupplier.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Username).IsRequired().HasMaxLength(100);
        builder.HasIndex(u => u.Username).IsUnique();
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.Name).IsRequired().HasMaxLength(100);
        builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(50);
        builder.Property(u => u.CreatedAt).HasDefaultValueSql("now()");

        builder
            .HasMany(u => u.RequestedTickets)
            .WithOne(t => t.Requester)
            .HasForeignKey(t => t.RequesterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasMany(u => u.ConfirmedTickets)
            .WithOne(t => t.ConfirmedBy)
            .HasForeignKey(t => t.ConfirmedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasMany(u => u.Notifications)
            .WithOne(n => n.User)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasMany(u => u.DeadlineChanges)
            .WithOne(d => d.ChangedBy)
            .HasForeignKey(d => d.ChangedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
