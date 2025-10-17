using System.Text.Json.Serialization;

namespace BusTracking.Core.Entities
{
    public class AuthResponse
    {
        [JsonPropertyName("sessionToken")]
        public string SessionToken { get; set; }
        public string Challenge { get; set; }


    }

}
