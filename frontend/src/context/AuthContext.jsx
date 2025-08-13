import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
    });
    const token = localStorage.getItem('token');
    if (token) {
      instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return instance;
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          // Use decoded.id, decoded.name, and decoded.email to set user state
          setUser({ _id: decoded.id, name: decoded.name, email: decoded.email });
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/users/login`, credentials);
      localStorage.setItem('token', res.data.token);
      const decoded = jwtDecode(res.data.token);
      setUser({ _id: decoded.id, name: res.data.name, email: res.data.email });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed.');
    }
  };

  const signup = async (credentials) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/users`, credentials);
      localStorage.setItem('token', res.data.token);
      const decoded = jwtDecode(res.data.token);
      setUser({ _id: decoded.id, name: res.data.name, email: res.data.email });
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Sign up failed.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    axiosInstance,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
