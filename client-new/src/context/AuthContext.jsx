import { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { setAuthToken } from '../utils/setAuthToken';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get('/users/profile');
      setUser(prev => ({ ...prev, ...response.data }));
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      setAuthToken(token);
      const decoded = jwtDecode(token);

      // Check if token expired
      if (decoded.exp * 1000 < Date.now()) {
        logout();
        setLoading(false);
      } else {
        setUser(decoded);
        setIsAuthenticated(true);
        fetchUserProfile().finally(() => setLoading(false));
        return;
      }
    }
    setLoading(false);
  }, []);

  const login = async (token) => {
    localStorage.setItem('jwtToken', token);
    setAuthToken(token);
    const decoded = jwtDecode(token);
    setUser(decoded);
    setIsAuthenticated(true);
    await fetchUserProfile();
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, refreshUser: fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
