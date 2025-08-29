import { createContext, useState, useEffect, useContext } from 'react';
import api from '../config/api.config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          // If there's a token, consider the session active until proven otherwise.
          // Ideally, fetch user profile here if backend exposes an endpoint.
          // setUser(await fetchMe())
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('accessToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
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
