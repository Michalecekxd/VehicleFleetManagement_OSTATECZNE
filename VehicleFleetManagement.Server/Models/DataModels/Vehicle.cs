using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using VehicleFleetManagement.Server.Enums;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using ExpressiveAnnotations.Attributes;

namespace VehicleFleetManagement.Server.Models.DataModels
{
    public class Vehicle
    {
        public int Id { get; set; }
        [Required(ErrorMessage = "Pole Numer rejestracyjny jest wymagane.")]
        public string RegistrationNumber { get; set; } = null!;
        [Required(ErrorMessage = "Pole Marka jest wymagane.")]
        public string Brand { get; set; } = null!;
        [RequiredIf("Type == 1 || Type == 4 || Type == 5", ErrorMessage = "Pole Model jest wymagane.")]
        public string? Model { get; set; }
        [Required(ErrorMessage = "Pole Rok produkcji jest wymagane.")]
        [Range(1900, 2100, ErrorMessage = "Rok produkcji musi być między 1900 a 2100.")]
        public int YearOfProduction { get; set; }
        public VehicleStatus? Status { get; set; }
        [Required(ErrorMessage = "Pole Typ pojazdu jest wymagane.")]
        public VehicleType Type { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public int? DriverId { get; set; }
        public Driver? Driver { get; set; }

        public List<Breakdown>? Breakdowns { get; set; } = [];   
        public List<Delivery>? Deliveries { get; set; } = [];   
        public int? SemiTrailerId { get; set; }
        [RequiredIf("Type == 2 || Type == 4 || Type == 5", ErrorMessage = "Pole Typ zabudowy jest wymagane.")]
        public int? BodyworkType { get; set; }
        [RequiredIf("Type == 2 || Type == 4 || Type == 5", ErrorMessage = "Ładowność jest wymagana.")]
        public double? Capacity { get; set; }
        public DateTime? LastModified { get; set; }
    }
}
