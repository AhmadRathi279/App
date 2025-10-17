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

namespace Carevance.API.Controllers.Bus
{

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BusController : ControllerBase
    {
        //private readonly IUserService _userService;
        private readonly IAuthService _authService;

        public BusController( IAuthService authService)
        {
            _authService = authService;
        }

        [HttpGet("buses")]
        public async Task<IActionResult> GetAllBuses()
        {
            var url = "https://s1xkb2yaqd.execute-api.us-east-1.amazonaws.com/default/GetBus";

            var authHeader = HttpContext.Request.Headers["Authorization"].ToString();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
                return Unauthorized(new { error = "Missing or invalid Authorization header." });

            var token = authHeader.Substring("Bearer ".Length);

            var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.GetAsync(url);
            var responseBody = await response.Content.ReadAsStringAsync();

            // Deserialize the "buses" list from the Lambda response
            var result = System.Text.Json.JsonSerializer.Deserialize<BusWrapper>(responseBody, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (result?.buses == null)
                return NotFound(new { message = "No buses found." });

            return Ok(result.buses);
        }



        [HttpPost("add-bus")]
        public async Task<IActionResult> AddBus([FromBody] Buses bus)
        {
            var url = "https://uzaxt2r9t8.execute-api.us-east-1.amazonaws.com/default/CreateBus";

            var authHeader = HttpContext.Request.Headers["Authorization"].ToString();
            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
                return Unauthorized(new { error = "Missing or invalid Authorization header." });

            var token = authHeader.Substring("Bearer ".Length);

            // Serialize directly the bus object { bus_name = "..." }
            var json = System.Text.Json.JsonSerializer.Serialize(bus);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            return Content(responseBody, "application/json");
        }








    }
}
