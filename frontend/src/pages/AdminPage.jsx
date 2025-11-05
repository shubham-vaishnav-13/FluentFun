import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  PenTool, 
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import QuizManager from '../components/admin/QuizManager';
import WritingChallengeManager from '../components/admin/WritingChallengeManager';
import UserManager from '../components/admin/UserManager';
// import AnalyticsManager from '../components/admin/AnalyticsManager';
import AdminAPI from '../services/adminAPI';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await AdminAPI.getDashboardStats();
        setDashboardStats(response.data);
      } catch (error) {
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    if (user?.isAdmin) {
      fetchDashboardStats();
    }
  }, [user]);

  // Check if user is admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-app text-app flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-red-500">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'quizzes', label: 'Quizzes', icon: BookOpen },
    { id: 'writing', label: 'Writing Challenges', icon: PenTool },
    { id: 'users', label: 'Users', icon: Users },
    // { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  // Generate overview stats from API data or use defaults
  const overviewStats = dashboardStats ? [
    { 
      label: 'Total Users', 
      value: dashboardStats.overview.totalUsers.toString(), 
      icon: Users, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10' 
    },
    { 
      label: 'Active Users', 
      value: dashboardStats.overview.activeUsers.toString(), 
      icon: Users, 
      color: 'text-green-500', 
      bg: 'bg-green-500/10' 
    },
    { 
      label: 'Total Quizzes', 
      value: dashboardStats.content.totalQuizzes.toString(), 
      icon: BookOpen, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10' 
    },
    { 
      label: 'Writing Challenges', 
      value: dashboardStats.content.totalWritingChallenges.toString(), 
      icon: PenTool, 
      color: 'text-pink-500', 
      bg: 'bg-pink-500/10' 
    },
    { 
      label: 'New Users This Week', 
      value: dashboardStats.recent.newUsersThisWeek.toString(), 
      icon: Users, 
      color: 'text-cyan-500', 
      bg: 'bg-cyan-500/10' 
    },
  ] : [
    { label: 'Total Users', value: '...', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Quizzes', value: '...', icon: BookOpen, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Writing Challenges', value: '...', icon: PenTool, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-surface glass neon-card rounded-2xl border border-app p-6"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${stat.bg}`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-sm muted-text">{stat.label}</p>
                        <p className="text-2xl font-bold text-app">{stat.value}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-surface glass neon-card rounded-2xl border border-app p-6"
              >
                <h3 className="text-lg font-semibold text-app mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">New user registered: John Doe</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Quiz "English Basics" completed 15 times</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Writing challenge "Essay Writing" added</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-surface glass neon-card rounded-2xl border border-app p-6"
              >
                <h3 className="text-lg font-semibold text-app mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setActiveTab('quizzes')}
                    className="flex flex-col items-center p-4 rounded-lg border border-app hover:bg-white/5 transition"
                  >
                    <BookOpen className="w-6 h-6 text-green-500 mb-2" />
                    <span className="text-sm">Add Quiz</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('writing')}
                    className="flex flex-col items-center p-4 rounded-lg border border-app hover:bg-white/5 transition"
                  >
                    <PenTool className="w-6 h-6 text-orange-500 mb-2" />
                    <span className="text-sm">Add Writing</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="flex flex-col items-center p-4 rounded-lg border border-app hover:bg-white/5 transition"
                  >
                    <Users className="w-6 h-6 text-blue-500 mb-2" />
                    <span className="text-sm">Manage Users</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        );
      case 'quizzes':
        return <QuizManager />;
      case 'writing':
        return <WritingChallengeManager />;
      case 'users':
        return <UserManager />;
      // case 'analytics':
      //   return <AnalyticsManager />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-app text-app">
      <Navbar borderClass="border-app" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-app mb-2">Admin Dashboard</h1>
          <p className="muted-text">Manage your FluentFun platform content and users</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface glass neon-card rounded-2xl border border-app p-2 mb-8"
        >
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
        <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                    activeTab === tab.id
          ? 'bg-black text-white shadow-lg'
                      : 'text-gray-500 hover:text-app hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;
