import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { useAuth } from '../context/AuthContext';


export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [locationStatus, setLocationStatus] = useState("pending");
  const [enhancedLocation, setEnhancedLocation] = useState(null);
  const [heading, setHeading] = useState(null);
  const backendUrl = import.meta.env.VITE_API_BASE_URL || '';
  
  // Refs to track the last sent time and initial send status
  const lastSentTimeRef = useRef(null);
  const initialSendDoneRef = useRef(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return <div>Loading...</div>;
  }
  
  // Function to check if token is valid
  const isTokenValid = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return false;
      
      // Simple check - you might want to add more robust validation
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Store location to backend with additional checks
  const storeBusLocation = async (latitude, longitude) => {
    try {
      // Check if token is still valid
      const tokenValid = await isTokenValid();
      if (!tokenValid) {
        console.log('Token invalid, skipping location update');
        return;
      }
      const busId = localStorage.getItem('busId');
      if (!busId) {
        console.error('No busId found in storage');
        return;
      }

      const response = await fetch(`${backendUrl}/api/Driver/store-location`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          busId: parseInt(busId),
          latitude: latitude,
          longitude: longitude
        })
      });

      if (!response.ok) {
        throw new Error('Failed to store location');
      }

      const data = await response.json();
      console.log('Location stored successfully:', data);
      
      // Update last sent time
      lastSentTimeRef.current = new Date();
      initialSendDoneRef.current = true;
    } catch (error) {
      console.error('Error storing location:', error);
    }
  };

  // Improved location functions
  const getEnhancedLocation = async () => {
    try {
      // 1. First try high-accuracy GPS
      const gpsPosition = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      const result = {
        coords: {
          latitude: gpsPosition.coords.latitude,
          longitude: gpsPosition.coords.longitude,
          accuracy: gpsPosition.coords.accuracy
        },
        source: 'gps',
        timestamp: new Date()
      };

      // Store location immediately when we get it (with checks)
      await storeBusLocation(result.coords.latitude, result.coords.longitude);

      // 2. If accuracy > 100m, try IP-based fallback
      if (gpsPosition.coords.accuracy > 100) {
        try {
          const ipResponse = await fetch('https://ipapi.co/json/');
          const ipData = await ipResponse.json();
          
          if (ipData.latitude && ipData.longitude) {
            const ipResult = {
              coords: {
                latitude: ipData.latitude,
                longitude: ipData.longitude,
                accuracy: 5000 // IP-based is less accurate
              },
              source: 'ip',
              timestamp: new Date()
            };
            await storeBusLocation(ipData.latitude, ipData.longitude);
            return ipResult;
          }
        } catch (ipError) {
          console.warn("IP-based fallback failed, using GPS:", ipError);
        }
      }

      return result;
    } catch (gpsError) {
      console.error("GPS failed, trying IP-based:", gpsError);
      try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        
        if (ipData.latitude && ipData.longitude) {
          const ipResult = {
            coords: {
              latitude: ipData.latitude,
              longitude: ipData.longitude,
              accuracy: 5000
            },
            source: 'ip',
            timestamp: new Date()
          };
          await storeBusLocation(ipData.latitude, ipData.longitude);
          return ipResult;
        }
      } catch (ipError) {
        console.error("All location methods failed:", ipError);
        throw new Error("Could not determine location");
      }
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // 1. Fetch bus data
        const email = sessionStorage.getItem('email') || localStorage.getItem('email');
        if (!email) throw new Error('No email found');
        
        const response = await fetch(`${backendUrl}/api/Driver/get-bus?email=${email}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch bus data');
        
        const data = await response.json();
        console.log("bus id is: ", data.bus_ID)
        if (data.bus_ID) {
          localStorage.setItem('busId', data.bus_ID);
        }

        // 2. Get enhanced location
        const location = await getEnhancedLocation();
        setEnhancedLocation(location);
        localStorage.setItem('userLatitude', location.coords.latitude);
        localStorage.setItem('userLongitude', location.coords.longitude);
        setLocationStatus("success");

        // 3. Initialize device sensors
        if (window.DeviceOrientationEvent) {
          const handleOrientation = (event) => {
            if (event.absolute && event.alpha !== null) {
              setHeading(Math.round(event.alpha));
            }
          };
          window.addEventListener('deviceorientation', handleOrientation);
          
          return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
          };
        }

      } catch (error) {
        console.error('Dashboard initialization error:', error);
        setLocationStatus("error");
        setLocationError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();

    // Set up interval for continuous location updates (every 5 minutes)
  // Set up interval for continuous location updates (every 5 minutes)
    const locationInterval = setInterval(async () => {
      try {
        const location = await getEnhancedLocation();
        setEnhancedLocation(location);
        await storeBusLocation(location.coords.latitude, location.coords.longitude);
        console.log('Location updated');

      } catch (error) {clearInterval
        console.error('Error updating location:', error);
      }
    }, 5 * 60 * 1000); // 1 minute in milliseconds

    return () => {
      clearInterval(locationInterval);
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [backendUrl]);

  const requestLocationAccess = () => {
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          },
          source: 'gps',
          timestamp: new Date()
        };
        setEnhancedLocation(location);
        await storeBusLocation(location.coords.latitude, location.coords.longitude);
        setLocationStatus("success");
      },
      (error) => {
        console.error('Permission request failed:', error);
        setLocationStatus("denied");
        setLocationError("Location access is required");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleLogout = () => {
    navigate("/");
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-overlay">
          <i className="fas fa-spinner fa-spin"></i> Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="logo-icon">🚐</span>
          <span>Driver Dashboard</span>
        </div>
        <div className="nav-buttons">
              <button
            className="nav-btn"
            onClick={() => {
              navigate("/dashboard");
              window.location.reload();
            }}
          >
            <i className="fas fa-home"></i> Home
          </button>
          {/* <button
            className="nav-btn"
            onClick={() => {
              navigate("/users");
              window.location.reload();
            }}
          >
            <i className="fas fa-users-cog"></i> Users
          </button>
          <button
            className="nav-btn"
            onClick={() => {
              navigate("/buses");
              window.location.reload();
            }}
          >
            <i className="fa fa-bus"></i> Buses
          </button> */}

          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {locationStatus === "denied" && (
          <div className="permission-banner">
            <div>
              <i className="fas fa-exclamation-triangle"></i>
              <span>Location access is required for optimal functionality.</span>
            </div>
            <button 
              className="location-permission-btn"
              onClick={requestLocationAccess}
            >
              Grant Location Access
            </button>
          </div>
        )}

        {locationError && locationStatus !== "denied" && (
          <div className={`warning-banner ${locationStatus}`}>
            <i className="fas fa-info-circle"></i>
            <span>{locationError}</span>
          </div>
        )}

        {enhancedLocation && (
          <div className="location-card glass-card">
            <h3>Precise Location Tracking</h3>
            <div className="location-details">
              <div>
                <span>Latitude:</span>
                <strong>{enhancedLocation.coords.latitude.toFixed(6)}</strong>
              </div>
              <div>
                <span>Longitude:</span>
                <strong>{enhancedLocation.coords.longitude.toFixed(6)}</strong>
              </div>
              <div>
                <span>Accuracy:</span>
                <strong>
                  {enhancedLocation.coords.accuracy < 1000
                    ? `±${Math.round(enhancedLocation.coords.accuracy)} meters`
                    : `~${Math.round(enhancedLocation.coords.accuracy/1000)} km`}
                </strong>
              </div>
              <div>
                <span>Source:</span>
                <strong>{enhancedLocation.source.toUpperCase()}</strong>
              </div>
              {heading && (
                <div>
                  <span>Heading:</span>
                  <strong>{heading}°</strong>
                </div>
              )}
            </div>
            <div className="location-actions">
              <button 
                className="map-btn"
                onClick={() => window.open(
                  `https://www.google.com/maps?q=${enhancedLocation.coords.latitude},${enhancedLocation.coords.longitude}`
                )}
              >
                <i className="fas fa-map-marked-alt"></i> View on Map
              </button>
              <button 
                className="refresh-btn"
                onClick={async () => {
                  setLocationStatus("refreshing");
                  try {
                    const location = await getEnhancedLocation();
                    setEnhancedLocation(location);
                    setLocationStatus("success");
                  } catch (error) {
                    setLocationStatus("error");
                    setLocationError("Failed to refresh location");
                  }
                }}
              >
                <i className="fas fa-sync-alt"></i> Refresh Location
              </button>
            </div>
          </div>
        )}

        <div className="welcome-card glass-card">
          <h1>Welcome Back, Driver!</h1>
          <p className="subtitle">Your journey management hub</p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <h3>{Math.floor(Math.random() * 50) + 1}</h3>
              <p>Scheduled Trips</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <h3>{ Math.floor(Math.random() * 500) + 50}</h3>
              <p>Completed Trips</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <h3>{(Math.random() * 1 + 4).toFixed(1)}</h3>
              <p>Average Rating</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🛣️</div>
              <h3>{Math.floor(Math.random() * 10000) + 1000}</h3>
              <p>Miles Driven</p>
            </div>
          </div>
        </div>

        <div className="quick-actions glass-card">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn primary">
              <i className="fas fa-plus-circle"></i> New Trip
            </button>
            {/* <button className="action-btn secondary">
              <i className="fas fa-map-marked-alt"></i> View Routes
            </button> */}
            <button className="action-btn tertiary">
              <i className="fas fa-file-invoice-dollar"></i> Earnings
            </button>
          </div>
        </div>

        <div className="recent-activity glass-card">
          <h2>Recent Activity</h2>
          <ul className="activity-list">
            <li>
              <span className="activity-icon">🚙</span>
              <span>Completed trip to Downtown (2 hours ago)</span>
            </li>
            <li>
              <span className="activity-icon">💰</span>
              <span>Received payment $42.50 (5 hours ago)</span>
            </li>
            <li>
              <span className="activity-icon">⭐</span>
              <span>Received 5-star rating (Yesterday)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}