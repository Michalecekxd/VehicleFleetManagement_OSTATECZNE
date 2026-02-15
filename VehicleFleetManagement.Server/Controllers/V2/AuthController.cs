using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using VehicleFleetManagement.Server.Enums;
using VehicleFleetManagement.Server.Models.Identity;

namespace VehicleFleetManagement.Server.Controllers.V2
{
    [ApiVersion("2.0")]
    [Route("api/v{version:apiVersion}/auth")]
    [ApiController]
    public class AuthController : ControllerBase   // moze tez sie nazywac zamiast AuthController - "AccountController"
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
        public async Task<IActionResult> LoginV1([FromBody] LoginModel model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return Unauthorized(new { message = "Invalid credentials." });

            var result = await _signInManager.PasswordSignInAsync(user, model.Password, true, false);
            if (!result.Succeeded)
                return Unauthorized(new { message = "Invalid credentials." });

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault();

            return Ok(new { message = "Logged in successfully (v1).", role = role });
        }

        /// .... refresh (odswiezenie tokena), forgot-password, reset-password, confirm-email, logout...
    }
}
