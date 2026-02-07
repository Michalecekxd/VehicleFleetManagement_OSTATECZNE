using System.ComponentModel.DataAnnotations;

namespace VehicleFleetManagement.Server.Enums
{
    public enum VehicleStatus
    {
        Available = 1,
        OnTheRoad = 2,
        ReturningToBase = 3,  
        Damaged = 4
    }
}
