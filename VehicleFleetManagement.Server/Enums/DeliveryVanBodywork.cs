using System.ComponentModel.DataAnnotations;

namespace VehicleFleetManagement.Server.Enums
{
    public enum DeliveryVanBodywork
    {
        [Display(Name = "Plandeka/firana")]
        Curtainsider = 1,
        [Display(Name = "Furgon(blaszak)")]
        BoxTruck = 2,
        [Display(Name = "Kontener")]
        Container = 3,
        [Display(Name = "Wywrotka")]
        Tipper = 4,
        [Display(Name = "Doka")]
        Dropside = 5,
        [Display(Name = "Chłodnia")]
        Refrigerated = 6,
        [Display(Name = "Izoterma")]
        Isothermal = 7,
        [Display(Name = "Autolaweta")]
        TowTruck = 8
    }
}
