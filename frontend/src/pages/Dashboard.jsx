import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, PenTool, Mic, Flame, Star, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-gray">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-dark mb-2">Loading...</h1>
          <p className="text-gray-500">Fetching your dashboard</p>
        </div>
      </div>
    );
  }

  const name = user.fullName || user.username || user.name || 'Learner';
  const level = user.level || 1;
  const xp = user.xp || 0;
  const streak = user.streak || 0;
  const language = user.language || 'your language';
  const nextLevelXP = level * 250;
  const currentLevelXP = (level - 1) * 250;
  const progressPercent = Math.min(((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100, 100);

  const learningModules = [
    { id: 'quiz', title: 'Interactive Quizzes', description: 'Test your knowledge', icon: Brain, color: 'text-brand-blue', path: '/quiz', xp: 25 },
    { id: 'writing', title: 'Writing Practice', description: 'Improve with AI feedback', icon: PenTool, color: 'text-green-500', path: '/writing', xp: 50 },
    { id: 'speaking', title: 'Speaking Challenges', description: 'Practice pronunciation', icon: Mic, color: 'text-brand-purple', path: '/speaking', xp: 75 }
  ];

  const stats = [
    { label: 'Current Streak', value: `${streak} days`, icon: Flame, color: 'text-orange-500' },
    { label: 'Total XP', value: xp, icon: Zap, color: 'text-yellow-500' },
    { label: 'Current Level', value: level, icon: Star, color: 'text-brand-purple' }
  ];

  return (
    <div className="min-h-screen bg-app text-app">
      <Navbar borderClass="border-brand-border" />

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <h1 className="text-3xl font-bold text-brand-dark">Welcome back, {name}!</h1>
          <p className="text-gray-500">Let's continue your language learning journey in {language}.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Challenge Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <Link to="/daily-challenge" className="block group">
                <div className="brand-gradient-bg text-white rounded-2xl p-6 flex items-center justify-between shadow-lg hover:shadow-xl transition-shadow">
                  <div>
                    <h2 className="text-xl font-bold">Daily Challenge</h2>
                    <p className="opacity-80">Complete your task to keep your streak alive!</p>
                  </div>
                  <div className="bg-white/20 p-3 rounded-full">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Learning Modules */}
            <div>
              <h2 className="text-xl font-bold text-brand-dark mb-4">Start a new lesson</h2>
              <div className="grid grid-cols-1 gap-4">
                {learningModules.map((module, index) => {
                  const Icon = module.icon;
                  return (
                    <motion.div key={module.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}>
                      <Link to={module.path} className="block group">
                        <div className="bg-white rounded-2xl p-6 border border-brand-border hover:border-brand-purple transition-colors flex items-center space-x-4 neon-card">
                          <div className={`p-3 rounded-xl bg-gray-100 ${module.color}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-brand-dark">{module.title}</h3>
                            <p className="text-sm text-gray-500">{module.description}</p>
                          </div>
                          <div className="flex items-center space-x-1 text-sm font-medium text-green-600">
                            <span>+{module.xp} XP</span>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-purple transition-colors" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-white rounded-2xl p-6 border border-brand-border neon-card">
              <h3 className="text-lg font-semibold text-brand-dark mb-4">Level Progress</h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-brand-dark">Level {level}</span>
                <span className="text-gray-500">{xp} / {nextLevelXP} XP</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <motion.div className="brand-progress-bg h-2.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1, delay: 0.3 }} />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="bg-white rounded-2xl p-6 border border-brand-border neon-card">
              <h3 className="text-lg font-semibold text-brand-dark mb-4">Stats</h3>
              <div className="space-y-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl bg-gray-100`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className="font-bold text-brand-dark">{stat.value}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;