using System.ComponentModel.DataAnnotations;

namespace BusTracking.Core.Entities
{
    public class RefreshTokenRequestCognito
    {
        [Required]
        public string RefreshToken { get; set; }
        public string username { get; set; }
    }
}
