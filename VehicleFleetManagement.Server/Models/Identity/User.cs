using Microsoft.AspNetCore.Identity;
using VehicleFleetManagement.Server.Enums;

namespace VehicleFleetManagement.Server.Models.Identity
{
    public class User : IdentityUser<int>
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public DateTime DateJoined { get; set; } = DateTime.UtcNow;
    }
}
