import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { setAuthToken } from '../utils/setAuthToken';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      setAuthToken(token);
      const decoded = jwtDecode(token);

      // Check if token expired
      if (decoded.exp * 1000 < Date.now()) {
        logout();
      } else {
        setUser(decoded);
        setIsAuthenticated(true);
      }
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('jwtToken', token);
    setAuthToken(token);
    const decoded = jwtDecode(token);
    setUser(decoded);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
