using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusTracking.Core.Entities
{
    public class NewPasswordRequestCognito
    {
        public string Username { get; set; }
        public string NewPassword { get; set; }
        public string Session { get; set; }

    }
}
