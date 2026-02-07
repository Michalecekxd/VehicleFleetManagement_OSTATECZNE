using System.Collections.Generic;

namespace VehicleFleetManagement.Server.Models.DataModels
{
    public class Order
    {
        public int Id { get; set; }
        public bool IsCompleted { get; set; }
        public ICollection<Delivery> Deliveries { get; set; } = new List<Delivery>();
    }
}
