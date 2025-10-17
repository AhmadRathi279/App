using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusTracking.Core.Entities
{
    public class BusLocationDTO
    {
        public string BusID { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string Timestamp { get; set; }
        public string DriverName { get; set; }
        public string BusName { get; set; }
    }

}
