import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Users.css";

// Helper class to match your backend response structure
class BusWrapper {
  constructor(data) {
    this.buses = data.buses || [];
  }
}

export default function Users() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    busId: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [buses, setBuses] = useState([]);
  const [isLoadingBuses, setIsLoadingBuses] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const backendUrl = import.meta.env.VITE_API_BASE_URL || '';

  // Fetch buses for dropdown
useEffect(() => {
  const fetchBuses = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/bus/buses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // First check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 100)}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch buses');
      }

      // Ensure the response is an array
      if (!Array.isArray(data)) {
        throw new Error('Invalid buses data format');
      }

      setBuses(data);
    } catch (error) {
      console.error('Error fetching buses:', error);
      setErrorMessage(error.message || 'Failed to load buses');
    } finally {
      setIsLoadingBuses(false);
    }
  };

  fetchBuses();
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
  
    try {
      // Prepare the data in the format your backend expects
      const userData = {
        username: formData.username,
        email: formData.email,
        temp_password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber,
        BusId: formData.busId
      };
  
      const response = await fetch(`${backendUrl}/api/user/add-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(userData)
      });
  
      // Read the response only once
      const responseText = await response.text();
      console.log('Raw response:', responseText);
  
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }
  
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create user');
      }
  
      // Handle successful response
      setSuccessMessage(responseData.message || 'User created successfully!');
      setFormData({
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        busId: "",
        password: ""
      });
  
    } catch (error) {
      console.error('Error creating user:', error);
      setErrorMessage(error.message || 'An error occurred while creating user');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="user-container">
      <form className="user-glass-card" onSubmit={handleSubmit}>
        <h2>Create New User</h2>
        
        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="alert alert-error">
            {errorMessage}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Enter username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Temporary Password</label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            placeholder="Enter temporary password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="password-checkbox-container">
          <label className="password-checkbox-label">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="password-checkbox-input"
            />
            <span className="password-checkbox-custom"></span>
            Show Password
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            placeholder="Enter phone number"
            value={formData.phoneNumber}
            onChange={handleChange}
            pattern="[0-9]{10}"
            title="10 digit phone number"
          />
        </div>

        <div className="name-fields">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              placeholder="Enter last name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="busId">Assigned Bus</label>
          {isLoadingBuses ? (
            <div className="dropdown-loading">
              <i className="fas fa-spinner fa-spin"></i> Loading buses...
            </div>
          ) : (
            <select
              id="busId"
              name="busId"
              value={formData.busId}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select a bus</option>
              {buses.map(bus => (
                <option key={bus.id} value={bus.id}>
                  {bus.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <button 
          type="submit" 
          className="action-btn primary"
          disabled={isSubmitting || isLoadingBuses}
        >
          {isSubmitting ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Creating...
            </>
          ) : (
            <>
              <i className="fas fa-user-plus"></i> Create User
            </>
          )}
        </button>
        
        <Link className="action-btn secondary" to="/admindashboard">
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </Link>
      </form>
    </div>
  );
}