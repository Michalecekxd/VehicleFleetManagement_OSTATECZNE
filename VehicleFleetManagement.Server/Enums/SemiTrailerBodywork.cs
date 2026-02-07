using System.ComponentModel.DataAnnotations;

namespace VehicleFleetManagement.Server.Enums
{
    public enum SemiTrailerBodywork
    {
        [Display(Name = "Kurtynowa(firanka/plandeka)")]
        Curtainsider = 1,
        [Display(Name = "Wywrotka")]
        Tipper = 2,
        [Display(Name = "Platforma")]
        FlatBed = 3,
        [Display(Name = "Burtowa")]
        Dropside = 4,
        [Display(Name = "Niskopodwoziowa")]
        LowBed = 5,
        [Display(Name = "Chłodnia")]
        Refrigerated = 6,
        [Display(Name = "Izoterma")]
        Isothermal = 7,
        [Display(Name = "Kłonicowa")]
        Stanchion = 8
    }
}
