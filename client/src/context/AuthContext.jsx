import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { loginUser, registerUser, logoutUser, getProfile, setLogoutHandler } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Define clear/logout function
  const handleLogoutState = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Register logout handler for api interceptor
  useEffect(() => {
    setLogoutHandler(handleLogoutState);
  }, []);

  // Fetch user profile on startup / silent refresh check
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const data = await getProfile();
          setUser(data.user);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          handleLogoutState();
        }
      } else {
        // If no access token exists in localStorage, try checking if refresh token exists in cookies
        try {
          const refreshUrl = `${import.meta.env.VITE_API_URL || ''}/api/auth/refresh`;
          const response = await axios.post(refreshUrl, {}, { withCredentials: true });
          const { token: newAccessToken } = response.data;
          
          localStorage.setItem('token', newAccessToken);
          const data = await getProfile();
          setUser(data.user);
        } catch (error) {
          // Silent failure - user is just not logged in
          console.log('No active session found.');
          handleLogoutState();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      handleLogoutState();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const data = await registerUser(name, email, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      handleLogoutState();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      handleLogoutState();
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
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
