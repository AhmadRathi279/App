import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./AdminDashboard.css";

// Fix for Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Component to update map center
function MapViewUpdater({ selectedBus }) {
  const map = useMap();

  useEffect(() => {
    if (selectedBus) {
      map.setView(
        [selectedBus.location.latitude, selectedBus.location.longitude],
        13,
        { animate: true, duration: 1 }
      );
    }
  }, [selectedBus, map]);

  return null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState(null);
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const backendUrl = import.meta.env.VITE_API_BASE_URL || '';

  // Random image URLs for buses
  const imageUrls = [
    "https://images.unsplash.com/photo-1678490881227-64446d3af543?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1642325017820-d081feea1969?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1657106385605-bd61d25018e9?w=600&auto=format&fit=crop&q=60",
    "https://media.istockphoto.com/id/1312265273/photo/bus-staying-in-the-parking-lot-under-a-blue-sky-with-clouds.webp?a=1&s=612x612&w=0&k=20",
    "https://media.istockphoto.com/id/186668632/photo/coach-on-the-road.webp?a=1&s=612x612&w=0&k=20",
    "https://media.istockphoto.com/id/1415331369/photo/blue-bus.webp?a=1&s=612x612&w=0&k=20",
    "https://images.unsplash.com/photo-1570125909517-53cb21c89ff2?q=80&w=1170&auto=format&fit=crop",
  ];

  useEffect(() => {
    // Fetch bus data from the backend
    const fetchBuses = async () => {
      try {
        const token = localStorage.getItem("accessToken"); // Adjust key based on your auth setup
        const response = await fetch(`${backendUrl}/api/User/get-locations`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        console.log("Getting Bus Location...")

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        const transformedBuses = data
          .filter(bus => 
            bus.latitude >= -90 && bus.latitude <= 90 && 
            bus.longitude >= -180 && bus.longitude <= 180
          )
          .map((bus, index) => ({
            id: bus.busID,
            name: bus.busName,
            // route: bus.busName, // Adjust if you have a specific route field
            status: bus.timestamp > new Date(Date.now() - 3600000).toISOString() ? "Active" : "Idle",
            location: { latitude: bus.latitude, longitude: bus.longitude },
            lastUpdated: new Date(bus.timestamp).toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Karachi' // Ensure PKT timezone
            }), // Format: DD/MM/YYYY HH:MM AM/PM
            driver: bus.driverName,
            image: imageUrls[index % imageUrls.length],
          }));

        setBuses(transformedBuses);
        setError(null);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching bus data:", error);
        setError("Failed to load bus data. Please check your authentication or try again later.");
        setBuses([]);
        setIsLoading(false);
      }
    };

    fetchBuses();
    const intervalId = setInterval(fetchBuses, 60000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (selectedBus && mapRef.current) {
      // Force map to re-render and adjust size
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, [selectedBus]);

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
          <span className="logo-icon">🚌</span>
          <span>Admin Dashboard</span>
        </div>
        <div className="nav-buttons">
          <button className="nav-btn" onClick={() => navigate("/admindashboard")}>
            <i className="fas fa-home"></i> Dashboard
          </button>
          <button className="nav-btn" onClick={() => navigate("/users")}>
            <i className="fas fa-users"></i> Drivers
          </button>
          <button className="nav-btn" onClick={() => navigate("/buses")}>
            <i className="fa fa-bus"></i> Buses
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i> {error}
          </div>
        )}

        <div className="welcome-card glass-card">
          <h1>Fleet Control Hub</h1>
          <p className="subtitle">Seamlessly manage your bus operations</p>
          <div className="stats-grid">
            {[
              { icon: "🚌", value: buses.length, label: "Total Buses" },
              { icon: "👨‍✈️", value: buses.filter(b => b.driver).length, label: "Active Drivers" },
              { icon: "🛣️", value: buses.filter(b => b.status === "Active").length, label: "Routes in Progress" },
              { icon: "📍", value: buses.filter(b => b.location).length, label: "Tracked Locations" },
            ].map((stat, index) => (
              <div key={index} className="stat-card animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="stat-icon">{stat.icon}</div>
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bus-list glass-card">
          <h2>Available Buses</h2>
          {buses.length === 0 && !error && (
            <p>No buses available.</p>
          )}
          <div className="bus-grid">
            {buses.map((bus, index) => (
              <div
                key={bus.id}
                className={`bus-card ${bus.status === "Active" ? "active" : "idle"} animate-slide-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedBus(bus)}
              >
                <div className="bus-image">
                  <img src={bus.image} alt={bus.name} />
                </div>
                <div className="bus-card-header">
                  <h3>{bus.name}</h3>
                  <span className={`status-dot ${bus.status.toLowerCase()}`}></span>
                </div>
                <div className="bus-details">
                  {/* <p><strong>Route:</strong> {bus.route}</p> */}
                  <p><strong>Driver:</strong> {bus.driver || "Unassigned"}</p>
                  <p><strong>Last Update:</strong> {bus.lastUpdated}</p>
                  <p><strong>Location:</strong> {bus.location.latitude.toFixed(4)}, {bus.location.longitude.toFixed(4)}</p>
                </div>
                <button
                  className="view-map-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBus(bus);
                  }}
                >
                  <i className="fas fa-map-marked-alt"></i> View Location
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="map-card glass-card">
          <h2>{selectedBus ? `${selectedBus.name} Location` : "Map"}</h2>
          <div className="map-container">
            <MapContainer
              center={[52.406109, -1.502008]} 
              zoom={13}
              ref={mapRef}
              style={{ height: "400px", width: "100%", borderRadius: "0.5rem" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {selectedBus && (
                <>
                  <MapViewUpdater selectedBus={selectedBus} />
                  <Marker position={[selectedBus.location.latitude, selectedBus.location.longitude]}>
                    <Popup>
                      <div>
                        <h3>{selectedBus.name}</h3>
                        {/* <p>Route: {selectedBus.route}</p> */}
                        <p>Driver: {selectedBus.driver || "Unassigned"}</p>
                        <p>Status: {selectedBus.status}</p>
                        <p>Lat: {selectedBus.location.latitude.toFixed(4)}</p>
                        <p>Lon: {selectedBus.location.longitude.toFixed(4)}</p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>
          </div>
          {selectedBus && (
            <button
              className="close-map-btn"
              onClick={() => setSelectedBus(null)}
            >
              <i className="fas fa-times"></i> Close Map
            </button>
          )}
        </div>

        <div className="actions-alerts-container">
          <div className="quick-actions glass-card">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button
                className="action-btn primary animate-slide-in"
                onClick={() => navigate("/buses")}
              >
                <i className="fas fa-plus-circle"></i> Add New Bus
              </button>
              <button
                className="action-btn tertiary animate-slide-in"
                onClick={() => navigate("/users")}
              >
                <i className="fas fa-user-plus"></i> Assign Driver
              </button>
            </div>
          </div>

          <div className="alerts-card glass-card">
            <h2>Recent Alerts</h2>
            <div className="alert-list">
              {[
                { icon: "⚠️", text: "Bus delayed by 15 minutes", time: "2h ago" },
                { icon: "🛠️", text: "Bus scheduled for maintenance", time: "4h ago" },
                { icon: "✅", text: "New driver assigned", time: "Yesterday" },
              ].map((alert, index) => (
                <div key={index} className="alert-item animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <span className="alert-icon">{alert.icon}</span>
                  <span>{alert.text}</span>
                  <span className="alert-time">{alert.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}