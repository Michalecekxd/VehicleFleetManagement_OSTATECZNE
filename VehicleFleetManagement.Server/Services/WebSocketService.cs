using ExpressiveAnnotations.Analysis;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using VehicleFleetManagement.Server.Enums;

public class WebSocketService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ConfigService _configService;
    private readonly ConcurrentDictionary<Guid, WebSocket> _sockets = new();
    //private List<VehicleData> _cachedVehicles = new List<VehicleData>();
    //private DateTime _lastCacheUpdate = DateTime.MinValue;
    private readonly RouteService _routeService;

    // Kolekcja przechowująca tylko symulacje powrotu do bazy
    private readonly ConcurrentDictionary<int, List<(Task, CancellationTokenSource)>> _simulationTasks = new();
    private readonly ConcurrentDictionary<int, int?> _deliveryRouteIndexes = new();



    public WebSocketService(IServiceScopeFactory scopeFactory, ConfigService configService, RouteService routeService)
    {
        _scopeFactory = scopeFactory;
        _configService = configService;
        _routeService = routeService;
    }

    public async Task HandleWebSocketAsync(HttpContext context)
    {
        if (!context.WebSockets.IsWebSocketRequest)
        {
            context.Response.StatusCode = 400;
            return;
        }

        var socket = await context.WebSockets.AcceptWebSocketAsync();
        var socketId = Guid.NewGuid();
        _sockets.TryAdd(socketId, socket);


        List<VehicleData> vehicles;

        //Serwer wysyla dane do klientow
        try
        {
            while (!context.RequestAborted.IsCancellationRequested &&
                   socket.State == WebSocketState.Open)

            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                    vehicles = await dbContext.Vehicles
                        .Include(v => v.Driver)
                        .ThenInclude(d => d!.User)
                        .Select(v => new VehicleData
                        {
                            Id = v.Id,
                            Status = v.Status,
                            Latitude = Math.Round(v.Latitude ?? 0.0, 6),
                            Longitude = Math.Round(v.Longitude ?? 0.0, 6),
                            RegistrationNumber = v.RegistrationNumber ?? "",
                            Brand = v.Brand ?? "",
                            Model = v.Model ?? "",
                            YearOfProduction = v.YearOfProduction,
                            BodyworkType = v.BodyworkType,
                            Capacity = v.Capacity,
                            Type = (int)v.Type,
                            LastModified = v.LastModified,
                            DriverId = v.Driver != null ? v.Driver.Id : null,
                            DriverFirstName = v.Driver != null ? v.Driver.User!.FirstName : null,
                            DriverLastName = v.Driver != null ? v.Driver.User!.LastName : null,
                            DriverPhoneNumber = v.Driver != null ? v.Driver.User!.PhoneNumber : null,
                            Deliveries = v.Status == VehicleStatus.OnTheRoad && v.Deliveries != null
                                ? v.Deliveries.Select(d => new DeliveryData
                                {
                                    Id = d.Id,
                                    LoadDescription = d.LoadDescription,
                                    OrderId = d.OrderId,
                                    Status = (int)d.Status,
                                    StartLatitude = Math.Round(d.StartLatitude, 6),
                                    StartLongitude = Math.Round(d.StartLongitude, 6),
                                    EndLatitude = Math.Round(d.EndLatitude, 6),
                                    EndLongitude = Math.Round(d.EndLongitude, 6),
                                    StartedAt = d.StartedAt,
                                    CompletedAt = d.CompletedAt,
                                    ClientName = d.ClientName ?? string.Empty,
                                    ClientPhone = d.ClientPhone ?? string.Empty
                                }).ToList()
                                : new List<DeliveryData>(),
                            SemiTrailer = v.Type == VehicleType.SemiTrailerTruck && v.SemiTrailerId.HasValue
                                ? dbContext.Vehicles.Where(s => s.Id == v.SemiTrailerId.Value)
                                    .Select(s => new SemiTrailerData
                                    {
                                        Id = s.Id,
                                        RegistrationNumber = s.RegistrationNumber ?? "",
                                        Brand = s.Brand ?? "",
                                        Model = s.Model ?? "",
                                        YearOfProduction = s.YearOfProduction,
                                        BodyworkType = s.BodyworkType,
                                        Capacity = s.Capacity
                                    }).FirstOrDefault()
                                : null
                        })
                        .ToListAsync();
                    //_cachedVehicles = vehicles;
                    //_lastCacheUpdate = DateTime.UtcNow;
                }

                var json = JsonSerializer.Serialize(vehicles);
                var buffer = Encoding.UTF8.GetBytes(json);

                if (socket.State == WebSocketState.Open)
                {
                    await socket.SendAsync(
                        buffer,
                        WebSocketMessageType.Text,
                        true,
                        CancellationToken.None
                    );
                }



                await Task.Delay(3000);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Error WebSocket: {ex.Message}");
        }
        finally
        {
            _sockets.TryRemove(socketId, out _);
            Console.WriteLine("❌ WebSocket: Client disconnected");
        }
    }

    public void SetRouteIndex(int deliveryId, int? index)
    {
        if (index.HasValue)
            _deliveryRouteIndexes[deliveryId] = index;
    }
    // Metoda symulująca realizację dostawy 
    public async Task SimulateDeliveryAsync(int vehicleId, List<(double lat, double lng)> routeToStart, List<(double lat, double lng)> routeToDestination)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var vehicle = await dbContext.Vehicles.FindAsync(vehicleId, CancellationToken.None);
        if (vehicle == null)
        {
            Console.WriteLine($"Vehicle ID {vehicleId} not found.");
            return;
        }

        // Symulacja trasy z bazy do miejsca początkowego oraz z miejsca początkowego do destynacji
        await SimulateRouteAsync(vehicleId, routeToStart, CancellationToken.None);
        await SimulateRouteAsync(vehicleId, routeToDestination, CancellationToken.None);

        // Pobieramy dostawę, która była w trakcie realizacji
        var delivery = await dbContext.Deliveries
            .Where(d => d.VehicleId == vehicleId && d.Status == DeliveryStatus.InProgress)
            .FirstOrDefaultAsync(CancellationToken.None);


        if (delivery != null)
        {
            // Zakończenie bieżącej dostawy
            delivery.Status = DeliveryStatus.Completed;
            delivery.CompletedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();

            // Szukamy kolejnej dostawy o statusie Pending (czyli nowej dostawy w ramach tego samego zlecenia)
            var pendingDelivery = await dbContext.Deliveries
                .Where(d => d.VehicleId == vehicleId && d.Status == DeliveryStatus.Pending)
                .OrderBy(d => d.Id)
                .FirstOrDefaultAsync();

            if (pendingDelivery != null)
            {
                // Ustawiamy status znalezionej dostawy na InProgress
                pendingDelivery.Status = DeliveryStatus.InProgress;
                pendingDelivery.StartedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync();

                // Obliczamy trasę:
                // 1. Z aktualnej pozycji (końcowe współrzędne ukończonej dostawy) do punktu początkowego nowej dostawy.
                List<(double lat, double lng)> newRouteToStart = await _routeService.GetRouteCoordinatesAsync(
                    delivery.EndLongitude, delivery.EndLatitude,   // aktualne położenie (koniec ukończonej dostawy)
                    pendingDelivery.StartLongitude, pendingDelivery.StartLatitude);

                // 2. Z punktu początkowego do miejsca docelowego nowej dostawy.
                _deliveryRouteIndexes.TryGetValue(pendingDelivery.Id, out var selectedRouteIndex);

                List<(double lat, double lng)> newRouteToDestination = await _routeService.GetRouteCoordinatesAsync(
                    pendingDelivery.StartLongitude, pendingDelivery.StartLatitude,
                    pendingDelivery.EndLongitude, pendingDelivery.EndLatitude,
                    selectedRouteIndex);

                _deliveryRouteIndexes.TryRemove(pendingDelivery.Id, out _);

                // Rozpoczynamy symulację nowej dostawy rekurencyjnie
                await SimulateDeliveryAsync(vehicleId, newRouteToStart, newRouteToDestination);
            }
            else
            {
                // Jeśli nie ma kolejnych dostaw, pojazd wraca do bazy
                vehicle.Status = VehicleStatus.ReturningToBase;
                await dbContext.SaveChangesAsync();
                await SimulateRouteToBaseAsync(vehicleId, CancellationToken.None);
            }
        }
    }



    // Metoda realizująca symulację trasy – iteracja po punktach z uwzględnieniem tokenu anulowania


    private async Task SimulateRouteAsync(int vehicleId, List<(double lat, double lng)> routeCoordinates, CancellationToken cancellationToken)
    {
        if (routeCoordinates == null || routeCoordinates.Count == 0)
            throw new InvalidOperationException($"No route coordinates for vehicle ID {vehicleId}.");

        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        foreach (var point in routeCoordinates)
        {
            try
            {

                // Sprawdź czy nie anulowano symulacji 
                cancellationToken.ThrowIfCancellationRequested();

                // Pobierz pojazd i odśwież jego stan z bazy
                var vehicle = await dbContext.Vehicles.FindAsync(new object[] { vehicleId }, cancellationToken);
                if (vehicle != null)
                {
                    // Pobierz najnowsze dane z bazy
                    await dbContext.Entry(vehicle).ReloadAsync(cancellationToken);

                    // Sprawdź, czy pojazd ma awarię
                    if (vehicle.Status == VehicleStatus.Damaged)
                    {
                        // Pojazd uszkodzony, przerwij symulację
                        return;
                    }

                    // Zaktualizuj pozycję pojazdu
                    vehicle.Latitude = Math.Round(point.lat, 6);
                    vehicle.Longitude = Math.Round(point.lng, 6);
                    vehicle.LastModified = DateTime.UtcNow;

                    await dbContext.SaveChangesAsync(cancellationToken);
                }

                // Opóźnienie 3 sekundy
                await Task.Delay(3000, cancellationToken);
            }
            catch (TaskCanceledException)
            {
                return; // Symulacja anulowana
            }
        }
    }


    // Metoda symulująca trasę powrotu do bazy
    public async Task SimulateRouteToBaseAsync(int vehicleId, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var vehicle = await dbContext.Vehicles.FindAsync(vehicleId, cancellationToken);
        if (vehicle == null)
        {
            Console.WriteLine($"Vehicle ID {vehicleId} not found.");
            return;
        }

        var baseLocation = _configService.GetBaseLocation();
        List<(double lat, double lng)> routeToBase = await _routeService.GetRouteCoordinatesAsync(
            vehicle.Longitude ?? 0.0,
            vehicle.Latitude ?? 0.0,
            baseLocation.Longitude,
            baseLocation.Latitude);

        // Utwórz nowy token dla symulacji powrotu do bazy
        var ctsBase = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        var baseTask = Task.Run(async () =>
        {
            await SimulateRouteAsync(vehicleId, routeToBase, ctsBase.Token);
        });
        AddSimulationTask(vehicleId, baseTask, ctsBase);

        await baseTask;

        // Sprawdzamy, czy token nie został anulowany
        if (!ctsBase.Token.IsCancellationRequested)
        {
            vehicle.Status = VehicleStatus.Available;

            if (vehicle.DriverId.HasValue)
            {
                var driver = await dbContext.Drivers
                    .FirstOrDefaultAsync(d => d.Id == vehicle.DriverId.Value, cancellationToken);
                if (driver != null)
                {
                    driver.IsBusy = false;
                }
            }

            var lastDelivery = await dbContext.Deliveries
                .Where(d => d.VehicleId == vehicleId
                         && d.Status == DeliveryStatus.Completed
                         && d.CompletedAt != null)
                .OrderByDescending(d => d.CompletedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (lastDelivery != null)
            {
                // Zaktualizuj IsCompleted w tabeli Orders
                var order = await dbContext.Orders
                    .FirstOrDefaultAsync(o => o.Id == lastDelivery.OrderId, cancellationToken);

                if (order != null)
                {
                    order.IsCompleted = true;
                    await dbContext.SaveChangesAsync(cancellationToken);
                }
            }

            await dbContext.SaveChangesAsync();
        }
    }

    // Metoda anulująca symulację powrotu do bazy
    public async Task CancelSimulationAsync(int vehicleId)
    {
        if (_simulationTasks.ContainsKey(vehicleId))
        {
            var tasksForVehicle = _simulationTasks[vehicleId];
            foreach (var (task, cancellationTokenSource) in tasksForVehicle)
            {
                cancellationTokenSource.Cancel(); // Anulowanie tylko symulacji powrotu do bazy
                try
                {
                    await task;
                    //Console.WriteLine($"Simulation for vehicle ID {vehicleId} has been canceled.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error canceling simulation for vehicle ID {vehicleId}: {ex.Message}");
                }
            }
            _simulationTasks.TryRemove(vehicleId, out _);   // Usuwamy symulację pojazdu
        }
        else
        {
            Console.WriteLine($"No active simulation for the vehicle ID {vehicleId}.");
        }
    }

    // Pomocnicza metoda dodająca nową symulację do listy
    private void AddSimulationTask(int vehicleId, Task task, CancellationTokenSource cts)
    {
        if (!_simulationTasks.ContainsKey(vehicleId))
        {
            _simulationTasks[vehicleId] = new List<(Task, CancellationTokenSource)>();
        }
        _simulationTasks[vehicleId].Add((task, cts)); // Dodajemy tylko zadanie powrotu do bazy
    }

    // Klasy pomocnicze – struktury danych
    public class VehicleData
    {
        public int Id { get; set; }
        public VehicleStatus? Status { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string RegistrationNumber { get; set; } = null!;
        public string Brand { get; set; } = null!;
        public string? Model { get; set; }
        public int YearOfProduction { get; set; }
        public int? BodyworkType { get; set; }
        public double? Capacity { get; set; }
        public int Type { get; set; }
        public DateTime? LastModified { get; set; }
        public int? DriverId { get; set; }
        public string? DriverFirstName { get; set; }
        public string? DriverLastName { get; set; }
        public string? DriverPhoneNumber { get; set; }
        public List<DeliveryData> Deliveries { get; set; } = new List<DeliveryData>();
        public SemiTrailerData? SemiTrailer { get; set; }
    }

    public class DeliveryData
    {
        public int Id { get; set; }
        public string LoadDescription { get; set; } = null!;
        public int OrderId { get; set; }
        public int Status { get; set; }
        public double StartLatitude { get; set; }
        public double StartLongitude { get; set; }
        public double EndLatitude { get; set; }
        public double EndLongitude { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string ClientName { get; set; } = null!;
        public string ClientPhone { get; set; } = null!;
    }

    public class SemiTrailerData
    {
        public int Id { get; set; }
        public string RegistrationNumber { get; set; } = null!;
        public string Brand { get; set; } = null!;
        public string? Model { get; set; }
        public int YearOfProduction { get; set; }
        public int? BodyworkType { get; set; }
        public double? Capacity { get; set; }
    }
}