using Microsoft.Extensions.Options;
using VehicleFleetManagement.Server.Models;

public class ConfigService
{
    private readonly ManagerData _managerData;
    private readonly BaseLocation _baseLocation;

    public ConfigService(IOptions<ManagerData> managerOptions, IOptions<BaseLocation> baseLocationOptions)
    {
        _managerData = managerOptions.Value;
        _baseLocation = baseLocationOptions.Value;
    }

    public (string Email, string Password) GetManagerCredentials()
    {
        return (_managerData.Email ?? "", _managerData.Password ?? "");
    }

    public (double Latitude, double Longitude) GetBaseLocation()
    {
        return (_baseLocation.Latitude ?? 52.25, _baseLocation.Longitude ?? 21.0);
    }
}