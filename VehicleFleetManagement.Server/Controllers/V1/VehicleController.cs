using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleFleetManagement.Server.Enums;
using VehicleFleetManagement.Server.Models.DataModels;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VehicleFleetManagement.Server.Models;

namespace VehicleFleetManagement.Server.Controllers.V1
{
    [ApiVersion("1.0")]
    [Route("api/vehicle")]
    [ApiController] 
    //- mozna zastosowac, wtedy nie piszemy (!ModelState.IsValid), bo samo robi to za nas (sprawdza z modelu Required, Range itp). 
    public class VehicleController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ConfigService _configService; 

        public VehicleController(ApplicationDbContext context, ConfigService configService)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _configService = configService ?? throw new ArgumentNullException(nameof(configService)); 
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetVehicles([FromQuery] VehicleStatus? status, [FromQuery] VehicleType? type)
        {
            try
            {
                IQueryable<Vehicle> vehiclesQuery = _context.Vehicles.AsQueryable();

                if (status.HasValue)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.Status == status.Value);
                }

                if (type.HasValue)
                {
                    vehiclesQuery = vehiclesQuery.Where(v => v.Type == type.Value);
                }

                var vehicles = await vehiclesQuery.Select(v => new
                {
                    v.Id,
                    v.RegistrationNumber,
                    v.Brand,
                    v.Model,
                    v.YearOfProduction,
                    v.Status,
                    v.Type,
                    v.Latitude,
                    v.Longitude,
                    v.SemiTrailerId,
                    v.BodyworkType,
                    v.Capacity,
                    v.LastModified,
                    Driver = v.Driver != null ? new
                    {
                        v.Driver.Id,
                        v.Driver.User.FirstName,
                        v.Driver.User.LastName,
                        v.Driver.User.PhoneNumber
                    } : null,
                    Deliveries = v.Status == VehicleStatus.OnTheRoad
                        ? _context.Deliveries
                            .Where(d => d.VehicleId == v.Id)
                            .Select(d => new
                            {
                                d.Id,
                                d.LoadDescription,
                                d.OrderId,
                                d.Status,
                                d.StartLatitude,
                                d.StartLongitude,
                                d.EndLatitude,
                                d.EndLongitude,
                                d.StartedAt,
                                d.CompletedAt,
                                d.ClientName,
                                d.ClientPhone,
                                d.StartAddress,
                                d.EndAddress,
                            }).ToList()
                        : null,
                    SemiTrailer = v.SemiTrailerId.HasValue ? new
                    {
                        RegistrationNumber = _context.Vehicles
                            .Where(x => x.Id == v.SemiTrailerId.Value)
                            .Select(x => x.RegistrationNumber).FirstOrDefault(),

                        Brand = _context.Vehicles
                            .Where(x => x.Id == v.SemiTrailerId.Value)
                            .Select(x => x.Brand).FirstOrDefault(),

                        BodyworkType = _context.Vehicles
                            .Where(x => x.Id == v.SemiTrailerId.Value)
                            .Select(x => x.BodyworkType).FirstOrDefault(),

                        Capacity = _context.Vehicles
                            .Where(x => x.Id == v.SemiTrailerId.Value)
                            .Select(x => x.Capacity).FirstOrDefault()
                    } : null
                }).ToListAsync();

                return Ok(vehicles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetVehicleById(int id)
        {
            try
            {
                var vehicleData = await _context.Vehicles
                    .Include(v => v.Driver)
                        .ThenInclude(d => d!.User)
                    .Include(v => v.Breakdowns)
                    .Include(v => v.Deliveries)
                    .FirstOrDefaultAsync(v => v.Id == id);

                if (vehicleData == null)
                {
                    return NotFound($"Vehicle {id} was not found.");
                }

                List<Breakdown> allBreakdowns = new List<Breakdown>();
                if (vehicleData.Breakdowns != null)
                {
                    allBreakdowns.AddRange(vehicleData.Breakdowns);
                }

                if (vehicleData.Type == VehicleType.SemiTrailerTruck && vehicleData.SemiTrailerId.HasValue)
                {
                    var semiTrailerBreakdowns = await _context.Breakdowns
                        .Where(b => b.VehicleId == vehicleData.SemiTrailerId.Value)
                        .ToListAsync();
                    allBreakdowns.AddRange(semiTrailerBreakdowns);
                }

                var result = new
                {
                    vehicleData.Id,
                    vehicleData.RegistrationNumber,
                    vehicleData.Brand,
                    vehicleData.Model,
                    vehicleData.YearOfProduction,
                    vehicleData.Status,
                    vehicleData.Type,
                    vehicleData.SemiTrailerId,
                    vehicleData.Latitude,
                    vehicleData.Longitude,
                    vehicleData.BodyworkType,
                    vehicleData.Capacity,
                    Driver = vehicleData.Driver != null ? new
                    {
                        vehicleData.Driver.Id,
                        vehicleData.Driver.User!.FirstName,
                        vehicleData.Driver.User!.LastName
                    } : null,

                    Breakdowns = allBreakdowns.Select(b => new
                    {
                        b.Id,
                        b.Description,
                        b.OccurredAt,
                        b.EndedAt,
                        b.VehicleId
                    }).ToList(),

                    deliveries = vehicleData.Deliveries!.Select(d => new
                    {
                        d.Id,
                        d.LoadDescription,
                        d.OrderId,
                        d.StartLatitude,
                        d.StartLongitude,
                        d.EndLatitude,
                        d.EndLongitude,
                        d.StartAddress,
                        d.EndAddress,
                        Status = d.Status.ToString(),
                        d.StartedAt,
                        d.CompletedAt
                    }).ToList(),

                    semiTrailerRegistrationNumber = vehicleData.SemiTrailerId.HasValue
                        ? _context.Vehicles.Where(x => x.Id == vehicleData.SemiTrailerId.Value)
                            .Select(x => x.RegistrationNumber).FirstOrDefault()
                        : null,
                    semiTrailerBrand = vehicleData.SemiTrailerId.HasValue
                        ? _context.Vehicles.Where(x => x.Id == vehicleData.SemiTrailerId.Value)
                            .Select(x => x.Brand).FirstOrDefault()
                        : null,
                    semiTrailerYearOfProduction = vehicleData.SemiTrailerId.HasValue
                        ? (int?)_context.Vehicles.Where(x => x.Id == vehicleData.SemiTrailerId.Value)
                            .Select(x => x.YearOfProduction).FirstOrDefault()
                        : null,
                    semiTrailerBodyworkType = vehicleData.SemiTrailerId.HasValue
                        ? _context.Vehicles.Where(x => x.Id == vehicleData.SemiTrailerId.Value)
                            .Select(x => x.BodyworkType).FirstOrDefault()
                        : null,
                    semiTrailerCapacity = vehicleData.SemiTrailerId.HasValue
                        ? _context.Vehicles.Where(x => x.Id == vehicleData.SemiTrailerId.Value)
                            .Select(x => x.Capacity).FirstOrDefault()
                        : null
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, $"Internal server error: {msg}");
            }
        }




        [HttpPost]
        public async Task<ActionResult<Vehicle>> AddVehicle([FromBody] Vehicle vehicle)
        {
            //if (!ModelState.IsValid)
            //    return BadRequest(ModelState);

            // Walidacja warunkowa dla BodyworkType i Capacity (wejscie w devtools i skasowanie required z pol bodywork i capacity- bedzie dalo sie wyslac puste dane, chyba ze uzyjemy warunkow nizej) 
            //var typesRequiringBodywork = new[] { VehicleType.RigidTruck, VehicleType.DeliveryVan, VehicleType.SemiTrailer };
            //if (typesRequiringBodywork.Contains(vehicle.Type))
            //{
            //    if (!vehicle.BodyworkType.HasValue)
            //    {
            //        return BadRequest("BodyworkType is required for this vehicle type.");
            //    }
            //    if (!vehicle.Capacity.HasValue)
            //    {
            //        return BadRequest("Capacity is required for this vehicle type.");
            //    }
            //}

            try
            {
                //vehicle.RegistrationNumber = null!; // jeśli pole w DB jest NOT NULL

                _context.Vehicles.Add(vehicle);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetVehicleById), new { id = vehicle.Id }, vehicle);
            }
            catch (Exception ex)
            {
                var msg = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, $"Internal server error: {msg}");
            }
            //catch (Exception ex)
            //{
            //    return StatusCode(500, $"Internal server error: {ex.Message}");
            //}
        }



        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateVehicleToSemiTrailerTruck(int id, [FromBody] SemiTrailerTruckUpdateDTO updateData)
        {
            if (updateData == null)
            {
                return BadRequest("Update data is required.");
            }

            if (updateData.SemiTrailerId <= 0)
            {
                return BadRequest("SemiTrailerId must be a valid ID.");
            }

            try
            {
                Vehicle? tractorUnit = await _context.Vehicles.FindAsync(id);
                if (tractorUnit == null)
                {
                    return NotFound($"Tractor Unit {id} was not found.");
                }

                Vehicle? semiTrailer = await _context.Vehicles.FindAsync(updateData.SemiTrailerId);
                if (semiTrailer == null)
                {
                    return NotFound($"SemiTrailer {updateData.SemiTrailerId} was not found.");
                }

                if (tractorUnit.Type != VehicleType.TractorUnit)
                {
                    return BadRequest($"Vehicle {id} is not a TractorUnit.");
                }

                bool isAlreadyAssigned = _context.Vehicles.Any(v => v.Type == VehicleType.SemiTrailerTruck && v.SemiTrailerId == updateData.SemiTrailerId);
                if (isAlreadyAssigned)
                {
                    return BadRequest($"SemiTrailer {updateData.SemiTrailerId} is already assigned to another SemiTrailerTruck.");
                }

                VehicleStatus? newStatus = (tractorUnit.Status == VehicleStatus.Damaged || semiTrailer.Status == VehicleStatus.Damaged)
                    ? VehicleStatus.Damaged
                    : (tractorUnit.DriverId == null ? (VehicleStatus?)null : VehicleStatus.Available);

                var baseLocation = _configService.GetBaseLocation();

                tractorUnit.Type = VehicleType.SemiTrailerTruck;
                tractorUnit.SemiTrailerId = updateData.SemiTrailerId;
                tractorUnit.Status = newStatus;
                tractorUnit.Latitude = Math.Round(baseLocation.Latitude, 6); 
                tractorUnit.Longitude = Math.Round(baseLocation.Longitude, 6); 

                _context.Entry(tractorUnit).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok(tractorUnit);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!VehicleExists(id))
                {
                    return NotFound($"Vehicle {id} does not exist.");
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }




        [HttpPut("split/{id}")]
        public async Task<IActionResult> SplitSemiTrailerTruck(int id)
        {
            try
            {
                var semiTrailerTruck = await _context.Vehicles.FindAsync(id);
                if (semiTrailerTruck == null)
                {
                    return NotFound($"Semi-trailer truck with ID {id} not found.");
                }

                if (semiTrailerTruck.Type != VehicleType.SemiTrailerTruck)
                {
                    return BadRequest("This vehicle is not a semi-trailer truck.");
                }

                var trailerId = semiTrailerTruck.SemiTrailerId;

                semiTrailerTruck.Type = VehicleType.TractorUnit;
                semiTrailerTruck.SemiTrailerId = null;
                await _context.SaveChangesAsync();

                semiTrailerTruck.Status = null;
                _context.Entry(semiTrailerTruck).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                bool tractorHasActiveBreakdowns = await _context.Breakdowns
                    .AnyAsync(b => b.VehicleId == semiTrailerTruck.Id && b.EndedAt == null);
                if (tractorHasActiveBreakdowns)
                {
                    semiTrailerTruck.Status = VehicleStatus.Damaged;
                    _context.Entry(semiTrailerTruck).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }

                if (trailerId.HasValue)
                {
                    var trailer = await _context.Vehicles.FindAsync(trailerId.Value);
                    if (trailer != null)
                    {
                        trailer.Status = null;
                        _context.Entry(trailer).State = EntityState.Modified;
                        await _context.SaveChangesAsync();

                        bool trailerHasActiveBreakdowns = await _context.Breakdowns
                            .AnyAsync(b => b.VehicleId == trailer.Id && b.EndedAt == null);
                        if (trailerHasActiveBreakdowns)
                        {
                            trailer.Status = VehicleStatus.Damaged;
                            _context.Entry(trailer).State = EntityState.Modified;
                            await _context.SaveChangesAsync();
                        }
                    }
                }

                return Ok(semiTrailerTruck);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }



        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehicle(int id, [FromQuery] int vehicleType)
        {
            try
            {
                var vehicle = await _context.Vehicles
                    .Include(v => v.Driver)
                    .FirstOrDefaultAsync(v => v.Id == id);

                if (vehicle == null)
                {
                    return NotFound($"Vehicle with ID {id} not found.");
                }

                // 1️⃣ Jeżeli pojazd ma kierowcę – sprzątamy jego stan
                if (vehicle.DriverId.HasValue && vehicle.Driver != null)
                {
                    // aktywne dostawy realizowane tym pojazdem
                    var activeDeliveries = await _context.Deliveries
                        .Where(d => d.VehicleId == vehicle.Id && d.CompletedAt == null)
                        .ToListAsync();

                    foreach (var delivery in activeDeliveries)
                    {
                        delivery.Status = DeliveryStatus.Canceled; // albo Interrupted
                        delivery.CompletedAt = DateTime.UtcNow;
                    }

                    vehicle.Driver.IsBusy = false;
                }

                // 2️⃣ Odpięcie kierowcy
                vehicle.DriverId = null;

                // 3️⃣ Jeśli to zestaw – usuń naczepę
                if ((VehicleType)vehicleType == VehicleType.SemiTrailerTruck &&
                    vehicle.SemiTrailerId.HasValue)
                {
                    var semiTrailer = await _context.Vehicles.FindAsync(vehicle.SemiTrailerId.Value);
                    if (semiTrailer != null)
                    {
                        _context.Vehicles.Remove(semiTrailer);
                    }
                }

                // 4️⃣ Usuń pojazd główny
                _context.Vehicles.Remove(vehicle);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("unassign-driver/{id}")]
        public async Task<IActionResult> UnassignDriver(int id)
        {
            try
            {
                var vehicle = await _context.Vehicles.FindAsync(id);
                if (vehicle == null)
                {
                    return NotFound("Vehicle not found");
                }

                vehicle.DriverId = null;

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
                        vehicle.Status = null;
                    }

                    var semiTrailer = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == vehicle.SemiTrailerId.Value);
                    if (semiTrailer != null)
                    {
                        if (activeBreakdownsSemiTrailer.Any())
                        {
                            semiTrailer.Status = VehicleStatus.Damaged;
                        }
                        else
                        {
                            semiTrailer.Status = null;
                        }
                        _context.Entry(semiTrailer).State = EntityState.Modified;
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
                        vehicle.Status = null;
                    }
                }

                _context.Entry(vehicle).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                object response;
                if (vehicle.Type == VehicleType.SemiTrailerTruck && vehicle.SemiTrailerId.HasValue)
                {
                    var semiTrailer = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == vehicle.SemiTrailerId.Value);
                    response = new
                    {
                        vehicle.Id,
                        vehicle.RegistrationNumber,
                        vehicle.Brand,
                        vehicle.Model,
                        vehicle.YearOfProduction,
                        vehicle.Status,
                        vehicle.Type,
                        vehicle.Latitude,
                        vehicle.Longitude,
                        vehicle.SemiTrailerId,
                        vehicle.BodyworkType,
                        vehicle.Capacity,
                        vehicle.LastModified,
                        Driver = (object?)null,
                        semiTrailerRegistrationNumber = semiTrailer?.RegistrationNumber,
                        semiTrailerBrand = semiTrailer?.Brand,
                        semiTrailerYearOfProduction = semiTrailer?.YearOfProduction,
                        semiTrailerBodyworkType = semiTrailer?.BodyworkType,
                        semiTrailerCapacity = semiTrailer?.Capacity
                    };
                }
                else
                {
                    response = new
                    {
                        vehicle.Id,
                        vehicle.RegistrationNumber,
                        vehicle.Brand,
                        vehicle.Model,
                        vehicle.YearOfProduction,
                        vehicle.Status,
                        vehicle.Type,
                        vehicle.Latitude,
                        vehicle.Longitude,
                        vehicle.BodyworkType,
                        vehicle.Capacity,
                        vehicle.LastModified,
                        Driver = (object?)null
                    };
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }


        [HttpGet("check")]
        public async Task<IActionResult> CheckRegistrationNumber([FromQuery] string registrationNumber)
        {
            if (string.IsNullOrWhiteSpace(registrationNumber))
            {
                return BadRequest("Registration Number is required.");
            }

            bool exists = await _context.Vehicles
                .AnyAsync(v => v.RegistrationNumber.ToLower() == registrationNumber.ToLower());

            return Ok(new { exists });
        }

        private bool VehicleExists(int id)
        {
            return _context.Vehicles.Any(e => e.Id == id);
        }

    }
    public class SemiTrailerTruckUpdateDTO
    {
        public int SemiTrailerId { get; set; }
    }
}


