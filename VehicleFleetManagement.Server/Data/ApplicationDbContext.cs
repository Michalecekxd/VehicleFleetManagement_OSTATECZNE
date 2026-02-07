using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;
using VehicleFleetManagement.Server.Enums;
using VehicleFleetManagement.Server.Models.DataModels;
using VehicleFleetManagement.Server.Models.Identity;

public class ApplicationDbContext : IdentityDbContext<User, Role, int>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Vehicle> Vehicles { get; set; }
    //public DbSet<TractorUnit> TractorUnits { get; set; }
    //public DbSet<Vehicle> SemiTrailers { get; set; }
    //public DbSet<SemiTrailerTruck> SemiTrailerTrucks { get; set; }
    //public DbSet<RigidTruck> RigidTrucks { get; set; }
    //public DbSet<DeliveryVan> DeliveryVans { get; set; }
    public DbSet<Driver> Drivers { get; set; }
    public DbSet<Delivery> Deliveries { get; set; }
    public DbSet<Breakdown> Breakdowns { get; set; }
    public DbSet<Order> Orders { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Role>().ToTable("Roles");
        modelBuilder.Entity<User>().ToTable("Users");
        modelBuilder.Entity<IdentityUserRole<int>>().ToTable("UserRoles");
        modelBuilder.Entity<IdentityUserClaim<int>>().ToTable("UserClaims");
        modelBuilder.Entity<IdentityUserLogin<int>>().ToTable("UserLogins");
        modelBuilder.Entity<IdentityRoleClaim<int>>().ToTable("RoleClaims");
        modelBuilder.Entity<IdentityUserToken<int>>().ToTable("UserTokens");


        modelBuilder.Entity<Role>().HasData(
            new Role
            {
                Id = (int)UserRole.Manager,
                Name = UserRole.Manager.ToString(),
                NormalizedName = UserRole.Manager.ToString().ToUpper(),
                UserRole = UserRole.Manager
            },
            new Role
            {
                Id = (int)UserRole.Driver,
                Name = UserRole.Driver.ToString(),
                NormalizedName = UserRole.Driver.ToString().ToUpper(),
                UserRole = UserRole.Driver
            }
        );

        //builder.Entity<Vehicle>()
        //           .HasDiscriminator<int>("Type")
        //           .HasValue<Vehicle>(0)
        //           .HasValue<TractorUnit>((int)VehicleType.TractorUnit)
        //           .HasValue<SemiTrailer>((int)VehicleType.SemiTrailer)
        //           .HasValue<SemiTrailerTruck>((int)VehicleType.SemiTrailerTruck)
        //           .HasValue<RigidTruck>((int)VehicleType.RigidTruck)
        //           .HasValue<DeliveryVan>((int)VehicleType.DeliveryVan);



        //modelBuilder.Entity<Vehicle>()
        //.Property(v => v.Type)
        //.HasConversion<int>();      // without Discriminator 


        //modelBuilder.Entity<TractorUnit>()
        //     .Property(t => t.Model)
        //     .HasColumnName("Model");

        //modelBuilder.Entity<DeliveryVan>()
        //    .Property(d => d.Model)
        //    .HasColumnName("Model");

        //modelBuilder.Entity<RigidTruck>()
        //    .Property(r => r.Model)
        //    .HasColumnName("Model");



        //modelBuilder.Entity<RigidTruck>()
        //         .Property(r => r.Capacity)
        //         .HasColumnName("Capacity");

        //modelBuilder.Entity<SemiTrailer>()
        //         .Property(s => s.Capacity)
        //         .HasColumnName("Capacity");

        //modelBuilder.Entity<DeliveryVan>()
        //    .Property(d => d.Capacity)
        //    .HasColumnName("Capacity");



        //modelBuilder.Entity<SemiTrailer>()
        //         .Property(s => s.Bodywork)
        //         .HasColumnName("Bodywork");

        //modelBuilder.Entity<RigidTruck>()
        //         .Property(r => r.Bodywork)
        //         .HasColumnName("Bodywork");

        //modelBuilder.Entity<DeliveryVan>()
        //         .Property(r => r.Bodywork)
        //         .HasColumnName("Bodywork");



        //we have VehicleId in Delivery and DeliveryId in Vehicle so we must configure the relationship- (without this we will get an error)
        //modelBuilder.Entity<Vehicle>()
        //    .HasOne(v => v.Delivery)
        //    .WithOne(d => d.Vehicle)
        //    .HasForeignKey<Delivery>(d => d.VehicleId); // which side is the principal



        //modelBuilder.Entity<Vehicle>()
        //    .HasOne(v => v.Driver)
        //    .WithOne(d => d.Vehicle)
        //    .HasForeignKey<Driver>(d => d.VehicleId);

        //modelBuilder.Entity<Vehicle>()
        //       .HasMany(v => v.Breakdowns)
        //       .WithOne(b => b.Vehicle)
        //       .HasForeignKey(b => b.VehicleId);
    }

    //public override int SaveChanges()
    //{
    //    UpdateLastModified();
    //    return base.SaveChanges();
    //}

    //public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    //{
    //    UpdateLastModified();
    //    return base.SaveChangesAsync(cancellationToken);
    //}

    //private void UpdateLastModified()
    //{
    //    var entries = ChangeTracker.Entries<Vehicle>()
    //        .Where(e => e.State == EntityState.Modified || e.State == EntityState.Added);

    //    foreach (var entry in entries)
    //    {
    //        if (entry.Entity.Status == VehicleStatus.OnTheRoad) 
    //        {
    //            entry.Entity.LastModified = DateTime.UtcNow; 
    //        }
    //        else if (entry.Entity.Status == VehicleStatus.Available && entry.State == EntityState.Modified)
    //        {
    //            entry.Entity.LastModified = DateTime.UtcNow;
    //        }
    //    }
    //}
}
