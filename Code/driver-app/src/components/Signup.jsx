import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = (e) => {
    e.preventDefault();
    console.log("Signup with", email, password);
  };

  return (
    <div className="container">
      <form className="card" onSubmit={handleSignup}>
        <h2>Create Account</h2>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Create a password"
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

        <button type="submit">Sign Up</button>
        <Link className="link" to="/">Already have an account? Log in</Link>
      </form>
    </div>
  );
}
