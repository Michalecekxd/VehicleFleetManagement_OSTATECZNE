namespace VehicleFleetManagement.Server.Models
{
    public class Config
    {
        public BaseLocation? BaseLocation { get; set; }
        public ManagerData? ManagerData { get; set; }
    }

    public class BaseLocation
    {
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }

    public class ManagerData
    {
        public string? Email { get; set; }
        public string? Password { get; set; }
    }
}
