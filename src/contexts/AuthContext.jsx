import { useContext, createContext, useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
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
  const authValidationInProgress = useRef(false);
  const requestCache = useRef({}); // Define requestCache ref here
  
  // Effect to sync authentication state with localStorage
  useEffect(() => {
    if (currentUser && token) {
      localStorage.setItem('user', JSON.stringify(currentUser));
      localStorage.setItem('token', token);
    } else if (!currentUser && !token) {
      // Ensure local storage is cleared if state is cleared elsewhere
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }, [currentUser, token]);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setToken(null);
    requestCache.current = {}; // Clear request cache on logout
  }, []); // No dependencies needed if it only uses setters and refs

  // Memoize authFetch FIRST
  const authFetch = useCallback(async (url, options = {}) => {
    const currentToken = token; // Use token from state directly

    if (!currentToken) {
      logout();
      throw new Error('No authentication token available. User logged out.');
    }

    const headers = {
      'Content-Type': 'application/json', // Default content type
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`
    };

    const bypassCache = options.bypassCache === true;
    const fetchOptions = { ...options, headers }; 
    delete fetchOptions.bypassCache; 

    const isGet = !fetchOptions.method || fetchOptions.method.toUpperCase() === 'GET';
    const cacheKey = isGet ? url : null;

    // Check cache - Keep this manual caching for now, react-query handles its own
    if (!bypassCache && cacheKey && requestCache.current[cacheKey]) {
      const cachedData = requestCache.current[cacheKey];
      const now = Date.now();
      if (now - cachedData.timestamp < 300000) { // 5 minutes cache
        return new Response(JSON.stringify(cachedData.data), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-Data-Source': 'ManualCache' }
        });
      }
    }

    try {
      
      const response = await fetch(url, fetchOptions);

      if (!response.ok && (response.status === 401 || response.status === 403)) {
          console.warn(`Auth fetch received ${response.status} for ${url}. Logging out.`);
          logout();
          throw new Error(`Authentication failure (${response.status})`);
      }

      // Store in manual cache if GET and OK
      if (cacheKey && response.ok && isGet) {
        const clone = response.clone();
        try {
            const data = await clone.json();
             requestCache.current[cacheKey] = {
               data,
               timestamp: Date.now()
             };
        } catch (jsonError) {
             console.error(`Error parsing JSON for manual caching ${url}:`, jsonError);
        }
      } else if (!response.ok) {
         console.warn(`API request to ${url} failed with status ${response.status}`);
         if (cacheKey && requestCache.current[cacheKey]) {
            delete requestCache.current[cacheKey];
         }
      }

      return response;
    } catch (err) {
      if (err.message.startsWith('Authentication failure')) {
          throw err;
      }
      throw new Error(`Network error or issue fetching ${url}: ${err.message}`); 
    }
  }, [token, logout]); // Depends only on token state and the stable logout function

  // Initial auth check (Now it can safely depend on 'logout')
  useEffect(() => {
    const validateAuth = async () => {
      if (authValidationInProgress.current) return;
      authValidationInProgress.current = true;
      
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          const user = JSON.parse(storedUser);
          
          // Verify token by making a *direct fetch* request, not using authFetch here
          const response = await fetch(`${config.apiUrl}/user/profile?userId=${user.id}`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (!response.ok) {
             if (response.status === 401 || response.status === 403) {
               logout(); // Use the memoized logout
             } else {
               setError('Failed to validate session.'); 
               // Keep loading false, let user attempt login
             }
          } else {
            // Token valid, set state
            setCurrentUser(user);
            setToken(storedToken);
          }
        } catch (err) {
          console.error('Auth validation error during fetch:', err);
          setError('An error occurred during session validation.');
        }
      } else {
         // No user/token found, do nothing, user needs to login
      }
      setLoading(false); // Always set loading false after check
      authValidationInProgress.current = false;
    };

    validateAuth();
  }, [logout]); // Only depends on the stable logout function

  const register = async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.register(username, email, password);
      return result;
    } catch (err) {
      setError(err.message);
      // Rethrow or return specific error structure
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.login(email, password);
      if (result.success && result.userId && result.token) {
          const userData = { id: result.userId }; // Store only essential ID, not the token itself in user object
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('token', result.token);
          setCurrentUser(userData);
          setToken(result.token);
          return { success: true };
      } else {
           throw new Error(result.error || 'Login failed: Invalid credentials or server error');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      // Rethrow or return specific error structure
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  // Value provided to context
  const value = {
    currentUser,
    loading,
    error,
    token,
    register,
    login,
    logout,
    authFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Add propTypes validation
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => {
  return useContext(AuthContext);
};