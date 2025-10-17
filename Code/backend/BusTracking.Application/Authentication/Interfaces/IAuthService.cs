using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Amazon.CognitoIdentityProvider.Model;
using BusTracking.Core.Entities;

namespace BusTracking.Application.Authentication.Interfaces
{
    public interface IAuthService
    {
        Task<InitiateAuthResponse> GetAuthResponse(string username, string password);
        Task<RespondToAuthChallengeResponse> RespondToNewPasswordChallenge(string username, string newpassword, string session);
        Task<object> RefreshAuthToken(string refreshToken, string username);
        Task ForgotPasswordAsync(string username);
        Task ConfirmForgotPasswordAsync(string username, string confirmationCode, string password);
        Task ChangePasswordAsync(string username, string oldPassword, string newPassword, string AccessToken);
        Task DeactivateAccountAsync(string username);
        //Task CreateUserAsync(DBUser request);
        //Task UpdateUserAsync(DBUser request);
        Task<GetUserResponse> GetUserDetailsAsync(string username);

      
    }
}
