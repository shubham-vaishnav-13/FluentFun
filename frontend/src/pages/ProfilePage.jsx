import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Star, Zap, Flame, Award, Edit, Camera, Sun, Moon, LogOut, Settings, Trophy, Target, Calendar, X, Save, User, Mail } from 'lucide-react';
import { levelBoundaries } from '../utils/level';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const ProfilePage = () => {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
  email: '',
  username: '',
  profileImage: null,
  preferredLanguages: []
  });
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleEditClick = () => {
    setEditForm({
      fullName: user.fullName || user.name || '',
      email: user.email || '',
  username: user.username || '',
  preferredLanguages: user.preferredLanguages || [],
      profileImage: null
    });
    setPreview(user.profileImage || '');
    setIsEditing(true);
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'profileImage' && files && files[0]) {
      const file = files[0];
      setEditForm(prev => ({
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
      setEditForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const togglePreferredLanguage = (code) => {
    setEditForm(prev => {
      const list = prev.preferredLanguages || [];
      if (list.includes(code)) return { ...prev, preferredLanguages: list.filter(c => c !== code) };
      return { ...prev, preferredLanguages: [...list, code] };
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await updateProfile({
        fullName: editForm.fullName,
        email: editForm.email,
  username: editForm.username,
  preferredLanguages: editForm.preferredLanguages,
        profileImage: editForm.profileImage
      });
      
      if (result.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({ fullName: '', email: '', profileImage: null });
    setPreview('');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app text-app">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
          <p className="muted-text">Fetching your profile</p>
        </div>
      </div>
    );
  }

  const name = user.fullName || user.username || user.name || 'Learner';
  const xp = user.xp || 0;
  const { level, currentLevelXP, nextLevelXP, progressPercent } = levelBoundaries(xp);
  const streak = user.streak || 0;

  const achievements = [
    { name: 'First Steps', icon: Target, unlocked: true, description: 'Complete your first lesson' },
    { name: 'Quiz Master', icon: Trophy, unlocked: xp >= 100, description: 'Score 100+ XP in quizzes' },
    { name: 'Word Smith', icon: Edit, unlocked: xp >= 200, description: 'Complete 10 writing exercises' },
    { name: 'Streak Keeper', icon: Flame, unlocked: streak >= 7, description: 'Maintain a 7-day streak' },
    { name: 'Level Up', icon: Star, unlocked: level >= 3, description: 'Reach level 3' },
    { name: 'Dedicated Learner', icon: Calendar, unlocked: streak >= 30, description: 'Maintain a 30-day streak' },
  ];

  const stats = [
    { label: 'Total XP', value: xp, icon: Zap, color: 'text-yellow-500' },
    { label: 'Current Level', value: level, icon: Star, color: 'text-brand-purple' },
    { label: 'Day Streak', value: streak, icon: Flame, color: 'text-orange-500' },
    { label: 'Achievements', value: achievements.filter(a => a.unlocked).length, icon: Award, color: 'text-green-500' },
  ];

  // map language codes to full display names
  const languageMap = {
    en: 'English',
    hi: 'Hindi',
    gu: 'Gujarati',
    fr: 'French',
    es: 'Spanish',
    de: 'German'
  };

  // explicit order for display (first 3 on first row, next 3 on second)
  const languages = ['en', 'hi', 'gu', 'fr', 'es', 'de'];

  return (
    <div className="min-h-screen bg-app text-app">
      <Navbar borderClass="border-app" />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface glass neon-card rounded-2xl border border-app p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative">
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={name} 
                  className="w-24 h-24 rounded-full border-4 border-white/20 shadow-lg object-cover" 
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white/20 shadow-lg bg-brand-dark flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <button 
                onClick={handleEditClick}
                className="absolute -bottom-1 -right-1 bg-brand-purple text-white p-2 rounded-full border-2 border-white/20 hover:scale-110 transition-transform"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-app mb-2">{name}</h1>
              <p className="muted-text mb-4">Learning enthusiast • Member since {new Date().getFullYear()}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                {stats.slice(0, 3).map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center space-x-2 text-sm">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="font-medium">{stat.value}</span>
                      <span className="muted-text">{stat.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={handleEditClick}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-app hover:bg-white/5 transition"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm">Edit Profile</span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Level Progress */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface glass neon-card rounded-2xl border border-app p-6"
            >
              <h2 className="text-xl font-semibold text-app mb-4">Level Progress</h2>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-app">Level {level}</span>
                  <span className="muted-text">{xp} / {nextLevelXP} XP</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="brand-progress-bg h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
              <p className="text-sm muted-text">
                {nextLevelXP - xp} XP needed to reach Level {level + 1}
              </p>
            </motion.div>

            {/* Achievements */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface glass neon-card rounded-2xl border border-app p-6"
            >
              <h2 className="text-xl font-semibold text-app mb-4">Achievements</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => {
                  const Icon = achievement.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`p-4 rounded-xl text-center transition-all cursor-pointer hover:scale-105 ${
                        achievement.unlocked 
                          ? 'bg-yellow-500/10 border-2 border-yellow-500/30' 
                          : 'bg-white/5 border border-white/10'
                      }`}
                      title={achievement.description}
                    >
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${
                        achievement.unlocked ? 'text-yellow-500' : 'text-gray-400'
                      }`} />
                      <h3 className={`font-semibold text-sm ${
                        achievement.unlocked ? 'text-yellow-500' : 'text-gray-400'
                      }`}>
                        {achievement.name}
                      </h3>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface glass neon-card rounded-2xl border border-app p-6"
            >
              <h3 className="text-lg font-semibold text-app mb-4">Quick Stats</h3>
              <div className="space-y-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-white/5">
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-sm muted-text">{stat.label}</p>
                        <p className="font-bold text-app">{stat.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-surface glass neon-card rounded-2xl border border-app p-6"
            >
              <h3 className="text-lg font-semibold text-app mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="muted-text">Completed quiz today</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="muted-text">Earned 25 XP</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="muted-text">Streak: {streak} days</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancelEdit}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface glass neon-card rounded-2xl border border-app p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-app">Edit Profile</h2>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 rounded-lg hover:bg-white/5 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Profile Image */}
                <div className="text-center">
                  <div className="relative inline-block">
                    {preview ? (
                      <img 
                        src={preview} 
                        alt="Profile preview" 
                        className="w-20 h-20 rounded-full object-cover border-4 border-white/20" 
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-brand-dark border-4 border-white/20 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">{name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <label className="absolute -bottom-1 -right-1 bg-brand-purple text-white p-2 rounded-full cursor-pointer hover:scale-110 transition-transform">
                      <Camera className="w-3 h-3" />
                      <input
                        type="file"
                        name="profileImage"
                        accept="image/*"
                        onChange={handleFormChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-sm muted-text mt-2">Click camera to change photo</p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-app mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="fullName"
                      value={editForm.fullName}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-app mb-2">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={editForm.username}
                    onChange={handleFormChange}
                    className="w-full pr-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    placeholder="Enter username"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-app mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* Preferred languages multi-select UI */}

                <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Preferred Languages</h4>
                <div className="grid grid-cols-3 gap-2">
                  {languages.map(code => {
                    const selected = (editForm.preferredLanguages || []).includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => togglePreferredLanguage(code)}
                        className={`w-full text-center px-3 py-2 rounded-lg text-sm font-medium transition focus:outline-none ${selected ? 'bg-black text-white' : 'bg-white/5 text-app'}`}
                      >
                        {languageMap[code]}
                      </button>
                    );
                  })}
                </div>
              </div>


                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-2.5 border border-app rounded-lg hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 neon-btn px-4 py-2.5 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
              
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
