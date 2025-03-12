import { useContext, createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

// Create the Auth Context
export const AuthContext = createContext();

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [profileCache, setProfileCache] = useState({});
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    
    setLoading(false);
  }, []);

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.register(username, email, password);
      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.login(email, password);
      
      const userData = {
        id: result.userId,
        token: result.token,
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', result.token);
      
      setCurrentUser(userData);
      setToken(result.token);
      
      return result;
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setToken(null);
    setProfileCache({});
  };

  const getUserProfile = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      const targetUserId = userId || currentUser?.id;
      const cacheKey = `profile-${targetUserId}`;
      
      if (profileCache[cacheKey]) {
        const now = Date.now();
        const cacheAge = now - profileCache[cacheKey].timestamp;
        if (cacheAge < 60000) {
          return profileCache[cacheKey].data;
        }
      }
      
      const data = await authService.getUserProfile(targetUserId, token);
      
      setProfileCache(prev => ({
        ...prev,
        [cacheKey]: {
          data,
          timestamp: Date.now()
        }
      }));
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const authFetch = async (url, options = {}) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      return response;
    } catch (err) {
      console.error('Auth fetch error:', err);
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    token,
    register,
    login,
    logout,
    getUserProfile,
    authFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};