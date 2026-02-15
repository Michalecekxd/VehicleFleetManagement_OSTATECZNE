using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Drawing;
using VehicleFleetManagement.Server.Enums;
using VehicleFleetManagement.Server.Models.DataModels;

namespace VehicleFleetManagement.Server.Controllers.V1
{
    [ApiVersion("1.0")]
    [Route("api/breakdown")]
    [ApiController]
    public class BreakdownController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly WebSocketService _webSocketService;
        private readonly ConfigService _configService; 


        public BreakdownController(ApplicationDbContext context, WebSocketService webSocketService,  ConfigService configService)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _webSocketService = webSocketService;
            _configService = configService;
        }

        [HttpPost]
        public async Task<ActionResult<Breakdown>> AddBreakdown([FromQuery] int vehicleId, [FromBody] BreakdownDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Description))
                    return BadRequest("Description is required");

                var vehicle = await _context.Vehicles
                    .Include(v => v.Driver)
                    .FirstOrDefaultAsync(v => v.Id == vehicleId);
                if (vehicle == null)
                    return NotFound($"Vehicle {vehicleId} was not found");

                DateTime occurredAt = DateTime.SpecifyKind(dto.OccurredAt ?? DateTime.UtcNow, DateTimeKind.Utc);

                var breakdown = new Breakdown
                {
                    VehicleId = vehicleId,
                    Description = dto.Description,
                    OccurredAt = occurredAt,
                    EndedAt = null
                };

                _context.Breakdowns.Add(breakdown);

                // Dla naczepy musimy znaleźć zestaw (ciągnik), aby sprawdzić jego status i wykonać akcje
                Vehicle? set = null;
                if (vehicle.Type == VehicleType.SemiTrailer)
                {
                    set = await _context.Vehicles
                        .Include(v => v.Driver)
                        .FirstOrDefaultAsync(v => v.Type == VehicleType.SemiTrailerTruck && v.SemiTrailerId == vehicle.Id);
                }

                // Sprawdź czy pojazd (lub zestaw dla naczepy) był w trasie lub wraca do bazy
                Vehicle? vehicleToCheck = set ?? vehicle;
                
                // Upewnij się, że vehicleToCheck ma załadowanego kierowcę
                if (vehicleToCheck != null && vehicleToCheck.DriverId.HasValue && vehicleToCheck.Driver == null)
                {
                    await _context.Entry(vehicleToCheck)
                        .Reference(v => v.Driver)
                        .LoadAsync();
                }

                if (vehicleToCheck == null)
                    return StatusCode(500, "VehicleToCheck should never be null.");
                
                bool wasOnTheRoad = vehicleToCheck.Status == VehicleStatus.OnTheRoad || 
                                   vehicleToCheck.Status == VehicleStatus.ReturningToBase;

                // Zmień status pojazdu na Damaged
                if (vehicle.Type == VehicleType.SemiTrailer)
                {
                    if (set != null)
                    {
                        set.Status = VehicleStatus.Damaged;
                        _context.Entry(set).State = EntityState.Modified;
                    }
                    else
                    {
                        vehicle.Status = VehicleStatus.Damaged;
                        _context.Entry(vehicle).State = EntityState.Modified;
                    }
                }
                else
                {
                    vehicle.Status = VehicleStatus.Damaged;
                    _context.Entry(vehicle).State = EntityState.Modified;
                }

                // Jeśli pojazd był w trasie, anuluj symulację i dostawę, teleportuj pojazd do bazy
                if (wasOnTheRoad && vehicleToCheck != null)
                {
                    // 1. Anuluj symulację jazdy (dla zestawu używamy ID ciągnika, nie naczepy)
                    await _webSocketService.CancelSimulationAsync(vehicleToCheck.Id);

                    // 2. Anuluj wszystkie aktywne dostawy (InProgress i Pending) dla tego pojazdu
                    var activeDeliveries = await _context.Deliveries
                        .Include(d => d.Order)
                        .Where(d =>
                            d.VehicleId == vehicleToCheck.Id &&
                            (d.Status == DeliveryStatus.InProgress || d.Status == DeliveryStatus.Pending))
                        .ToListAsync();

                    // Zbierz wszystkie zlecenia związane z pojazdem (nie tylko te z aktywnymi dostawami)
                    var allVehicleDeliveries = await _context.Deliveries
                        .Include(d => d.Order)
                        .Where(d => d.VehicleId == vehicleToCheck.Id)
                        .ToListAsync();

                    var allAffectedOrders = allVehicleDeliveries
                        .Where(d => d.Order != null)
                        .Select(d => d.Order!)
                        .Distinct()
                        .ToList();

                    if (activeDeliveries.Any())
                    {
                        // Zbierz ID dostaw, które będą anulowane
                        var deliveryIdsToCancel = activeDeliveries.Select(d => d.Id).ToList();

                        // Sprawdź PRZED anulowaniem, czy są inne aktywne dostawy w zleceniach
                        var ordersToClose = new List<Order>();
                        foreach (var order in allAffectedOrders)
                        {
                            var hasOtherActiveDeliveries = await _context.Deliveries
                                .AnyAsync(d => d.OrderId == order.Id && 
                                    !deliveryIdsToCancel.Contains(d.Id) &&
                                    d.Status != DeliveryStatus.Canceled && 
                                    d.Status != DeliveryStatus.Completed);

                            if (!hasOtherActiveDeliveries)
                            {
                                ordersToClose.Add(order);
                            }
                        }

                        // Anuluj wszystkie aktywne dostawy
                        foreach (var delivery in activeDeliveries)
                        {
                            delivery.Status = DeliveryStatus.Canceled;
                        }

                        // Zamknij zlecenia, które nie mają innych aktywnych dostaw
                        foreach (var order in ordersToClose)
                        {
                            order.IsCompleted = true;
                        }
                    }
                    else
                    {
                        // Jeśli nie ma aktywnych dostaw, sprawdź czy wszystkie dostawy są zakończone/anulowane
                        // i zamknij zlecenia, które mają wszystkie dostawy Completed lub Canceled
                        foreach (var order in allAffectedOrders)
                        {
                            var hasActiveDeliveries = await _context.Deliveries
                                .AnyAsync(d => d.OrderId == order.Id && 
                                    d.Status != DeliveryStatus.Canceled && 
                                    d.Status != DeliveryStatus.Completed);

                            if (!hasActiveDeliveries)
                            {
                                order.IsCompleted = true;
                            }
                        }
                    }

                    // 3. TELEPORT do bazy (teleportujemy ciągnik, nie naczepę)
                    var baseLocation = _configService.GetBaseLocation();
                    vehicleToCheck.Latitude = Math.Round(baseLocation.Latitude, 6);
                    vehicleToCheck.Longitude = Math.Round(baseLocation.Longitude, 6);

                    // 4. Ustaw kierowcę jako nie zajęty, jeśli wszystkie dostawy są anulowane/zakończone
                    if (vehicleToCheck.DriverId.HasValue)
                    {
                        var driver = await _context.Drivers
                            .FirstOrDefaultAsync(d => d.Id == vehicleToCheck.DriverId.Value);
                        
                        if (driver != null)
                        {
                            // Sprawdź PRZED anulowaniem, czy po anulowaniu aktywnych dostaw nie będzie innych aktywnych dostaw
                            bool shouldSetDriverNotBusy = false;
                            
                            if (activeDeliveries.Any())
                            {
                                // Jeśli anulowaliśmy wszystkie aktywne dostawy, sprawdź czy są inne aktywne dostawy
                                var deliveryIdsToCancel = activeDeliveries.Select(d => d.Id).ToList();
                                var hasOtherActiveDeliveries = await _context.Deliveries
                                    .AnyAsync(d => d.VehicleId == vehicleToCheck.Id &&
                                        !deliveryIdsToCancel.Contains(d.Id) &&
                                        d.Status != DeliveryStatus.Canceled &&
                                        d.Status != DeliveryStatus.Completed);
                                
                                shouldSetDriverNotBusy = !hasOtherActiveDeliveries;
                            }
                            else
                            {
                                // Jeśli nie było aktywnych dostaw do anulowania, sprawdź czy są jakieś aktywne dostawy
                                var hasAnyActiveDeliveries = await _context.Deliveries
                                    .AnyAsync(d => d.VehicleId == vehicleToCheck.Id &&
                                        d.Status != DeliveryStatus.Canceled &&
                                        d.Status != DeliveryStatus.Completed);
                                
                                shouldSetDriverNotBusy = !hasAnyActiveDeliveries;
                            }

                            if (shouldSetDriverNotBusy)
                            {
                                driver.IsBusy = false;
                                _context.Entry(driver).State = EntityState.Modified;
                            }
                        }
                    }
                }

                await _context.SaveChangesAsync();

                return CreatedAtAction(
                     nameof(GetBreakdown),
                     new { id = breakdown.Id },
                     new { breakdown.Id, breakdown.Description, breakdown.OccurredAt, breakdown.EndedAt, breakdown.VehicleId }
                );
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Breakdown>> GetBreakdown(int id)
        {
            var breakdown = await _context.Breakdowns.FindAsync(id);
            if (breakdown == null)
                return NotFound();
            return breakdown;
        }

        [HttpPatch("{id}/end")]
        public async Task<ActionResult<object>> EndBreakdown(int id)
        {
            try
            {
                var breakdown = await _context.Breakdowns.FindAsync(id);
                if (breakdown == null)
                    return NotFound();

                if (breakdown.EndedAt != null)
                    return BadRequest("Breakdown has already ended");

                breakdown.EndedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
                await _context.SaveChangesAsync();

                var vehicle = await _context.Vehicles
                    .Include(v => v.Driver)
                        .ThenInclude(d => d!.User)
                    .FirstOrDefaultAsync(v => v.Id == breakdown.VehicleId);
                if (vehicle == null)
                    return NotFound();

                var hasActiveBreakdowns = await _context.Breakdowns
                    .CountAsync(b => b.VehicleId == vehicle.Id && b.EndedAt == null) > 0;

                if (hasActiveBreakdowns)
                {
                    return Ok(new
                    {
                        vehicle = new
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
                            vehicle.DriverId,
                            vehicle.SemiTrailerId,
                            vehicle.BodyworkType,
                            vehicle.Capacity,
                            Driver = vehicle.Driver != null ? new
                            {
                                vehicle.Driver.Id,
                                vehicle.Driver.User?.FirstName,
                                vehicle.Driver.User?.LastName
                            } : null,
                        },
                        breakdowns = await _context.Breakdowns
                            .Where(b => b.VehicleId == vehicle.Id)
                            .Select(b => new
                            {
                                b.Id,
                                b.Description,
                                b.OccurredAt,
                                b.EndedAt,
                                b.VehicleId
                            })
                            .ToListAsync()
                    });
                }

                if (vehicle.Type == VehicleType.SemiTrailer)
                {
                    var set = await _context.Vehicles
                        .Include(s => s.Driver)
                        .FirstOrDefaultAsync(v => v.Type == VehicleType.SemiTrailerTruck && v.SemiTrailerId == vehicle.Id);
                    if (set != null)
                    {
                        var hasActiveBreakdownsOnSet = await _context.Breakdowns
                            .CountAsync(b => b.VehicleId == set.Id && b.EndedAt == null) > 0;

                        if (!hasActiveBreakdownsOnSet)
                        {
                            set.Status = set.Driver != null ? VehicleStatus.Available : null;
                            _context.Entry(set).State = EntityState.Modified;
                            await _context.SaveChangesAsync();
                        }

                        return Ok(new
                        {
                            vehicle = new
                            {
                                set.Id,
                                set.RegistrationNumber,
                                set.Brand,
                                set.Model,
                                set.YearOfProduction,
                                set.Status,
                                set.Type,
                                set.Latitude,
                                set.Longitude,
                                set.DriverId,
                                set.SemiTrailerId,
                                set.BodyworkType,
                                set.Capacity,
                                Driver = set.Driver != null ? new
                                {
                                    set.Driver.Id,
                                    set.Driver.User?.FirstName,
                                    set.Driver.User?.LastName
                                } : null,
                            },
                            breakdowns = await _context.Breakdowns
                                .Where(b => b.VehicleId == set.Id)
                                .Select(b => new
                                {
                                    b.Id,
                                    b.Description,
                                    b.OccurredAt,
                                    b.EndedAt,
                                    b.VehicleId
                                })
                                .ToListAsync()
                        });
                    }
                    else
                    {
                        var activeBreakdowns = await _context.Breakdowns
                            .Where(b => b.VehicleId == vehicle.Id && b.EndedAt == null)
                            .ToListAsync();

                        if (activeBreakdowns.Count == 0)
                        {
                            vehicle.Status = null;
                            _context.Entry(vehicle).State = EntityState.Modified;
                            await _context.SaveChangesAsync();
                        }

                        return Ok(new
                        {
                            vehicle = new
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
                                vehicle.DriverId,
                                vehicle.SemiTrailerId,
                                vehicle.BodyworkType,
                                vehicle.Capacity,
                                Driver = vehicle.Driver != null ? new
                                {
                                    vehicle.Driver.Id,
                                    vehicle.Driver.User?.FirstName,
                                    vehicle.Driver.User?.LastName
                                } : null,
                            },
                            breakdowns = await _context.Breakdowns
                                .Where(b => b.VehicleId == vehicle.Id)
                                .Select(b => new
                                {
                                    b.Id,
                                    b.Description,
                                    b.OccurredAt,
                                    b.EndedAt,
                                    b.VehicleId
                                })
                                .ToListAsync()
                        });
                    }
                }
                else if (vehicle.Type == VehicleType.SemiTrailerTruck && vehicle.SemiTrailerId.HasValue)
                {
                    var activeBreakdownsTractor = await _context.Breakdowns
                        .Where(b => b.VehicleId == vehicle.Id && b.EndedAt == null)
                        .ToListAsync();

                    var activeBreakdownsSemiTrailer = await _context.Breakdowns
                        .Where(b => b.VehicleId == vehicle.SemiTrailerId.Value && b.EndedAt == null)
                        .ToListAsync();

                    if (activeBreakdownsTractor.Count == 0 && activeBreakdownsSemiTrailer.Count == 0)
                    {
                        if (vehicle.Driver != null)
                        {
                            vehicle.Status = VehicleStatus.Available;
                        }
                        else
                        {
                            vehicle.Status = null;
                        }
                        _context.Entry(vehicle).State = EntityState.Modified;
                        await _context.SaveChangesAsync();
                    }

                    return Ok(new
                    {
                        vehicle = new
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
                            vehicle.DriverId,
                            vehicle.SemiTrailerId,
                            vehicle.BodyworkType,
                            vehicle.Capacity,
                            Driver = vehicle.Driver != null ? new
                            {
                                vehicle.Driver.Id,
                                vehicle.Driver.User?.FirstName,
                                vehicle.Driver.User?.LastName
                            } : null,
                        },
                        breakdowns = await _context.Breakdowns
                            .Where(b => b.VehicleId == vehicle.Id)
                            .Select(b => new
                            {
                                b.Id,
                                b.Description,
                                b.OccurredAt,
                                b.EndedAt,
                                b.VehicleId
                            })
                            .ToListAsync()
                    });
                }
                else
                {
                    var activeBreakdowns = await _context.Breakdowns
                        .Where(b => b.VehicleId == breakdown.VehicleId && b.EndedAt == null)
                        .ToListAsync();
                    if (activeBreakdowns.Count == 0)
                    {
                        if (vehicle.Type == VehicleType.TractorUnit)
                        {
                            vehicle.Status = null;
                        }
                        else
                        {
                            vehicle.Status = vehicle.Driver != null ? VehicleStatus.Available : null;
                        }
                        _context.Entry(vehicle).State = EntityState.Modified;
                        await _context.SaveChangesAsync();
                    }

                    return Ok(new
                    {
                        vehicle = new
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
                            vehicle.DriverId,
                            vehicle.SemiTrailerId,
                            vehicle.BodyworkType,
                            vehicle.Capacity,
                            Driver = vehicle.Driver != null ? new
                            {
                                vehicle.Driver.Id,
                                vehicle.Driver.User?.FirstName,
                                vehicle.Driver.User?.LastName
                            } : null,
                        },
                        breakdowns = await _context.Breakdowns
                            .Where(b => b.VehicleId == breakdown.VehicleId)
                            .Select(b => new
                            {
                                b.Id,
                                b.Description,
                                b.OccurredAt,
                                b.EndedAt,
                                b.VehicleId
                            })
                            .ToListAsync()
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }

    public class BreakdownDto
    {
        public string Description { get; set; } = null!;
        public DateTime? OccurredAt { get; set; }
    }
}
