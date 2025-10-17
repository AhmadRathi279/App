using Microsoft.AspNetCore.Mvc;
using BusTracking.Core.Entities;
using Carevance.API.Services.Authentication;
using System;
using System.Threading.Tasks;
using BusTracking.Application.Authentication.Interfaces;
using System.Data.Common;
using log4net;
using System.Data;
using Carevance.Infrastructure;
using System.Configuration;
using Dapper;
using Microsoft.AspNetCore.Identity.Data;
using System.Data.Entity;
using Amazon.CognitoIdentityProvider;
using Amazon.CognitoIdentityProvider.Model;

namespace Carevance.API.Controllers.Authentication
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILog _logger;

        public AuthController(IAuthService authService,  ILog logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("authenticate")]
        public async Task<IActionResult> Authenticate([FromBody] AuthRequestCognito authRequest)
        {
            if (authRequest == null || string.IsNullOrWhiteSpace(authRequest.Username) || string.IsNullOrWhiteSpace(authRequest.Password))
            {
                return BadRequest(new { error = "Username and password are required." });
            }

            try
            {
                _logger.Info($"Authentication attempt for user: {authRequest.Username}");
                var authResponse = await _authService.GetAuthResponse(authRequest.Username, authRequest.Password);

                if (authResponse.ChallengeName == ChallengeNameType.NEW_PASSWORD_REQUIRED)
                {
                    _logger.Info("New password required for user: " + authRequest.Username);
                    return Ok(new
                    {
                        challenge = "NEW_PASSWORD_REQUIRED",
                        session = authResponse.Session
                    });
                }

                if (authResponse.AuthenticationResult != null)
                {
                    _logger.Info($"Tokens recieved: {authResponse.AuthenticationResult}");
                   
                    return Ok(new
                    {
                        accessToken = authResponse.AuthenticationResult.AccessToken,
                        idToken = authResponse.AuthenticationResult.IdToken,
                        refreshToken = authResponse.AuthenticationResult.RefreshToken,
                       
                    });
                }

                return Unauthorized(new { error = "Invalid credentials." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }


        [HttpPost("set-new-password")]
        public async Task<IActionResult> SetNewPassword([FromBody] NewPasswordRequestCognito newPasswordRequest)
        {
            if (newPasswordRequest == null ||
                string.IsNullOrWhiteSpace(newPasswordRequest.Username) ||
                string.IsNullOrWhiteSpace(newPasswordRequest.NewPassword) ||
                string.IsNullOrWhiteSpace(newPasswordRequest.Session))
            {
                return BadRequest(new { error = "Username, new password, and session are required." });
            }

            try
            {
                _logger.Info($"Set New Password request Initiated for: {newPasswordRequest.Username}");
                var authResponse = await _authService.RespondToNewPasswordChallenge(
                    newPasswordRequest.Username,
                    newPasswordRequest.NewPassword,
                    newPasswordRequest.Session
                );

                if (authResponse.AuthenticationResult != null)
                {
                    _logger.Info($"Token request Initiated for: {newPasswordRequest.Username}");
                   
                    return Ok(new
                    {
                        accessToken = authResponse.AuthenticationResult.AccessToken,
                        idToken = authResponse.AuthenticationResult.IdToken,
                        refreshToken = authResponse.AuthenticationResult.RefreshToken,
                      
                    });
                }

                return Unauthorized(new { error = "Failed to complete new password challenge." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestCognito refreshTokenRequest)
        {
            if (refreshTokenRequest == null || string.IsNullOrWhiteSpace(refreshTokenRequest.RefreshToken))
            {
                return BadRequest(new { error = "Refresh token is required." });
            }

            try
            {
                _logger.Info($"Refresh Token request Initiated for: {refreshTokenRequest.username}");

                var authResponse = await _authService.RefreshAuthToken(refreshTokenRequest.RefreshToken, refreshTokenRequest.username);
                return Ok(authResponse);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }



        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordCognito request)
        {
            try
            {
                _logger.Info($"Forgot Password request Initiated for: {request.Username}");

                await _authService.ForgotPasswordAsync(request.Username);
                return Ok(new { message = "Password reset code sent successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("confirm-forgot-password")]
        public async Task<IActionResult> ConfirmForgotPassword([FromBody] ConfirmForgotPasswordCognito request)
        {
            try
            {
                _logger.Info($"Confirm Password request Initiated for: {request.Username}");

                await _authService.ConfirmForgotPasswordAsync(request.Username, request.ConfirmationCode, request.Password);
                return Ok(new { message = "Password reset successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }


        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCognito request)
        {
            try
            {
                _logger.Info($"Change Password request Initiated for: {request.Username}");

                await _authService.ChangePasswordAsync(request.Username, request.OldPassword, request.NewPassword, request.AccessToken);
                return Ok(new { message = "Password changed successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }


       

        [HttpGet("getdetails")]
        public async Task<IActionResult> GetUserDetails(string username)
        {
            try
            {
                _logger.Info($"Get User details request Initiated for: {username}");

                var userDetails = await _authService.GetUserDetailsAsync(username);
                if (userDetails == null)
                {
                    return NotFound("User not found");
                }

                return Ok(userDetails);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error: {ex.Message}");
            }
        }

    }
}
