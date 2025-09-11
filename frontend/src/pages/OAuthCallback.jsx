import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Global flag to prevent multiple OAuth processing
let isOAuthProcessing = false;

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [status, setStatus] = useState('Initializing...');
  const hasProcessed = useRef(false); // Component-level flag
  
  useEffect(() => {
    // Prevent multiple executions at both component and global level
    if (hasProcessed.current || isOAuthProcessing) {
      return;
    }
    
    const processAuth = async () => {
      try {
        hasProcessed.current = true; // Mark component as processing
        isOAuthProcessing = true; // Mark globally as processing
        
        setStatus('Getting tokens...');
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const error = searchParams.get('error');
        
        if (error) {
          console.error('OAuth error from params:', error);
          toast.error(`Authentication failed: ${error}`);
          navigate('/login');
          return;
        }
        
        if (!accessToken) {
          console.error('Missing access token in callback URL');
          toast.error('Missing authentication tokens');
          navigate('/login');
          return;
        }
        
        console.log('Processing OAuth callback with token...');
        setStatus('Setting up authentication...');
        
        // Use the setTokens function from context, which will store tokens and fetch user
        const result = await setTokens(accessToken, refreshToken || '');
        
        if (result.success) {
          console.log('OAuth authentication successful');
          setStatus('Success! Redirecting...');
          
          // Show success toast only once
          toast.success('Successfully logged in with Google!');
          
          // Clear URL parameters to prevent re-processing
          window.history.replaceState({}, document.title, '/oauth-callback');
          
          // Navigate to dashboard
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
        } else {
          throw new Error(result.error || 'Failed to authenticate');
        }
      } catch (error) {
        console.error('OAuth callback processing failed:', error);
        console.error('Error details:', error.response?.data || error.message);
        toast.error('Authentication error. Please try again.');
        navigate('/login');
      } finally {
        setProcessing(false);
        // Reset global flag after a delay to allow for cleanup
        setTimeout(() => {
          isOAuthProcessing = false;
        }, 2000);
      }
    };
    
    processAuth();
  }, []); // Remove dependencies to prevent re-runs
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isOAuthProcessing = false;
    };
  }, []);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <h1 className="text-2xl font-bold mt-4 mb-2">Processing login...</h1>
        <p className="text-gray-600">{status}</p>
        {!processing && (
          <button 
            onClick={() => navigate('/dashboard', { replace: true })} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}

export default OAuthCallback;
