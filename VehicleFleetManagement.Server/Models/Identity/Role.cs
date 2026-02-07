using Microsoft.AspNetCore.Identity;
using VehicleFleetManagement.Server.Enums;

namespace VehicleFleetManagement.Server.Models.Identity
{
    public class Role : IdentityRole<int>
    {
        public Role() { }
        public Role(string roleName) : base(roleName) { }
        public UserRole UserRole { get; set; }
        public Role(int id, string name, UserRole userRole) : base(name)
        {
            Id = id;
            UserRole = userRole;
        }
    }
}
