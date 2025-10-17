using log4net;
using System.Net;
using System.Text.Json;

namespace Carevance.API.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILog _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILog logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                // Continue the request pipeline
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                // Handle exception and log it
                _logger.Error("An unhandled exception occurred.", ex);

                // Set the response details
                httpContext.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                httpContext.Response.ContentType = "application/json";

                var response = new { Message = "An unexpected error occurred." };

                // Return the response with the error message
                await httpContext.Response.WriteAsync(JsonSerializer.Serialize(response));
            }
        }
    }
}
