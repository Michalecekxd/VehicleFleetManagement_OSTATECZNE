using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/osrmproxy")]
public class OsrmProxyController : ControllerBase
{
    private readonly HttpClient _http;

    public OsrmProxyController(IHttpClientFactory httpClientFactory)
    {
        _http = httpClientFactory.CreateClient();
    }

    [HttpGet("route")]
    public async Task<IActionResult> GetRoute(string start, string end)
    {
        var osrmUrl = $"https://router.project-osrm.org/route/v1/driving/{start};{end}?alternatives=2&geometries=geojson&overview=full";
        var response = await _http.GetAsync(osrmUrl);

        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync());

        var content = await response.Content.ReadAsStringAsync();
        return Content(content, "application/json"); // koniecznie application/json
    }
}
