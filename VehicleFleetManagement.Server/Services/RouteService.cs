using System.Text.Json;

public class RouteService
{
    private readonly ILogger<RouteService> _logger;

    public RouteService(ILogger<RouteService> logger)
    {
        _logger = logger;
    }
    public async Task<List<(double lat, double lng)>> GetRouteCoordinatesAsync(
          double startLng, double startLat, double endLng, double endLat, int? selectedRouteIndex = null)
    {
        using (HttpClient client = new HttpClient())
        {
            // Utworzenie zapytania do OSRM
            var url = string.Format(System.Globalization.CultureInfo.InvariantCulture,
            "https://router.project-osrm.org/route/v1/driving/{0},{1};{2},{3}?alternatives=2&geometries=geojson&overview=full",
             startLng, startLat, endLng, endLat);

            // Wysłanie zapytania GET do OSRM
            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Cannot retrieve route. OSRM returned: {response.StatusCode}");
            }

            // Json 
            var json = await response.Content.ReadAsStringAsync();

            // Deserializacja json na obiekt C# (OsrmResponse)
            var data = JsonSerializer.Deserialize<OsrmResponse>(json);

            // Sprawdź czy odopowiedź zawiera trasy
            if (data == null || data.routes == null || data.routes.Length == 0)
            {
                throw new InvalidOperationException("No route could be retrieved from OSRM.");
            }

            // Indeks trasy
            int index = selectedRouteIndex.HasValue ? selectedRouteIndex.Value : 0;
            
            // Wspolrzedne trasy [lng, lat]
            var coordinates = data.routes[index].geometry.coordinates;
            
            // Wspolrzedne trasy [lat, lng]
            var routeCoords = new List<(double lat, double lng)>();
            
            // Zmiana z [lat, lng] na [lng, lat]
            foreach (var coord in coordinates)
            {
                routeCoords.Add((Math.Round(coord[1], 6), Math.Round(coord[0], 6)));
            }

            // Zwróć współrzędne
            return routeCoords;
        }
    }

    public class OsrmResponse
    {
        public Route[] routes { get; set; } = Array.Empty<Route>();
    }

    public class Route
    {
        public Geometry geometry { get; set; } = new Geometry();
    }

    public class Geometry
    {
        public double[][] coordinates { get; set; } = Array.Empty<double[]>();
    }
}
