using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using VehicleFleetManagement.Server.Models.Identity;

namespace VehicleFleetManagement.Server.Models.DataModels
{
    public class Driver
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public Vehicle? Vehicle { get; set; }
        public bool IsBusy { get; set; }
    }
}