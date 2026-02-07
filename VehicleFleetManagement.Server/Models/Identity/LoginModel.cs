using System.ComponentModel.DataAnnotations;

namespace VehicleFleetManagement.Server.Models.Identity
{
    public class LoginModel
    {

        [Required(ErrorMessage = "Email jest wymagany")]
        [EmailAddress(ErrorMessage = "Niepoprawny format email")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Hasło jest wymagane")]
        [MinLength(6, ErrorMessage = "Hasło musi mieć co najmniej 6 znaków")]
        public string Password { get; set; } = null!;
    }
}
