using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using VehicleFleetManagement.Server.Enums;
using VehicleFleetManagement.Server.Models.Identity;

namespace VehicleFleetManagement.Server.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        //private readonly RoleManager<Role> _roleManager;
        private readonly SignInManager<User> _signInManager;
        public AuthController(UserManager<User> userManager, SignInManager<User> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
        }

        //public AuthController(UserManager<User> userManager, RoleManager<Role> roleManager, SignInManager<User> signInManager)
        //{
        //    _userManager = userManager;
        //    _roleManager = roleManager;
        //    _signInManager = signInManager;
        //}


        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { message = "Invalid data." });
            }

            var user = new User { UserName = model.Email, Email = model.Email, PhoneNumber = model.PhoneNumber };
            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                var roleResult = await _userManager.AddToRoleAsync(user, UserRole.Driver.ToString());

                if (roleResult.Succeeded)
                {
                    return Ok(new { message = "Registration successful and role assigned." });
                }
                else
                {
                    return BadRequest(new { message = "Role assignment failed.", errors = roleResult.Errors });
                }
            }

            // If errors occurred during create user
            var errorMessages = result.Errors.Select(e => e.Description).ToList();
            return BadRequest(new { message = "Registration failed", errors = errorMessages });
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return Unauthorized("Nieprawidłowe dane logowania");

            var result = await _signInManager.PasswordSignInAsync(user, model.Password, true, false);
            if (!result.Succeeded)
                return Unauthorized("Nieprawidłowe dane logowania");

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault();

            return Ok(new { 
                message = "Zalogowano pomyślnie",
                role = role
            });
        }
    }
}
