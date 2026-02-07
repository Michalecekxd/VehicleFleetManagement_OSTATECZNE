using System.ComponentModel.DataAnnotations;
using VehicleFleetManagement.Server.Enums;

namespace VehicleFleetManagement.Server.Models.DataModels
{
    public class Delivery
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public Vehicle Vehicle { get; set; } = null!;
        public int DriverId { get; set; }
        public Driver Driver { get; set; } = null!;
        [Required(ErrorMessage = "Pole Opis towaru jest wymagane.")]
        public string LoadDescription { get; set; } = null!;
        public int OrderId { get; set; } 
        public Order Order { get; set; }  = null!;
        public DeliveryStatus Status { get; set; }
        public double StartLatitude { get; set; }
        public double StartLongitude { get; set; }
        public double EndLatitude { get; set; }
        public double EndLongitude { get; set; }
        [Required(ErrorMessage = "Pole Adres początkowy jest wymagane.")]
        public string StartAddress { get; set; } = null!;
        [Required(ErrorMessage = "Pole Adres docelowy jest wymagane.")]
        public string EndAddress { get; set; } = null!;
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? ClientName { get; set; }
        public string? ClientPhone { get; set; }
    }
}
