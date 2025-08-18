import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
    });
    const token = localStorage.getItem("token");
    if (token) {
      instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    return instance;
  }, [user]);

  // Fetch profile helper
  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const { data } = await axiosInstance.get("/api/users/profile");
      setUser({
        _id: data._id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
      });
    } catch (err) {
      setUser(null);
      localStorage.removeItem("token");
    }
  };

  // On mount, fetch fresh profile if token present
  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  const login = async (credentials) => {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/users/login`,
      credentials
    );
    localStorage.setItem("token", res.data.token);

    // Manually update axiosInstance header before fetching profile
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;

    await fetchProfile();
  };

  const signup = async (credentials) => {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/users`,
      credentials
    );
    localStorage.setItem("token", res.data.token);

    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;

    await fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    axiosInstance,
    setUser,
    fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
  );
};
