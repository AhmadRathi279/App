import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Update with your backend URL
// const API_BASE_URL = 'http://localhost:7161/api'; // Update with your backend URL


export const authenticate = async (username, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/authenticate`, {
      Username: username,
      Password: password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Authentication failed';
  }
};

export const handleNewPasswordChallenge = async (username, newPassword, session) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/set-new-password`, {
      Username: username,
      NewPassword: newPassword,
      Session: session
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Password change failed';
  }
};

export const forgotPassword = async (username) => {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
  
    if (!res.ok) {
      const err = await res.json();
      throw err.error || "Failed to send reset code";
    }
  
    return res.json();
};
  
export const confirmForgotPassword = async (username, confirmationCode, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/confirm-forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, confirmationCode, password }),
    });
  
    if (!res.ok) {
      const err = await res.json();
      throw err.error || "Failed to reset password";
    }
  
    return res.json();
};

export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      refreshToken
    });
    localStorage.setItem('accessToken', response.data.accessToken);
    return response.data.accessToken;
  } catch (error) {
    throw error.response?.data?.error || 'Token refresh failed';
  }
};

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshToken();
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Trigger logout if refresh fails
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);