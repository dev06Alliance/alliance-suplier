using AllianceSupplier.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AllianceSupplier.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Type).HasConversion<string>().HasMaxLength(50);
        builder.Property(n => n.CreatedAt).HasDefaultValueSql("now()");
        // Neutral JSONB payload — not tied to any FK
        builder.Property(n => n.Payload).HasColumnType("jsonb");

        builder.HasIndex(n => n.UserId);
        builder.HasIndex(n => n.IsRead);
    }
}
