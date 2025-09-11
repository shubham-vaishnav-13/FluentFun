import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    profileImage: null,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [preview, setPreview] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'profileImage' && files && files[0]) {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    setLoading(true);
    
    try {
      const { success, error } = await register({
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password,
        profileImage: formData.profileImage,
      });
      
      if (success) {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        toast.error(error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-gray flex items-center justify-center p-4">
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
          <h2 className="text-2xl font-bold text-center text-brand-dark mb-2">Create an Account</h2>
          <p className="text-center text-gray-500 mb-6">Start your language learning journey.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-sm font-medium text-gray-700 sr-only">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition"
                  placeholder="Username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 sr-only">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition"
                  placeholder="Full Name"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700 sr-only">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition"
                  placeholder="Email Address"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 sr-only">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition"
                  placeholder="Password (min. 6 characters)"
                  required
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 sr-only">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition"
                  placeholder="Confirm Password"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Profile Image Upload (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Profile Image</label>
              <div className="flex items-center mt-2">
                <div className="mr-4">
                  {preview ? (
                    <img src={preview} alt="Profile preview" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-brand-gray border border-brand-border flex items-center justify-center">
                      <span className="text-gray-400 text-xs">Photo</span>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="px-3 py-1.5 border border-brand-border rounded-md text-sm font-medium text-brand-dark bg-white hover:bg-brand-gray transition">
                    Choose File
                  </span>
                  <input
                    id="profileImage"
                    name="profileImage"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-purple hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
