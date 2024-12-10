import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'));

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch('http://localhost:8080/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success && data.token) {
        // Save token and userId
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        setToken(data.token);
        setUserId(data.userId);

        
        // const userResponse = await fetch(`http://localhost:8080/user/profile?userId=${data.userId}`, {
        //   headers: {
        //     'Authorization': `Bearer ${data.token}`
        //   }
        // });
        // Fetch user profile with the just userID and its a get method
        const userResponse = await fetch(`http://localhost:8080/user/profile?userId=${data.userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });        if (!userResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const userData = await userResponse.json();
        
        // Combine user data with userId for completeness
        const completeUserData = {
          ...userData,
          id: data.userId
        };
        
        setUser(completeUserData);
        localStorage.setItem('user', JSON.stringify(completeUserData));
        
        return { success: true };
      }

      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    setToken(null);
    setUserId(null);
    setUser(null);
  }, []);

  const register = useCallback(async (username, email, password) => {
    try {
      const response = await fetch('http://localhost:8080/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // Add a utility function for getting user feed
  const getUserFeed = useCallback(async () => {
    if (!token || !userId) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`http://localhost:8080/user/feed?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user feed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user feed:', error);
      throw error;
    }
  }, [token, userId]);

  // Add a utility function for getting user profile
  const getUserProfile = useCallback(async (profileId = userId) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`http://localhost:8080/user/profile?userId=${profileId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }, [token, userId]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      userId,
      login, 
      logout, 
      register,
      getUserFeed,
      getUserProfile
    }}>
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