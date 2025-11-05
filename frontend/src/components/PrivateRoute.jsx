import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { user, loading, isAuthenticated } = useAuth();
  
  useEffect(() => {
    // Log authentication state for debugging
    if (!loading) {
      // console.log('Authentication state in PrivateRoute:', { 
      //   isAuthenticated, 
      //   hasUser: !!user, 
      //   user: user ? { 
      //     id: user._id,
      //     email: user.email,
      //     name: user.fullName || user.username
      //   } : null
      // });
    }
  }, [loading, isAuthenticated, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-600">Verifying your account...</p>
      </div>
    );
  }

  // Double check both user and isAuthenticated to be safe
  return user || isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
