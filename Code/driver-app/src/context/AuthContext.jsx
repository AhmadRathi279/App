import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticate, refreshToken } from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const storedEmail = localStorage.getItem('email');
        
        if (token && storedEmail) {
          // Use the stored email as user data
          setUser({ email: storedEmail });
          setIsAuthenticated(true);
          // You might want to fetch additional user data here if needed
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const clearAuthState = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('email');
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  const login = async (email, password) => {
    try {
      const response = await authenticate(email, password);
      
      if (response.challenge === "NEW_PASSWORD_REQUIRED") {
        return { 
          challenge: "NEW_PASSWORD_REQUIRED",
          session: response.session 
        };
      }
  
      // Store tokens from the API response
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('idToken', response.idToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('email', email);
  
      setUser({ email });
      setIsAuthenticated(true);
      
      return { 
        success: true,
        accessToken: response.accessToken,
        idToken: response.idToken,
        refreshToken: response.refreshToken
      };
    } catch (error) {
      clearAuthState();
      throw error;
    }
  };

  const logout = () => {
    clearAuthState();
  };

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};