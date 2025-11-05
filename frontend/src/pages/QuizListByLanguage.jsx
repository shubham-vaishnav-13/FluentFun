import { toast } from 'react-hot-toast';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../config/api.config.js';
import { API_PATHS } from '../config/apiPaths.js';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Flame, School, Award, Lock, CheckCircle2, Play } from 'lucide-react';
import { getProgression } from '../services/quizAPI.js';

export default function QuizListByLanguage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [languages, setLanguages] = React.useState([]);
  const [counts, setCounts] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [loadingCounts, setLoadingCounts] = React.useState({});
  const [activeLanguage, setActiveLanguage] = React.useState(null);
  const [activeDifficulty, setActiveDifficulty] = React.useState(null);
  const [progression, setProgression] = React.useState([]);
  const [loadingProgression, setLoadingProgression] = React.useState(false);
  const [errorProgression, setErrorProgression] = React.useState('');

  React.useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const res = await api.get(API_PATHS.CONTENT.GET_LANGUAGES);
        if (res.data?.success) setLanguages(res.data.data || []);
      } catch (e) {
  toast.error('Failed to load languages');
      } finally {
        setLoading(false);
      }
    };
    fetchLanguages();
  }, []);

  React.useEffect(() => {
    if (!user?.preferredLanguages || !languages.length) return;
    user.preferredLanguages.forEach(async (code) => {
      try {
        setLoadingCounts(prev => ({ ...prev, [code]: true }));
        const res = await api.get('/content/quizzes/counts', { params: { language: code } });
        if (res.data?.success) setCounts(prev => ({ ...prev, [code]: res.data.data }));
      } catch (err) {
  toast.error('Failed to load quiz counts');
      } finally {
        setLoadingCounts(prev => ({ ...prev, [code]: false }));
      }
    });
  }, [user, languages]);

  const openDifficulty = async (languageCode, difficulty) => {
    setActiveLanguage(languageCode);
    setActiveDifficulty(difficulty);
    setProgression([]);
    setErrorProgression('');
    setLoadingProgression(true);
    try {
      const res = await getProgression({ language: languageCode, difficulty });
      if (res?.success) {
        const list = res.data || [];
        const unique = Array.from(new Map(list.map(q => [q.quizId, q])).values())
          .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
        setProgression(unique);
      } else {
        setErrorProgression(res?.message || 'Failed to load progression');
      }
    } catch (e) {
  toast.error('Failed to load progression');
      setErrorProgression(e.message || 'Error loading progression');
    } finally {
      setLoadingProgression(false);
    }
  };

  const closeProgression = () => {
    setActiveLanguage(null);
    setActiveDifficulty(null);
  };

  const launchQuiz = (quizId, opts = {}) => {
    if (!quizId) return;
    const { retry } = opts;
    navigate(`/quiz/${quizId}${retry ? '?retry=1' : ''}`);
  };

  return (
    <div className="min-h-screen bg-app text-app">
      <Navbar borderClass="border-brand-border" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-3">Interactive Quizzes</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Challenge yourself with our quizzes and boost your language skills. Choose a language and difficulty level to get started.</p>
        </motion.div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-purple"></div>
          </div>
        ) : user?.preferredLanguages && user.preferredLanguages.length ? (
          <>
            <div className="grid grid-cols-1 gap-8 mt-12">
              {user.preferredLanguages.map((code, index) => {
                const lang = languages.find(l => l.code === code) || { code, name: code.toUpperCase() };
                const c = counts[code] || { beginner: 0, intermediate: 0, advanced: 0, total: 0 };
                const isLoading = loadingCounts[code];
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    key={code}
                    className="bg-white rounded-2xl p-8 border border-brand-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      <div className="flex items-center">
                        <div className="p-4 rounded-2xl bg-brand-purple/10 text-brand-purple mr-6">
                          <Brain size={32} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-brand-dark">{lang.name}</h2>
                          <p className="text-gray-500">{isLoading ? 'Loading quizzes...' : c.total > 0 ? `${c.total} quizzes available` : 'No quizzes available yet'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:w-auto w-full">
                        <DifficultyCard title="Beginner" icon={<Flame className="w-6 h-6" />} color="text-green-500 bg-green-50" count={c.beginner} loading={isLoading} onClick={() => openDifficulty(code, 'beginner')} />
                        <DifficultyCard title="Intermediate" icon={<School className="w-6 h-6" />} color="text-blue-500 bg-blue-50" count={c.intermediate} loading={isLoading} onClick={() => openDifficulty(code, 'intermediate')} />
                        <DifficultyCard title="Advanced" icon={<Award className="w-6 h-6" />} color="text-purple-500 bg-purple-50" count={c.advanced} loading={isLoading} onClick={() => openDifficulty(code, 'advanced')} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {activeLanguage && activeDifficulty && (
              <ProgressionModal
                language={activeLanguage}
                difficulty={activeDifficulty}
                loading={loadingProgression}
                error={errorProgression}
                progression={progression}
                onClose={closeProgression}
                onLaunch={launchQuiz}
              />
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-8 border border-brand-border text-center max-w-lg mx-auto mt-12"
          >
            <div className="p-6 rounded-full bg-gray-100 mx-auto w-24 h-24 flex items-center justify-center mb-4">
              <Brain className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">No preferred languages selected</h2>
            <p className="text-gray-600 mb-6">Visit Language Preferences to choose your preferred languages to view available quizzes.</p>
            <button onClick={() => navigate('/select-language')} className="inline-flex items-center px-6 py-3 bg-brand-purple text-white rounded-xl hover:bg-brand-purple/90 transition-colors">
              Set Language Preferences
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function DifficultyCard({ title, icon, color, count, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || count === 0}
      className={`relative flex flex-col items-center p-5 rounded-xl border transition-all transform hover:-translate-y-1 hover:shadow-md ${count > 0 ? 'border-brand-border hover:border-brand-purple' : 'border-gray-200 bg-gray-50'} ${loading ? 'animate-pulse' : ''}`}
    >
      <div className={`p-3 rounded-full mb-3 ${color}`}>{icon}</div>
      <h3 className="font-semibold text-brand-dark mb-1">{title}</h3>
      <p className={`text-sm ${count > 0 ? 'text-gray-600' : 'text-gray-400'}`}>{loading ? '...' : `${count} quizzes`}</p>
      {count > 0 && (
        <div className="mt-3 text-xs font-medium text-brand-purple flex items-center">
          Start <ArrowRight className="ml-1 w-3 h-3" />
        </div>
      )}
    </button>
  );
}

function ProgressionModal({ language, difficulty, loading, error, progression, onClose, onLaunch }) {
  const readable = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const bySequence = React.useMemo(() => {
    const map = new Map();
    progression.forEach(p => map.set(p.sequence, p));
    return map;
  }, [progression]);
  const isLocked = (item) => {
    if (item.attempted) return false;
    if (item.sequence === 1) return false;
    const prev = bySequence.get(item.sequence - 1);
    if (!prev) return false;
    if (!prev.attempted) return true;
    if (prev.required && (prev.score ?? 0) < prev.required) return true;
    return false;
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-brand-dark">{readable} Track - {language.toUpperCase()}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
        </div>
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading progression...</div>
        ) : error ? (
          <div className="py-10 text-center text-red-500 text-sm">{error}</div>
        ) : progression.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm">No quizzes available for this track yet.</div>
        ) : (
          <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {progression.map(item => {
              const locked = isLocked(item);
              const passed = item.attempted && (item.score ?? 0) >= (item.required ?? 0);
              const failed = item.attempted && !passed;
              const canPlay = !locked && (!item.attempted || failed);
              return (
                <li
                  key={item.quizId}
                  onClick={() => canPlay && onLaunch(item.quizId, { retry: failed })}
                  className={`border rounded-xl p-4 flex items-center justify-between ${locked ? 'opacity-60 bg-gray-50' : 'bg-white hover:border-brand-purple cursor-pointer'} transition`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono px-2 py-0.5 rounded bg-brand-purple/10 text-brand-purple">Lv {item.sequence}</span>
                      <h4 className="font-semibold text-brand-dark">{item.title || `Quiz ${item.sequence}`}</h4>
                      {passed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.attempted ? `Score: ${item.score}%` : canPlay ? (item.required ? `Need ${item.required}% to unlock next` : 'Ready') : 'Locked'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {locked && <Lock className="w-5 h-5 text-gray-400" />}
                    {canPlay && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onLaunch(item.quizId, { retry: failed }); }}
                        className="inline-flex items-center px-3 py-2 text-sm bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 focus:ring-2 focus:ring-brand-purple/40 focus:outline-none"
                      >
                        <Play className="w-4 h-4 mr-1" /> {failed ? 'Retry' : 'Play'}
                      </button>
                    )}
                    {passed && <span className="text-xs text-green-600 font-medium">Passed</span>}
                    {failed && <span className="text-xs text-red-600 font-medium">Failed</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
