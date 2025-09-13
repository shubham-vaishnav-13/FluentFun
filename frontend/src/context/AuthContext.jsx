import { createContext, useState, useEffect, useContext } from 'react';
import api from '../config/api.config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          // Set authorization header for all future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          console.log('Found token, verifying authentication...');
          // Fetch user profile with token
          try {
            const response = await api.get('/users/me');
            if (response.data?.data) {
              console.log("User authenticated:", response.data.data);
              setUser(response.data.data);
            } else {
              console.error('User data missing in response');
              throw new Error('User data missing in response');
            }
          } catch (profileError) {
            console.error('Failed to fetch user profile:', profileError);
            console.error('Status:', profileError.response?.status);
            console.error('Response:', profileError.response?.data);
            
            // Only clear token if it's an authentication error (401 or 403)
            if (profileError.response?.status === 401 || profileError.response?.status === 403) {
              console.log('Clearing invalid token');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          }
        } else {
          console.log('No authentication token found');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      checkAuth();
    }
  }, [isInitialized]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });
      // Backend wraps payload in ApiResponse: { statusCode, data, message, success }
      const { user: userPayload, accessToken, refreshToken } = response.data?.data || {};
      
      localStorage.setItem('accessToken', accessToken);
      // Note: Refresh token should be httpOnly and secure
      
      setUser(userPayload);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const formData = new FormData();
      
      // Append all user data to formData
      Object.entries(userData).forEach(([key, value]) => {
        if (key === 'profileImage' && value) {
          formData.append('profileImage', value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      
      const response = await api.post('/users/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Register endpoint does not return tokens; it returns created user only.
      // Keep user logged out and ask them to login.
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      await api.get('/users/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  const setTokens = async (accessToken, refreshToken) => {
    try {
      console.log('Setting up auth tokens...');
      
      // Check if we already have this token to prevent duplicate processing
      const existingToken = localStorage.getItem('accessToken');
      if (existingToken === accessToken) {
        console.log('Token already set, skipping duplicate setup');
        return { success: true };
      }
      
      // Set the token in localStorage
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Configure axios with the new token
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Wait a brief moment to ensure token is properly set
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Fetch user profile using the new token
      console.log('Fetching user profile with token...');
      const response = await api.get('/users/me');
      const userProfile = response.data?.data;
      
      console.log('User profile fetched:', userProfile);
      
      if (userProfile) {
        setUser(userProfile);
        return { success: true };
      } else {
        console.error('User profile missing in response:', response.data);
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Token setup failed:', error);
      console.error('Error response:', error.response?.status, error.response?.data);
      
      // Don't remove token yet, might be an API issue
      return { 
        success: false, 
        error: error.response?.data?.message || 'Authentication failed. Please try again.' 
      };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const formData = new FormData();
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'profileImage' && value) {
          formData.append('profileImage', value);
        } else if (value !== undefined && value !== null) {
          // arrays should be appended as repeated fields or comma-separated
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        }
      });

      const response = await api.patch('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const updatedUser = response.data?.data;
      if (updatedUser) {
        setUser(updatedUser);
        return { success: true, data: updatedUser };
      }
      return { success: false, error: response.data?.message };
    } catch (error) {
      console.error('Update profile failed:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to update profile' };
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    isInitialized,
    login,
    register,
    logout,
    setTokens,
    updateProfile,
    updateUserXP: (deltaOrAbsolute) => {
      setUser(prev => {
        if (!prev) return prev;
        // If number passed and >= prev.xp treat as absolute, else add
        if (typeof deltaOrAbsolute === 'number') {
          if (prev.xp == null) return { ...prev, xp: deltaOrAbsolute };
          if (deltaOrAbsolute >= prev.xp) return { ...prev, xp: deltaOrAbsolute };
          return { ...prev, xp: prev.xp + deltaOrAbsolute };
        }
        if (deltaOrAbsolute && typeof deltaOrAbsolute === 'object' && typeof deltaOrAbsolute.xp === 'number') {
          return { ...prev, xp: deltaOrAbsolute.xp };
        }
        return prev;
      });
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
