import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, PenTool, Mic, Flame, Star, Zap, ArrowRight } from 'lucide-react';
import { levelBoundaries } from '../utils/level';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../config/api.config.js';

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
  const xp = user.xp || 0;
  const { level, currentLevelXP, nextLevelXP, progressPercent } = levelBoundaries(xp);
  const streak = user.streak || 0;
  const language = user.language || 'your language';

  const learningModules = [
    { id: 'quiz', title: 'Interactive Quizzes', description: 'Test your knowledge', icon: Brain, color: 'text-brand-blue', path: '/quiz-list', xp: 25, available: true },
    { id: 'writing', title: 'Writing Practice', description: 'Improve with AI feedback', icon: PenTool, color: 'text-green-500', path: '/challenges/writing', xp: 50, available: true },
    { id: 'speaking', title: 'Speaking Challenges', description: 'Coming soon – practice pronunciation with AI', icon: Mic, color: 'text-brand-purple', path: null, xp: 75, available: false }
  ];

  const stats = [
    { label: 'Total XP', value: xp, icon: Zap, color: 'text-yellow-500' },
    { label: 'Current Level', value: level, icon: Star, color: 'text-brand-purple' }
  ];

  // prefer languages from authenticated user, fallback to localStorage
  const [preferredLanguages, setPreferredLanguages] = React.useState([]);
  const [languageMap, setLanguageMap] = React.useState({});
  const [languagesLoading, setLanguagesLoading] = React.useState(true);

  const normalizeLanguages = (raw) => {
    if (!raw) return [];
    // If it's already an array, normalize each code
    if (Array.isArray(raw)) {
      return raw.map(c => String(c).replace(/[^a-zA-Z]/g, '').toLowerCase()).filter(Boolean);
    }
    // If it's a string, try JSON.parse then fallback to splitting
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(c => String(c).replace(/[^a-zA-Z]/g, '').toLowerCase()).filter(Boolean);
      } catch (e) {
        // not JSON — fall through
      }
  // split by comma or whitespace
  return raw.split(/[,\s]+/).map(c => String(c).replace(/[^a-zA-Z]/g, '').toLowerCase()).filter(Boolean);
    }
    return [];
  };

  React.useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLanguagesLoading(true);
        const response = await api.get('/content/languages');
        if (response.data.success && response.data.data) {
          const langMap = {};
          response.data.data.forEach(lang => {
            langMap[lang.code] = lang.name;
          });
          setLanguageMap(langMap);
        } else {
          console.error('Failed to fetch languages: Invalid response');
          setLanguageMap({});
        }
      } catch (error) {
        console.error('Failed to fetch languages:', error);
        setLanguageMap({});
      } finally {
        setLanguagesLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  React.useEffect(() => {
    // Only use user database values for preferred languages
    if (user?.preferredLanguages && Array.isArray(user.preferredLanguages)) {
      // normalize and dedupe
      const normalized = normalizeLanguages(user.preferredLanguages);
      const deduped = Array.from(new Set(normalized));
      setPreferredLanguages(deduped);
    } else {
      setPreferredLanguages([]);
    }
  }, [user]);

  // Ensure dashboard only displays languages that exist in languageMap
  React.useEffect(() => {
    if (!languageMap || Object.keys(languageMap).length === 0) return;
    setPreferredLanguages((prev) => {
      const codes = prev.map((c) => String(c).toLowerCase());
      const filtered = Array.from(new Set(codes)).filter((c) => languageMap[c]);
      return filtered;
    });
  }, [languageMap]);

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
            {/* Quick XP Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-brand-border flex items-center justify-between neon-card">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total XP</p>
                  <p className="text-2xl font-bold text-brand-dark mt-1 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> {xp}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-brand-border flex items-center justify-between neon-card">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Level</p>
                  <p className="text-2xl font-bold text-brand-dark mt-1">{level}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-brand-border flex items-center justify-between neon-card">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Progress</p>
                  <p className="text-2xl font-bold text-brand-dark mt-1">{Math.round(progressPercent)}%</p>
                </div>
              </div>
            </div>
            {/* Daily Challenge Card */}
              {/* Daily Challenge Card removed */}

            {/* Learning Modules */}
            <div>
              <h2 className="text-xl font-bold text-brand-dark mb-4">Start a new lesson</h2>
              {/* Language preferences card */}
              <div className="mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <button onClick={() => navigate('/select-language')} className="w-full text-left bg-white rounded-2xl p-4 border border-brand-border hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-brand-dark">Language Preferences</h3>
                          <p className="text-sm text-gray-500">Choose the language you want to learn in</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {learningModules.map((module, index) => {
                  const Icon = module.icon;
                  return (
                    <motion.div key={module.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}>
                      {module.available ? (
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
                      ) : (
                        <div className="block group cursor-not-allowed select-none">
                          <div className="bg-white rounded-2xl p-6 border border-brand-border flex items-center space-x-4 neon-card opacity-80">
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
                            <ArrowRight className="w-5 h-5 text-gray-300" />
                          </div>
                        </div>
                      )}
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
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-2">Preferred Languages</h4>
                {languagesLoading ? (
                  <p className="text-xs text-gray-500">Loading languages...</p>
                ) : preferredLanguages.length ? (
                  <div className="flex flex-wrap gap-2">
                    {preferredLanguages.map((code) => (
                      <span key={code} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                        {languageMap[code] || code.toUpperCase()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No preferred languages selected.</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;