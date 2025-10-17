using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusTracking.Core.Entities
{
    public class ConfirmForgotPasswordCognito
    {

        public string Username { get; set; }
        public string ConfirmationCode { get; set; }
        public string Password { get; set; }
    }
}
