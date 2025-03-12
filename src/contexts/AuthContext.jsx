import { useContext, createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import config from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    // Initialize state from localStorage
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [profileCache, setProfileCache] = useState({});
  
  // Effect to sync authentication state with localStorage
  useEffect(() => {
    if (currentUser && token) {
      localStorage.setItem('user', JSON.stringify(currentUser));
      localStorage.setItem('token', token);
    }
  }, [currentUser, token]);

  // Initial auth check
  useEffect(() => {
    const validateAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          // Verify token is still valid by making a test request
          const user = JSON.parse(storedUser);
          const response = await fetch(`${config.apiUrl}/user/profile?userId=${user.id}`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (!response.ok) {
            // Token is invalid, clear authentication
            logout();
          } else {
            setCurrentUser(user);
            setToken(storedToken);
          }
        } catch (err) {
          console.error('Auth validation error:', err);
          logout();
        }
      }
      setLoading(false);
    };

    validateAuth();
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