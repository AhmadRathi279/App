using Azure.Core;
using BusTracking.Application.Authentication.Interfaces;
using BusTracking.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace Carevance.API.Controllers.Users
{

    [ApiController]
    [Route("api/[controller]")]
    //[Authorize]
    public class DriverController : ControllerBase
    {
        private readonly IAuthService _authService;

        public DriverController( IAuthService authService)
        {
            _authService = authService;
        }

        [HttpGet("get-bus")]
        public async Task<IActionResult> GetBusForDriver([FromQuery] string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest(new { error = "Email is required." });

            var url = $"https://1ezxs5w3k6.execute-api.us-east-1.amazonaws.com/default/GetBusForDriver?email={Uri.EscapeDataString(email)}";

            var authHeader = HttpContext.Request.Headers["Authorization"].ToString();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
                return Unauthorized(new { error = "Missing or invalid Authorization header." });

            var token = authHeader.Substring("Bearer ".Length);

            var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            try
            {
                var response = await client.GetAsync(url);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, responseBody);

                return Content(responseBody, "application/json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


        [HttpPost("store-location")]
        public async Task<IActionResult> StoreLocation([FromBody] LocationRequest location)
        {
            var url = "https://lrced0m0mh.execute-api.us-east-1.amazonaws.com/default/StoreBusLocationPython";

            var authHeader = HttpContext.Request.Headers["Authorization"].ToString();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
                return Unauthorized(new { error = "Missing or invalid Authorization header." });

            var token = authHeader.Substring("Bearer ".Length);

            var json = System.Text.Json.JsonSerializer.Serialize(location);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            return Content(responseBody, "application/json");
        }







    }
}
