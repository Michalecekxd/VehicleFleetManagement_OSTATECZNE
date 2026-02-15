using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VehicleFleetManagement.Server.Models.DataModels;

namespace VehicleFleetManagement.Server.Controllers.V2
{
    [ApiVersion("2.0")]
    [Route("api/order")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrderController(ApplicationDbContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderDto>>> GetAllOrders()
        {
            try
            {
                var orders = await _context.Orders
                    .Select(o => new OrderDto
                    {
                        Id = o.Id,
                        IsCompleted = o.IsCompleted
                    })
                    .ToListAsync();

                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Błąd serwera: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OrderDto>> GetOrderById(int id)
        {
            try
            {
                var order = await _context.Orders
                    .Where(o => o.Id == id)
                    .Select(o => new OrderDto
                    {
                        Id = o.Id,
                        IsCompleted = o.IsCompleted
                    })
                    .FirstOrDefaultAsync();

                if (order == null)
                    return NotFound($"Zlecenie o ID {id} nie istnieje.");

                return Ok(order);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Błąd serwera: {ex.Message}");
            }
        }

        public class OrderDto
        {
            public int Id { get; set; }
            public bool IsCompleted { get; set; }
        }
    }
}
