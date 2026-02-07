namespace VehicleFleetManagement.Server.Models.DataModels
{
    public class Breakdown
    {
        public int Id { get; set; }
        public int VehicleId { get; set; } 
        public Vehicle Vehicle { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime OccurredAt { get; set; }        
        public DateTime? EndedAt { get; set; }        
    }
}
