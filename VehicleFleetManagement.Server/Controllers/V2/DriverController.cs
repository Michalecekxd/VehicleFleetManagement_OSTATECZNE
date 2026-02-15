using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VehicleFleetManagement.Server.Enums;
using VehicleFleetManagement.Server.Models.DataModels;
using VehicleFleetManagement.Server.Models.Identity;

namespace VehicleFleetManagement.Server.Controllers.V2
{
    [ApiVersion("2.0")]
    [Route("api/driver")]
    [ApiController]
    public class DriverController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly ApplicationDbContext _context;

        public DriverController(UserManager<User> userManager, ApplicationDbContext context)
        {
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDrivers([FromQuery] bool withoutVehicle = false)
        {
            try
            {
                var driversQuery = _context.Drivers.Include(d => d.User).AsQueryable();

                if (withoutVehicle)
                {
                    driversQuery = driversQuery.Where(d => !_context.Vehicles.Any(v => v.DriverId == d.Id));
                }

                var drivers = await driversQuery
                    .OrderBy(d => d.Id)
                    .Select(d => new
                    {
                        d.Id,
                        d.User!.FirstName,
                        d.User!.LastName,
                        d.User!.Email,
                        d.User!.PhoneNumber,
                        d.IsBusy,
                        Vehicle = _context.Vehicles
                            .Where(v => v.DriverId == d.Id)
                            .Select(v => new {
                                v.Id,
                                v.Type,
                                TypeName = v.Type == VehicleType.TractorUnit ? "Ciągnik siodłowy" :
                                           v.Type == VehicleType.SemiTrailer ? "Naczepa" :
                                           v.Type == VehicleType.SemiTrailerTruck ? "Zestaw" :
                                           v.Type == VehicleType.RigidTruck ? "Ciężarówka sztywna" :
                                           v.Type == VehicleType.DeliveryVan ? "Samochód dostawczy" : "Nieznany"
                            })
                            .FirstOrDefault()
                    })
                    .ToListAsync();

                return Ok(drivers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }



        [HttpPost]
        public async Task<IActionResult> AddDriver([FromBody] AddDriverDto driverDto)
        {
            if (driverDto == null)
            {
                return BadRequest(new { message = "Driver data is required." });
            }

            var user = new User
            {
                FirstName = driverDto.FirstName,
                LastName = driverDto.LastName,
                UserName = driverDto.UserName,
                Email = driverDto.UserName,
                PhoneNumber = driverDto.PhoneNumber,
                DateJoined = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, driverDto.Password);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Failed to create user.",
                    errors = result.Errors.Select(e => e.Description).ToList()
                });
            }

            await _userManager.AddToRoleAsync(user, UserRole.Driver.ToString());

            var driver = new Driver
            {
                UserId = user.Id,
                IsBusy = false 
            };

            _context.Drivers.Add(driver);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                driver.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.PhoneNumber,
                driver.IsBusy
            });
        }

        [HttpPut("assign")]
        public async Task<IActionResult> AssignDriverToVehicle([FromBody] AssignDriverToVehicleDto dto)
        {
            try
            {
                var vehicle = await _context.Vehicles.FindAsync(dto.VehicleId);
                if (vehicle == null)
                {
                    return NotFound("Vehicle not found");
                }

                var driver = await _context.Drivers.FindAsync(dto.DriverId);
                if (driver == null)
                {
                    return NotFound("Driver not found");
                }

                if (vehicle.Type == VehicleType.SemiTrailerTruck && vehicle.SemiTrailerId.HasValue)
                {
                    var activeBreakdownsTractor = await _context.Breakdowns
                        .Where(b => b.VehicleId == vehicle.Id && b.EndedAt == null)
                        .ToListAsync();
                    var activeBreakdownsSemiTrailer = await _context.Breakdowns
                        .Where(b => b.VehicleId == vehicle.SemiTrailerId.Value && b.EndedAt == null)
                        .ToListAsync();

                    if (activeBreakdownsTractor.Any() || activeBreakdownsSemiTrailer.Any())
                    {
                        vehicle.Status = VehicleStatus.Damaged;
                    }
                    else
                    {
                        vehicle.Status = VehicleStatus.Available;
                    }
                }
                else
                {
                    var activeBreakdowns = await _context.Breakdowns
                        .Where(b => b.VehicleId == vehicle.Id && b.EndedAt == null)
                        .ToListAsync();

                    if (activeBreakdowns.Any())
                    {
                        vehicle.Status = VehicleStatus.Damaged;
                    }
                    else
                    {
                        if (vehicle.Type == VehicleType.TractorUnit || vehicle.Type == VehicleType.SemiTrailer)
                        {
                            vehicle.Status = null;
                        }
                        else if (vehicle.Type == VehicleType.TractorUnit && vehicle.SemiTrailerId != null)
                        {
                            vehicle.Status = VehicleStatus.Available;
                        }
                        else
                        {
                            vehicle.Status = VehicleStatus.Available;
                        }
                    }
                }

                vehicle.DriverId = dto.DriverId;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Driver assigned to vehicle successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }




        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDriver(int id)
        {
            var driver = await _context.Drivers.FindAsync(id);
            if (driver == null)
            {
                return NotFound("Driver not found");
            }

            var user = await _context.Users.FindAsync(driver.UserId);

            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.DriverId == id);
            
            if (vehicle != null)
            {
                vehicle.DriverId = null;

                var hasActiveBreakdowns = await _context.Breakdowns
                    .AnyAsync(b => b.VehicleId == vehicle.Id && b.EndedAt == null);

                if (hasActiveBreakdowns)
                {
                    vehicle.Status = VehicleStatus.Damaged;
                }
                else
                {
                    vehicle.Status = null; // ⬅️ NIEDOSTĘPNY
                }

                _context.Entry(vehicle).State = EntityState.Modified;
            }

            _context.Drivers.Remove(driver);
            if (user != null)
            {
                _context.Users.Remove(user);
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Driver and associated user deleted successfully" });
            }
            catch (DbUpdateConcurrencyException)
            {
                return NotFound("Driver was already deleted");
            }
        }


        [HttpGet("driverinfo")]
        [Authorize]
        public async Task<ActionResult<DriverDto>> GetCurrentDriver()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var driver = await _context.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == user.Id);

            if (driver == null) return NotFound("Driver not found");

            var vehicle = await _context.Vehicles
                .Where(v => v.DriverId == driver.Id)
                .Select(v => new VehicleDto
                {
                    Id = v.Id,
                    TypeName = v.Type == VehicleType.TractorUnit ? "Ciągnik siodłowy" :
                               v.Type == VehicleType.RigidTruck ? "Ciężarówka sztywna" :
                               v.Type == VehicleType.DeliveryVan ? "Samochód dostawczy" :
                               v.Type == VehicleType.SemiTrailer ? "Naczepa" :
                               v.Type == VehicleType.SemiTrailerTruck ? "Zestaw" :
                               "Inny"
                })
                .FirstOrDefaultAsync();

            var result = new DriverDto
            {
                Id = driver.Id,                        
                FirstName = driver.User?.FirstName ?? string.Empty,
                LastName = driver.User?.LastName ?? string.Empty,
                DateJoined = driver.User?.DateJoined ?? DateTime.MinValue, 
                Email = driver.User?.Email ?? string.Empty,
                PhoneNumber = driver.User?.PhoneNumber ?? string.Empty,
                Vehicle = vehicle
            };

            return Ok(result);
        }


    }

    public class AddDriverDto
    {
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
    }

    public class AssignDriverToVehicleDto
    {
        public int DriverId { get; set; }
        public int VehicleId { get; set; }
    }

    public class DriverDto
    {
        public int Id { get; set; }                
        public string FirstName { get; set; } = null!;
        public string LastName { get; set; } = null!;
        public DateTime DateJoined { get; set; }     
        public string Email { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public VehicleDto? Vehicle { get; set; }
    }

    public class VehicleDto
    {
        public int Id { get; set; }
        public string TypeName { get; set; } = null!;
    }

}