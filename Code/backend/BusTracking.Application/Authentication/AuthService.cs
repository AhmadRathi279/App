using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using BusTracking.Application.Authentication.Interfaces;
using Microsoft.Extensions.Configuration;
using BusTracking.Core.Entities;
using System.Net.Http.Json;
using Amazon.CognitoIdentityProvider;
using Amazon.CognitoIdentityProvider.Model;
using Amazon.Runtime;
using Amazon;
using System.Security.Cryptography;


namespace Carevance.API.Services.Authentication
{
    public class AuthService : IAuthService
    {
        private readonly IConfiguration _config;
        private static string _url;
        private static string _code;
        private static string _state;
        private readonly AmazonCognitoIdentityProviderClient _cognitoClient;

        public AuthService(IConfiguration config)
        {
            _config = config;
            var accessKey = _config["Cognito:AccessKey"];
            var secretKey = _config["Cognito:SecretKey"];
            var region = _config["Cognito:Region"];

            if ( string.IsNullOrEmpty(region))
            {
                throw new Exception("AWS credentials are missing in configuration.");
            }

            _cognitoClient = new AmazonCognitoIdentityProviderClient(
                   new Amazon.Runtime.AnonymousAWSCredentials(),
                   RegionEndpoint.USEast1
               );
        }


        public async Task<InitiateAuthResponse> GetAuthResponse(string username, string password)
        {
            var clientId = _config["Cognito:ClientId"];
            var clientSecret = _config["Cognito:ClientSecret"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                throw new Exception("ClientId, Username, or Password is null or empty.");
            }

            var secretHash = !string.IsNullOrEmpty(clientSecret)
                ? CalculateSecretHash(clientId, clientSecret, username)
                : null;

            var authRequest = new InitiateAuthRequest
            {
                ClientId = clientId,
                AuthFlow = AuthFlowType.USER_PASSWORD_AUTH,
                AuthParameters = new Dictionary<string, string>
                {
                    { "USERNAME", username },
                    { "PASSWORD", password },
                    { "SECRET_HASH", secretHash }
                }
            };

           
            try
            {
                var authResponse = await _cognitoClient.InitiateAuthAsync(authRequest);

                return authResponse;  
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                throw;
            }
        }




        public static string CalculateSecretHash(string clientId, string clientSecret, string username)
        {
            string message = username + clientId;
            using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(clientSecret)))
            {
                byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
                return Convert.ToBase64String(hash);  
            }
        }

        public async Task<RespondToAuthChallengeResponse> RespondToNewPasswordChallenge(string username, string newPassword, string session)
        {
            var clientId = _config["Cognito:ClientId"];
            var clientSecret = _config["Cognito:ClientSecret"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(newPassword) || string.IsNullOrEmpty(session))
            {
                throw new Exception("ClientId, Username, NewPassword, or Session is null or empty.");
            }

            var secretHash = !string.IsNullOrEmpty(clientSecret)
                ? CalculateSecretHash(clientId, clientSecret, username)
                : null;

            var challengeRequest = new RespondToAuthChallengeRequest
            {
                ChallengeName = ChallengeNameType.NEW_PASSWORD_REQUIRED,
                ClientId = clientId,
                Session = session,
                ChallengeResponses = new Dictionary<string, string>
        {
            { "USERNAME", username },
            { "NEW_PASSWORD", newPassword }
        }
            };

            if (!string.IsNullOrEmpty(secretHash))
            {
                challengeRequest.ChallengeResponses.Add("SECRET_HASH", secretHash);
            }

            try
            {
                var response = await _cognitoClient.RespondToAuthChallengeAsync(challengeRequest);

                if (response.AuthenticationResult == null)
                {
                    throw new Exception("Failed to retrieve authentication tokens.");
                }

                return response;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                throw;
            }
        }

        public async Task<object> RefreshAuthToken(string refreshToken, string username)
        {
            var clientId = _config["Cognito:ClientId"];
            var clientSecret = _config["Cognito:ClientSecret"];

            if (string.IsNullOrEmpty(clientId))
            {
                throw new Exception("Cognito ClientId is missing in configuration.");
            }

            var secretHash = !string.IsNullOrEmpty(clientSecret)
                ? CalculateSecretHash(clientId, clientSecret, username)
                : null;

            var authParameters = new Dictionary<string, string>
    {
        { "REFRESH_TOKEN", refreshToken }
    };

            if (secretHash != null)
            {
                authParameters.Add("SECRET_HASH", secretHash);
            }

            var request = new InitiateAuthRequest
            {
                AuthFlow = AuthFlowType.REFRESH_TOKEN_AUTH,
                ClientId = clientId,
                AuthParameters = authParameters
            };

            var response = await _cognitoClient.InitiateAuthAsync(request);

            return new
            {
                AccessToken = response.AuthenticationResult.AccessToken,
                IdToken = response.AuthenticationResult.IdToken,
                ExpiresIn = response.AuthenticationResult.ExpiresIn
            };
        }

        public async Task ForgotPasswordAsync(string username)
        {
            var clientId = _config["Cognito:ClientId"];
            var clientSecret = _config["Cognito:ClientSecret"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                throw new Exception("Cognito ClientId or ClientSecret is missing in configuration.");
            }

            var secretHash = CalculateSecretHash(clientId, clientSecret, username);

            var forgotPasswordRequest = new ForgotPasswordRequest
            {
                ClientId = clientId,
                Username = username,
                SecretHash = secretHash
            };

            try
            {
                await _cognitoClient.ForgotPasswordAsync(forgotPasswordRequest);
            }
            catch (Exception ex)
            {
                throw new Exception("Error initiating forgot password: " + ex.Message);
            }
        }

        public async Task ConfirmForgotPasswordAsync(string username, string confirmationCode, string password)
        {
            var clientId = _config["Cognito:ClientId"];
            var clientSecret = _config["Cognito:ClientSecret"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                throw new Exception("Cognito ClientId or ClientSecret is missing in configuration.");
            }

            var secretHash = CalculateSecretHash(clientId, clientSecret, username);

            var confirmForgotPasswordRequest = new ConfirmForgotPasswordRequest
            {
                ClientId = clientId,
                Username = username,
                ConfirmationCode = confirmationCode,
                Password = password,
                SecretHash = secretHash
            };

            try
            {
                await _cognitoClient.ConfirmForgotPasswordAsync(confirmForgotPasswordRequest);
            }
            catch (Exception ex)
            {
                throw new Exception("Error confirming password reset: " + ex.Message);
            }
        }

        public async Task ChangePasswordAsync(string username, string oldPassword, string newPassword, string AccessToken)
        {
            var clientId = _config["Cognito:ClientId"];
            var clientSecret = _config["Cognito:ClientSecret"];

            if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
            {
                throw new Exception("Cognito ClientId or ClientSecret is missing in configuration.");
            }

            var secretHash = CalculateSecretHash(clientId, clientSecret, username);

            var changePasswordRequest = new Amazon.CognitoIdentityProvider.Model.ChangePasswordRequest
            {
                AccessToken = AccessToken, 
                PreviousPassword = oldPassword,
                ProposedPassword = newPassword
            };

            try
            {
                await _cognitoClient.ChangePasswordAsync(changePasswordRequest);
            }
            catch (Exception ex)
            {
                throw new Exception("Error changing password: " + ex.Message);
            }
        }


        public async Task DeactivateAccountAsync(string username)
        {
            var clientId = _config["Cognito:ClientId"];

            if (string.IsNullOrEmpty(clientId))
            {
                throw new Exception("Cognito ClientId is missing in configuration.");
            }

            var adminDisableUserRequest = new AdminDisableUserRequest
            {
                UserPoolId = _config["Cognito:UserPoolId"], 
                Username = username
            };

            try
            {
                await _cognitoClient.AdminDisableUserAsync(adminDisableUserRequest);
            }
            catch (Exception ex)
            {
                throw new Exception("Error deactivating account: " + ex.Message);
            }
        }




        

      




        //public async Task CreateUserAsync(DBUser request)
        //{
        //    var userPoolId = _config["Cognito:UserPoolId"];
        //    var clientId = _config["Cognito:ClientId"];
        //    var clientSecret = _config["Cognito:ClientSecret"];

        //    if (string.IsNullOrEmpty(userPoolId) || string.IsNullOrEmpty(clientId))
        //    {
        //        throw new Exception("Cognito configuration is missing.");
        //    }

        //    var adminCreateUserRequest = new AdminCreateUserRequest
        //    {
        //        UserPoolId = userPoolId,
        //        Username = request.Username,
        //        UserAttributes = new List<AttributeType>
        //    {
        //        new AttributeType
        //        {
        //            Name = "email",
        //            Value = request.Email
        //        },
        //        new AttributeType
        //        {
        //            Name = "given_name",
        //            Value = request.first_name
        //        },
        //        new AttributeType
        //        {
        //            Name = "family_name",
        //            Value = request.last_name
        //        },
        //        new AttributeType
        //        {
        //            Name = "phone_number",
        //            Value = request.primary_contact_number
        //        }
        //    },
        //        TemporaryPassword = request.Password,
        //        MessageAction = MessageActionType.SUPPRESS
        //    };

        //    try
        //    {
        //        await _cognitoClient.AdminCreateUserAsync(adminCreateUserRequest);
        //    }
        //    catch (Exception ex)
        //    {
        //        throw new Exception("Error creating user in Cognito: " + ex.Message);
        //    }
        //}


      
        //public async Task UpdateUserAsync(DBUser request)
        //{
        //    var userPoolId = _config["Cognito:UserPoolId"];
        //    var clientId = _config["Cognito:ClientId"];
        //    var clientSecret = _config["Cognito:ClientSecret"];

        //    if (string.IsNullOrEmpty(userPoolId) || string.IsNullOrEmpty(clientId))
        //    {
        //        throw new Exception("Cognito configuration is missing.");
        //    }

        //    var adminUpdateUserRequest = new AdminUpdateUserAttributesRequest
        //    {
        //        UserPoolId = userPoolId,
        //        Username = request.Username,
        //        UserAttributes = new List<AttributeType>
        //{
        //    new AttributeType
        //    {
        //        Name = "email",
        //        Value = request.Email
        //    },
        //    new AttributeType
        //    {
        //        Name = "given_name",
        //        Value = request.first_name
        //    },
        //    new AttributeType
        //    {
        //        Name = "family_name",
        //        Value = request.last_name
        //    },
        //    new AttributeType
        //    {
        //        Name = "phone_number",
        //        Value = request.primary_contact_number
        //    }
        //}
        //    };

        //    try
        //    {
        //        await _cognitoClient.AdminUpdateUserAttributesAsync(adminUpdateUserRequest);
        //    }
        //    catch (Exception ex)
        //    {
        //        throw new Exception("Error updating user in Cognito: " + ex.Message);
        //    }
        //}

        public async Task<GetUserResponse> GetUserDetailsAsync(string username)
        {
            try
            {
                var request = new AdminGetUserRequest
                {
                    UserPoolId = _config["Cognito:UserPoolId"],
                    Username = username
                };

                var response = await _cognitoClient.AdminGetUserAsync(request);

                var userDetails = new GetUserResponse
                {
                    Username = response.Username,
                    UserAttributes = response.UserAttributes
                };

                return userDetails;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error fetching user details: {ex.Message}");
            }
        }

      



    }
}
