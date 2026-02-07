using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using VehicleFleetManagement.Server.Enums;
using VehicleFleetManagement.Server.Models.DataModels;
using VehicleFleetManagement.Server.Models.Identity;

namespace VehicleFleetManagement.Server.Controllers
{
    [Route("api/delivery")]
    [ApiController]
    public class DeliveryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly WebSocketService _webSocketService;
        private readonly RouteService _routeService;
        private readonly UserManager<User> _userManager;

        public DeliveryController(
            ApplicationDbContext context,
            WebSocketService webSocketService,
            RouteService routeService,
            UserManager<User> userManager)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _webSocketService = webSocketService ?? throw new ArgumentNullException(nameof(webSocketService));
            _routeService = routeService ?? throw new ArgumentNullException(nameof(routeService));
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeliveryDto>>> GetAllDeliveries()
        {
            var deliveries = await _context.Deliveries
                 .Include(d => d.Driver)
                     .ThenInclude(dr => dr.User)
                 .OrderByDescending(d => d.Id)
                 .Select(d => new DeliveryDto
                 {
                    Id = d.Id,
                    VehicleId = d.VehicleId,
                    DriverId = d.DriverId,
                    DriverFirstName = d.Driver!.User!.FirstName ?? string.Empty,
                    DriverLastName = d.Driver!.User!.LastName ?? string.Empty,
                    LoadDescription = d.LoadDescription,
                    OrderId = d.OrderId,
                    StartLatitude = d.StartLatitude,
                    StartLongitude = d.StartLongitude,
                    EndLatitude = d.EndLatitude,
                    EndLongitude = d.EndLongitude,
                    StartAddress = d.StartAddress,
                    EndAddress = d.EndAddress,
                    Status = d.Status,
                    StartedAt = d.StartedAt,
                    CompletedAt = d.CompletedAt,
                    ClientName = d.ClientName,
                    ClientPhone = d.ClientPhone
                })
                .ToListAsync();

            return Ok(deliveries);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DeliveryDto>> GetDeliveryById(int id)
        {
            try
            {
                var delivery = await _context.Deliveries
                    .Include(d => d.Driver)
                        .ThenInclude(dr => dr.User)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (delivery == null)
                    return NotFound($"Order with ID {id} not found.");

                var deliveryDto = new DeliveryDto
                {
                    Id = delivery.Id,
                    VehicleId = delivery.VehicleId,
                    DriverId = delivery.DriverId,
                    DriverFirstName = delivery.Driver?.User?.FirstName ?? string.Empty,
                    DriverLastName = delivery.Driver?.User?.LastName ?? string.Empty,
                    LoadDescription = delivery.LoadDescription,
                    OrderId = delivery.OrderId,
                    StartLatitude = delivery.StartLatitude,
                    StartLongitude = delivery.StartLongitude,
                    EndLatitude = delivery.EndLatitude,
                    EndLongitude = delivery.EndLongitude,
                    StartAddress = delivery.StartAddress,
                    EndAddress = delivery.EndAddress,
                    Status = delivery.Status,
                    StartedAt = delivery.StartedAt,
                    CompletedAt = delivery.CompletedAt,
                    ClientName = delivery.ClientName,
                    ClientPhone = delivery.ClientPhone
                };

                return Ok(deliveryDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<ActionResult<DeliveryDto>> CreateDelivery([FromBody] AddDeliveryDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Order details are required.");
            }

            if (dto.VehicleId <= 0)
            {
                return BadRequest("Invalid vehicle ID.");
            }

            var vehicle = await _context.Vehicles
                .Include(v => v.Driver)
                .FirstOrDefaultAsync(v => v.Id == dto.VehicleId);

            if (vehicle == null)
            {
                return NotFound("Vehicle with this ID does not exist.");
            }

            // Sprawdź czy pojazd ma aktywną awarię
            bool hasActiveBreakdown = false;
            if (vehicle.Type == VehicleType.SemiTrailerTruck && vehicle.SemiTrailerId.HasValue)
            {
                // Dla zestawu sprawdź awarie ciągnika i naczepy
                var activeBreakdownsTractor = await _context.Breakdowns
                    .AnyAsync(b => b.VehicleId == vehicle.Id && b.EndedAt == null);
                var activeBreakdownsSemiTrailer = await _context.Breakdowns
                    .AnyAsync(b => b.VehicleId == vehicle.SemiTrailerId.Value && b.EndedAt == null);
                hasActiveBreakdown = activeBreakdownsTractor || activeBreakdownsSemiTrailer;
            }
            else if (vehicle.Type == VehicleType.SemiTrailer)
            {
                // Dla naczepy sprawdź awarie naczepy i zestawu (jeśli istnieje)
                var activeBreakdownsSemiTrailer = await _context.Breakdowns
                    .AnyAsync(b => b.VehicleId == vehicle.Id && b.EndedAt == null);
                
                var set = await _context.Vehicles
                    .FirstOrDefaultAsync(v => v.Type == VehicleType.SemiTrailerTruck && v.SemiTrailerId == vehicle.Id);
                if (set != null)
                {
                    var activeBreakdownsTractor = await _context.Breakdowns
                        .AnyAsync(b => b.VehicleId == set.Id && b.EndedAt == null);
                    hasActiveBreakdown = activeBreakdownsSemiTrailer || activeBreakdownsTractor;
                }
                else
                {
                    hasActiveBreakdown = activeBreakdownsSemiTrailer;
                }
            }
            else
            {
                // Dla zwykłych pojazdów sprawdź tylko awarie tego pojazdu
                hasActiveBreakdown = await _context.Breakdowns
                    .AnyAsync(b => b.VehicleId == vehicle.Id && b.EndedAt == null);
            }

            if (hasActiveBreakdown)
            {
                return BadRequest("Nie można dodać zlecenia dla pojazdu z aktywną awarią.");
            }

            var driver = vehicle.Driver;
            if (driver != null)
            {
                driver.IsBusy = true;
                _context.Entry(driver).State = EntityState.Modified;
            }

            double startLatitude = Math.Round(dto.StartLatitude, 6);
            double startLongitude = Math.Round(dto.StartLongitude, 6);
            double endLatitude = Math.Round(dto.EndLatitude, 6);
            double endLongitude = Math.Round(dto.EndLongitude, 6);

            Order orderToAssign = null!;

            // Jeśli pojazd jest dostępny (Available) – tworzymy nowe zlecenie.
            if (vehicle.Status == VehicleStatus.Available)
            {
                orderToAssign = new Order
                {
                    IsCompleted = false
                };
                _context.Orders.Add(orderToAssign);
            }
            else
            {
                // Pojazd nie jest dostępny – szukamy aktywnego (otwartego) zlecenia.
                var activeOrder = await _context.Orders
                    .Where(o => o.IsCompleted == false && o.Deliveries.Any(d => d.VehicleId == dto.VehicleId))
                    .FirstOrDefaultAsync();

                if (activeOrder != null)
                {
                    orderToAssign = activeOrder;
                }
                else
                {
                    // Jeśli nie znaleziono aktywnego zlecenia, zwracamy błąd.
                    return Conflict("Vehicle is on route, but no active order was found.");
                }
            }

            // Ustal status nowej dostawy: gdy pojazd jest Available – InProgress, w przeciwnym przypadku – Pending.
            DeliveryStatus newDeliveryStatus = vehicle.Status == VehicleStatus.Available || vehicle.Status == VehicleStatus.ReturningToBase
                ? DeliveryStatus.InProgress
                : DeliveryStatus.Pending;

            var delivery = new Delivery
            {
                VehicleId = dto.VehicleId,
                DriverId = driver?.Id ?? 0,
                LoadDescription = dto.LoadDescription,
                StartLatitude = startLatitude,
                StartLongitude = startLongitude,
                EndLatitude = endLatitude,
                EndLongitude = endLongitude,
                StartAddress = dto.StartAddress,
                EndAddress = dto.EndAddress,
                Status = newDeliveryStatus,
                StartedAt = null,
                CompletedAt = null,
                ClientName = dto.ClientName,
                ClientPhone = dto.ClientPhone,
                Order = orderToAssign
            };

            if (delivery.Status == DeliveryStatus.InProgress)
            {
                delivery.StartedAt = DateTime.UtcNow; // Ustawiamy CreatedAt na bieżącą datę
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (vehicle.Status == VehicleStatus.ReturningToBase)
                {
                    // Anulujemy symulację, jeśli pojazd wraca do bazy
                    await _webSocketService.CancelSimulationAsync(vehicle.Id);
                }

                List<(double lat, double lng)> routeToStart = new();
                List<(double lat, double lng)> routeToDestination = new();

                if (delivery.Status == DeliveryStatus.InProgress)
                {
                     routeToStart = await _routeService.GetRouteCoordinatesAsync(
                        vehicle.Longitude ?? 0.0,
                        vehicle.Latitude ?? 0.0,
                        startLongitude,
                        startLatitude);

                     routeToDestination = await _routeService.GetRouteCoordinatesAsync(
                        startLongitude,
                        startLatitude,
                        endLongitude,
                        endLatitude,
                        dto.SelectedRouteIndex);

                }

                _context.Deliveries.Add(delivery);

                if (delivery.Status == DeliveryStatus.InProgress)
                {
                    // Jeśli rozpoczynamy nowe zlecenie, zmieniamy status pojazdu na OnTheRoad.
                    vehicle.Status = VehicleStatus.OnTheRoad;
                    _context.Entry(vehicle).State = EntityState.Modified;
                }

                await _context.SaveChangesAsync();

                _webSocketService.SetRouteIndex(delivery.Id, dto.SelectedRouteIndex);

                await transaction.CommitAsync();

                if (delivery.Status == DeliveryStatus.InProgress)
                {
                    // Uruchamiamy symulację dostawy z aktywnym tokenem
                    _ = _webSocketService.SimulateDeliveryAsync(dto.VehicleId, routeToStart, routeToDestination);
                }


                var deliveryDto = new DeliveryDto
                {
                    Id = delivery.Id,
                    VehicleId = delivery.VehicleId,
                    DriverId = delivery.DriverId,
                    LoadDescription = delivery.LoadDescription,
                    OrderId = delivery.OrderId,
                    StartLatitude = delivery.StartLatitude,
                    StartLongitude = delivery.StartLongitude,
                    EndLatitude = delivery.EndLatitude,
                    EndLongitude = delivery.EndLongitude,
                    StartAddress = delivery.StartAddress,
                    EndAddress = delivery.EndAddress,
                    Status = delivery.Status,
                    StartedAt = delivery.StartedAt,
                    ClientName = delivery.ClientName,
                    ClientPhone = delivery.ClientPhone
                };

                return CreatedAtAction(nameof(GetDeliveryById), new { id = delivery.Id }, deliveryDto);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"Error occured while adding order: {ex}");
                return StatusCode(500, $"Internal server error: {ex}");
            }
        }

        [HttpPost("{id}/cancel")]
        public async Task<ActionResult> CancelDelivery(int id)
        {
            try
            {
                var delivery = await _context.Deliveries
                    .Include(d => d.Order)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (delivery == null)
                {
                    return NotFound($"Delivery ID {id} not found.");
                }

                if (delivery.Status != DeliveryStatus.Pending)
                {
                    return BadRequest("Delivery is not in Pending status and cannot be canceled.");
                }

                // Sprawdź czy są inne aktywne dostawy w zleceniu PRZED anulowaniem
                bool shouldCloseOrder = false;
                if (delivery.Order != null)
                {
                    var order = delivery.Order;
                    var hasOtherActiveDeliveries = await _context.Deliveries
                        .AnyAsync(d => d.OrderId == order.Id && 
                            d.Id != delivery.Id &&
                            d.Status != DeliveryStatus.Canceled && 
                            d.Status != DeliveryStatus.Completed);

                    if (!hasOtherActiveDeliveries)
                    {
                        shouldCloseOrder = true;
                    }
                }

                delivery.Status = DeliveryStatus.Canceled;

                // Zamknij zlecenie, jeśli nie ma innych aktywnych dostaw
                if (shouldCloseOrder && delivery.Order != null)
                {
                    delivery.Order.IsCompleted = true;
                }

                await _context.SaveChangesAsync();

                return Ok("Delivery canceled.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("driver")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<DeliveryDto>>> GetDriverDeliveries()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                    return Unauthorized("User not found");

                var driver = await _context.Drivers
                    .FirstOrDefaultAsync(d => d.UserId == user.Id);
                if (driver == null)
                    return NotFound("Driver not found");

                var deliveries = await _context.Deliveries
                    .Where(d => d.DriverId == driver.Id)
                    .Select(d => new DeliveryDto
                    {
                        Id = d.Id,
                        VehicleId = d.VehicleId,
                        DriverId = d.DriverId,      
                        LoadDescription = d.LoadDescription,
                        OrderId = d.OrderId,
                        StartLatitude = d.StartLatitude,
                        StartLongitude = d.StartLongitude,
                        EndLatitude = d.EndLatitude,
                        EndLongitude = d.EndLongitude,
                        StartAddress = d.StartAddress,
                        EndAddress = d.EndAddress,
                        Status = d.Status,
                        StartedAt = d.StartedAt,
                        CompletedAt = d.CompletedAt,
                        ClientName = d.ClientName,
                        ClientPhone = d.ClientPhone
                    })
                    .ToListAsync();

                return Ok(deliveries);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        public class AddDeliveryDto
        {
            public int VehicleId { get; set; }
            [Required(ErrorMessage = "Pole Opis towaru jest wymagane.")]
            public string LoadDescription { get; set; } = null!;
            public double StartLatitude { get; set; }
            public double StartLongitude { get; set; }
            public double EndLatitude { get; set; }
            public double EndLongitude { get; set; }
            [Required(ErrorMessage = "Pole Adres początkowy jest wymagane.")]
            public string StartAddress { get; set; } = null!;
            [Required(ErrorMessage = "Pole Adres docelowy jest wymagane.")]
            public string EndAddress { get; set; } = null!;
            public string? ClientName { get; set; }
            public string? ClientPhone { get; set; }
            public int? SelectedRouteIndex { get; set; }
        }

        public class DeliveryDto
        {
            public int Id { get; set; }
            public int VehicleId { get; set; }
            public int DriverId { get; set; }
            public string LoadDescription { get; set; } = null!;
            public int OrderId { get; set; }
            public string DriverFirstName { get; set; } = null!;
            public string DriverLastName { get; set; } = null!;
            public double StartLatitude { get; set; }
            public double StartLongitude { get; set; }
            public double EndLatitude { get; set; }
            public double EndLongitude { get; set; }
            public string StartAddress { get; set; } = null!;
            public string EndAddress { get; set; } = null!;
            public DeliveryStatus Status { get; set; }
            public DateTime? StartedAt { get; set; }
            public DateTime? CompletedAt { get; set; }
            public string? ClientName { get; set; }
            public string? ClientPhone { get; set; }
        }
    }
}
