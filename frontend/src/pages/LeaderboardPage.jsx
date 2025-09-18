import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Trophy, Zap, Star, RefreshCcw, AlertCircle } from 'lucide-react';
import { computeLevel } from '../utils/level';
import { fetchLeaderboard } from '../services/leaderboardAPI';

function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toPlayerShape = (doc) => ({
    id: doc._id || doc.id,
    name: doc.fullName || doc.username || 'Unknown',
    avatar: doc.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc._id || doc.id}`,
    xp: doc.xp ?? 0,
    level: computeLevel(doc.xp ?? 0),
    rank: doc.rank
  });

  const currentUserEntry = useMemo(() => {
    if (!user) return null;
    const id = user.id || user._id || 'me';
    const name = user.fullName || user.username || user.name || 'You';
    const avatar = user.profileImage || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`;
    const xp = user.xp ?? 0;
    const level = computeLevel(xp);
    return { id, name, avatar, xp, level };
  }, [user]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const { leaderboard } = await fetchLeaderboard({ limit: 50 });
        if (ignore) return;
        const players = (leaderboard || []).map(toPlayerShape);
        setLeaderboardData(players);
      } catch (e) {
        if (!ignore) setError(e.message || 'Failed to load leaderboard');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [currentUserEntry]);

  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-yellow-400 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-orange-400 text-white';
    return 'bg-gray-200 text-gray-700';
  };

  const isCurrentUser = (player) => (user ? (player.id === (user.id || user._id || 'me')) : false);

  return (
    <div className="min-h-screen bg-app text-app">
      <Navbar borderClass="border-brand-border" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
          <h1 className="text-4xl font-bold text-brand-dark">Leaderboard</h1>
          <p className="text-gray-500 mt-2">See where you stand among the top learners.</p>
        </motion.div>

        <div className="space-y-3">
          {loading && (
            <div className="p-6 text-center rounded-xl border border-brand-border glass animate-pulse">
              <p className="text-sm text-gray-500">Loading leaderboard...</p>
            </div>
          )}
          {error && !loading && (
            <div className="p-4 flex items-center space-x-3 rounded-xl border border-red-300 bg-red-50 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <div className="flex-1 text-left">
                <p className="font-semibold">Could not load leaderboard</p>
                <p className="text-xs opacity-80">{error}</p>
              </div>
              <button onClick={() => { setError(null); setLoading(true); setTimeout(()=>{
                // Re-trigger effect by updating dependency (simple manual call)
                fetchLeaderboard({ limit: 50 }).then(({ leaderboard }) => {
                  const players = (leaderboard || []).map(toPlayerShape);
                  setLeaderboardData(players); setLoading(false);
                }).catch(err => { setError(err.message); setLoading(false); });
              }, 50); }} className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-brand-purple text-white hover:opacity-90">
                <RefreshCcw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}
          {!loading && !error && leaderboardData.length === 0 && (
            <div className="p-6 text-center rounded-xl border border-brand-border glass">
              <p className="text-sm text-gray-500">No leaderboard data yet. Start completing quizzes to earn XP!</p>
            </div>
          )}
          {leaderboardData.map((player, index) => {
            const rank = player.rank || index + 1;
            const current = isCurrentUser(player);

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`group flex items-center p-4 rounded-2xl border transition-all glass neon-card hover:shadow-md hover:-translate-y-[1px] ${
                  current ? 'border-2 border-yellow-400 ring-2 ring-yellow-300/50 bg-yellow-400/10 text-brand-dark ring-offset-4 ring-offset-yellow-300/50' : 'border-brand-border bg-white/5 text-app'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-9 h-9 text-sm rounded-full flex items-center justify-center font-bold ${getRankColor(rank)}`}>
                    {rank}
                  </div>
                  <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-brand-purple/20" />
                  <div>
                    <p className="font-semibold text-inherit">{player.name} {current && '(You)'}</p>
                    <div className={`flex items-center space-x-2 text-xs ${current ? 'text-gray-600' : 'text-gray-500'}`}>
                      <Star className="w-3 h-3 text-brand-purple" />
                      <span>Level {player.level}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 font-bold text-lg text-inherit">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>{player.xp?.toLocaleString?.() || 0}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;
