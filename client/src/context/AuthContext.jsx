import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('imovies_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('imovies_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('imovies_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('imovies_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            console.warn('Session expired or invalid token');
            logout();
          } else {
            console.warn('Backend server temporarily unreachable or waking up:', err.message);
          }
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password, isAdmin = false) => {
    const endpoint = isAdmin ? '/auth/admin/login' : '/auth/login';
    const res = await api.post(endpoint, { email, password });
    if (res.data.success) {
      const userData = res.data.user || res.data.admin;
      setToken(res.data.token);
      setUser(userData);
      localStorage.setItem('imovies_token', res.data.token);
      localStorage.setItem('imovies_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, message: res.data.message };
  };

  // Strictly regular user registration; admin creation is restricted to internal admin tools
  const register = async (username, email, password) => {
    try {
      const res = await api.post('/auth/register', { username, email, password });
      if (res.data.success) {
        const userData = res.data.user;
        setToken(res.data.token);
        setUser(userData);
        localStorage.setItem('imovies_token', res.data.token);
        localStorage.setItem('imovies_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, message: res.data.message || 'Registration failed.' };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' && !err.response.data.includes('<!DOCTYPE') && err.response.data) ||
        err.message ||
        'Registration failed.';
      return { success: false, message: errorMsg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('imovies_token');
    localStorage.removeItem('imovies_user');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
