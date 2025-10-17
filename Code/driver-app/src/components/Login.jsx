import "./Login.css";
import { useAuth } from '../context/AuthContext';
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authenticate, handleNewPasswordChallenge } from "../api/auth";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("ahmadrathi77@gmail.com"); //useState("ahmad.mamoon50@gmail.com");
  const [password, setPassword] = useState("Ahmad_Rathi_3"); //useState("Ahmad_Mamoon_2");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPasswordRequired, setNewPasswordRequired] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [session, setSession] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const result = await login(email, password);
      
      if (result.challenge === "NEW_PASSWORD_REQUIRED") {
        setNewPasswordRequired(true);
        setSession(result.session);
      } else {
        if(email == 'ahmadrathi77@gmail.com' || email == 'ahmad.mamoon50@gmail.com')
          navigate('/admindashboard')
        else
          navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await handleNewPasswordChallenge(
        email,
        newPassword,
        session
      );
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('idToken', response.idToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('email', email);

      navigate('/dashboard');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (newPasswordRequired) {
    return (
      <div className="new-password-modal">
        <div className="new-password-content">
          <h2>Set Your New Password</h2>
          <p className="subtitle">Welcome! Please set a new password for your account.</p>
          
          <form onSubmit={handleNewPasswordSubmit}>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {passwordError && (
                <p className="error-message">{passwordError}</p>
              )}
            </div>
            
            <div className="checkbox-container">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                Show Password
              </label>
            </div>
            
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Setting Password...
                </>
              ) : (
                "Continue"
              )}
            </button>
            
            {error && (
              <p className="error-message">{error}</p>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <form className="card" onSubmit={handleLogin}>
        <h2>Welcome Back</h2>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="checkbox-container">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="checkbox-input"
            />
            <span className="checkbox-custom"></span>
            Show Password
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        
        {error && <p className="error-message">{error}</p>}
        
        <div className="links">
          {/* <Link className="link" to="/signup">Don't have an account? Sign up</Link> */}
          <Link className="link" to="/forgot-password">Forgot password?</Link>
        </div>
      </form> 
    </div>
  );
}