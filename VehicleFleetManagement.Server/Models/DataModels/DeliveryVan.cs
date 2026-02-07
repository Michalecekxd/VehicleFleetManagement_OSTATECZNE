using VehicleFleetManagement.Server.Enums;

namespace VehicleFleetManagement.Server.Models.DataModels
{
    public class DeliveryVan 
    {
        public string Model { get; set; } = null!;
        public DeliveryVanBodywork Bodywork { get; set; }
        public double Capacity { get; set; }
    }
}
