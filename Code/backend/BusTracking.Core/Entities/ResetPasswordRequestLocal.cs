using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusTracking.Core.Entities
{
    public class ResetPasswordRequestLocal
    {
        public string ResetToken { get; set; }
        public string NewPassword { get; set; }
    }
}
