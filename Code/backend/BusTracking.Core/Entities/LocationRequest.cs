using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusTracking.Core.Entities
{
    public class LocationRequest
    {
        public long busId { get; set; } 

        public float latitude { get; set; }

        public float longitude { get; set; }
    }
}
