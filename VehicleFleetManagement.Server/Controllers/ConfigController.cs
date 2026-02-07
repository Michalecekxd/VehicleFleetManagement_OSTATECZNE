using Microsoft.AspNetCore.Mvc;
using VehicleFleetManagement.Server.Models;
using System;

namespace VehicleFleetManagement.Server.Controllers
{
    [Route("api/config")]
    [ApiController]
    public class ConfigController : ControllerBase
    {
        private readonly ConfigService _configService;

        public ConfigController(ConfigService configService)
        {
            _configService = configService;
        }

        [HttpGet]
        public IActionResult GetBaseLocation()
        {
            try
            {
                var (latitude, longitude) = _configService.GetBaseLocation();

                if (latitude == 0 || longitude == 0)
                {
                    return BadRequest(new { message = "Incorrect location." });
                }

                return Ok(new
                {
                    latitude,
                    longitude
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error occured.", details = ex.Message });
            }
        }
    }
}
