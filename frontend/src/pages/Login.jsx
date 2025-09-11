import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      const success = result?.success ?? (result === true);
      if (success) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        const message = result?.error || 'Login failed. Please check your credentials.';
        toast.error(message);
      }
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app text-app flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-sm w-full"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 bg-brand-dark rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-brand-dark">FluentFun</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-8">
          <h2 className="text-2xl font-bold text-center text-brand-dark mb-2">Welcome Back</h2>
          <p className="text-center text-gray-500 mb-6">Sign in to continue your journey.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 sr-only">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition"
                  placeholder="Email Address"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 sr-only">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                const toastId = toast.loading('Redirecting to Google...');
                try {
                  // Use the API_URL from environment if available
                  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                  const googleAuthUrl = `${apiUrl.split('/api')[0]}/api/auth/google`;
                  
                  console.log('Redirecting to Google OAuth:', googleAuthUrl);
                  window.location.href = googleAuthUrl;
                } catch (error) {
                  console.error('Failed to redirect to Google:', error);
                  toast.error('Failed to redirect to Google authentication');
                  toast.dismiss(toastId);
                }
              }}
              className="w-full flex items-center justify-center space-x-2 border border-gray-300 py-2.5 rounded-lg hover:bg-black-100 transition-colors  text-black"
            >
              <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-6 h-6" alt="Google" />
              <span>Sign in with Google</span>
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            No account?{' '}
            <Link to="/signup" className="text-brand-purple hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
