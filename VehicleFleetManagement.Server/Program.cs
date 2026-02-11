using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using VehicleFleetManagement.Server.Models.DataModels;
using VehicleFleetManagement.Server.Models.Identity;
using VehicleFleetManagement.Server.Models;
using VehicleFleetManagement.Server.Enums;

var builder = WebApplication.CreateBuilder(args);

// Add PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
  options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
        options => options.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

// Add Identity
builder.Services.AddIdentityApiEndpoints<User>(options => options.SignIn.RequireConfirmedAccount = false)
    .AddRoles<Role>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

// Add CORS support to allow the frontend to communicate with the backend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
             policy =>
             {
                 policy.WithOrigins("https://localhost:57838")  // Frontend domain
                       .AllowAnyMethod()
                       .AllowAnyHeader()
                       .AllowCredentials();
             });
});

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Loading configuration from appsettings.json
builder.Services.Configure<ManagerData>(builder.Configuration.GetSection("ManagerData"));
builder.Services.Configure<BaseLocation>(builder.Configuration.GetSection("BaseLocation"));

// Adding custom services
builder.Services.AddSingleton<WebSocketService>();
builder.Services.AddSingleton<ConfigService>();
builder.Services.AddSingleton<RouteService>();


var app = builder.Build();

app.UseCors("AllowFrontend");

await SeedManagerAccount(app.Services);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();  // Redirect HTTP to HTTPS
app.UseWebSockets();  // Enable WebSockets

// Map WebSocket endpoint
app.Map("/ws", async context =>
{
    using var scope = app.Services.CreateScope();
    var webSocketService = scope.ServiceProvider.GetRequiredService<WebSocketService>();
    await webSocketService.HandleWebSocketAsync(context);
});

// Only serve static files in Production (not in Development)
// In Development, frontend runs separately on port 57838 via Vite dev server
if (!app.Environment.IsDevelopment())
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

// Authentication and Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Map Controllers and Identity API
app.MapControllers();
app.MapIdentityApi<User>();

// Only fallback to index.html in Production
if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("index.html");
}

app.Run();

// Create Manager and assign them a role
async Task SeedManagerAccount(IServiceProvider serviceProvider)
{
    using var scope = serviceProvider.CreateScope();

    var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var configService = scope.ServiceProvider.GetRequiredService<ConfigService>();

    var (managerEmail, managerPassword) = configService.GetManagerCredentials();

    var manager = await userManager.FindByEmailAsync(managerEmail);
    if (manager == null)
    {
        var newManager = new User
        {
            UserName = managerEmail,
            Email = managerEmail,
            EmailConfirmed = true,
        };

        var result = await userManager.CreateAsync(newManager, managerPassword);
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(newManager, UserRole.Manager.ToString());
            await _context.SaveChangesAsync();
        }
        else
        {
            throw new Exception("Seeding manager account failed");
        }
    }
}
