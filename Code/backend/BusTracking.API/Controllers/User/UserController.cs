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
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IAuthService _authService;

        public UserController( IAuthService authService)
        {
            _authService = authService;
        }

      
        [HttpPost("add-user")]
        public async Task<IActionResult> AddUser([FromBody] DBUser user)
        {
            var url = "https://vr6mc2oavj.execute-api.us-east-1.amazonaws.com/default/CreateCognitoUser";

            var authHeader = HttpContext.Request.Headers["Authorization"].ToString();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
                return Unauthorized(new { error = "Missing or invalid Authorization header." });

            var token = authHeader.Substring("Bearer ".Length);

            var json = System.Text.Json.JsonSerializer.Serialize(user);  // <-- Send user object directly
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            return Content(responseBody, "application/json");
        }

        [HttpGet("get-locations")]
        public async Task<IActionResult> GetAllBusLocations()
        {
            var url = "https://oyyjbmbt83.execute-api.us-east-1.amazonaws.com/default/GetBusLocations";

            var authHeader = HttpContext.Request.Headers["Authorization"].ToString();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
                return Unauthorized(new { error = "Missing or invalid Authorization header." });

            var token = authHeader.Substring("Bearer ".Length);

            var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new { message = "Failed to fetch bus locations." });

            var responseBody = await response.Content.ReadAsStringAsync();

            // Deserialize directly into a list
            var buses = System.Text.Json.JsonSerializer.Deserialize<List<BusLocationDTO>>(responseBody, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (buses == null || buses.Count == 0)
                return NotFound(new { message = "No buses found." });

            return Ok(buses);
        }








    }
}
