using AllianceSupplier.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AllianceSupplier.Infrastructure.Persistence.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.ToTable("tickets");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Type).HasConversion<string>().HasMaxLength(50);
        builder.Property(t => t.Status).HasConversion<string>().HasMaxLength(50);
        builder.Property(t => t.FreeTextDesc).HasMaxLength(1000);
        builder.Property(t => t.ImageUrl).HasMaxLength(500);
        builder.Property(t => t.CreatedAt).HasDefaultValueSql("now()");
        builder.Property(t => t.UpdatedAt).HasDefaultValueSql("now()");

        builder.HasIndex(t => t.RequesterId);
        builder.HasIndex(t => t.Status);
        builder.HasIndex(t => t.Deadline);

        builder
            .HasOne(t => t.Product)
            .WithMany(p => p.Tickets)
            .HasForeignKey(t => t.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        builder
            .HasMany(t => t.DeadlineHistories)
            .WithOne(d => d.Ticket)
            .HasForeignKey(d => d.TicketId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
