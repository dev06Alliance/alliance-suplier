using AllianceSupplier.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AllianceSupplier.Infrastructure.Persistence.Configurations;

public class DeadlineHistoryConfiguration : IEntityTypeConfiguration<DeadlineHistory>
{
    public void Configure(EntityTypeBuilder<DeadlineHistory> builder)
    {
        builder.ToTable("deadline_histories");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Reason).IsRequired().HasMaxLength(500);
        builder.Property(d => d.ChangedAt).HasDefaultValueSql("now()");
    }
}
