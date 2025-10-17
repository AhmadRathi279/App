//using System;
//using System.Collections.Generic;
//using System.IdentityModel.Tokens.Jwt;
//using System.Security.Claims;
//using System.Text;
//using System.Threading.Tasks;
//using Carevance.Application.Authentication.Interfaces;
//using Carevance.Core.Entities;
//using Microsoft.Extensions.Configuration;
//using Microsoft.IdentityModel.Tokens;

//namespace MyApplication.Services.Authentication
//{
//    public class TokenService : ITokenService
//    {
//        private readonly IConfiguration _config;

//        public TokenService(IConfiguration config)
//        {
//            _config = config;
//        }

//        public string GenerateToken(LoginRequestLocal user)
//        {
//            var claims = new List<Claim>
//            {
//                new Claim(ClaimTypes.Name, user.Username)

//            };

//            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
//            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

//            var token = new JwtSecurityToken(
//                issuer: _config["Jwt:Issuer"],
//                audience: _config["Jwt:Audience"],
//                claims: claims,
//                expires: DateTime.Now.AddMinutes(30),
//                signingCredentials: creds);

//            return new JwtSecurityTokenHandler().WriteToken(token);
//        }

//        public async Task ResetPasswordAsync(string username)
//        {
//            // Simulating password reset action for local users
//            // In real applications, implement password reset logic here
//            Console.WriteLine($"Password reset process initiated for user: {username}");
//            await Task.CompletedTask;
//        }

//        public async Task DeactivateUserAsync(string userId)
//        {
//            // Simulating user deactivation
//            // Implement real deactivation logic (e.g., flag user as inactive in a database)
//            Console.WriteLine($"User with ID {userId} has been deactivated.");
//            await Task.CompletedTask;
//        }
//    }
//}
