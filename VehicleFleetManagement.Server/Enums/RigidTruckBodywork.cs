using System.ComponentModel.DataAnnotations;

namespace VehicleFleetManagement.Server.Enums
{
    public enum RigidTruckBodywork
    {
        [Display(Name = "Plandeka/firana")]
        Curtainsider = 1,
        [Display(Name = "Furgon(sztywna zabudowa)")]
        BoxTruck = 2,
        [Display(Name = "Wywrotka")]
        Tipper = 3,
        [Display(Name = "Wywrotka z hds")]
        TipperWithCrane = 4,
        [Display(Name = "Chłodnia")]
        Refrigerated = 5,
        [Display(Name = "Izoterma")]
        Isothermal = 6,
        [Display(Name = "Autolaweta")]
        TowTruck = 7
    }
}
