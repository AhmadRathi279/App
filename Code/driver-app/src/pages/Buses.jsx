import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Buses.css";

export default function Buses() {
  const [formData, setFormData] = useState({
    name: "" // Changed to exactly match backend expectation
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const backendUrl = import.meta.env.VITE_API_BASE_URL || '';

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
      const response = await fetch(`${backendUrl}/api/bus/add-bus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(formData)
      });

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to add bus');
      }

      setSuccessMessage(responseData.message || 'Bus added successfully!');
      setFormData({
        name: "" // Reset form
      });
    } catch (error) {
      console.error('Error adding bus:', error);
      setErrorMessage(error.message || 'An error occurred while adding bus');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="user-container">
      <form className="user-glass-card" onSubmit={handleSubmit}>
        <h2>Add New Bus</h2>
        
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
          <label htmlFor="name">Bus Name</label>
          <input
            type="text"
            id="name"
            name="name"  // Must match state key
            placeholder="Enter bus name"
            value={formData.name || ''}  // Ensure value is never undefined
            onChange={handleChange}
            required
          />
        </div>

        <button 
          type="submit" 
          className="action-btn primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Adding...
            </>
          ) : (
            <>
              <i className="fas fa-bus"></i> Add Bus
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