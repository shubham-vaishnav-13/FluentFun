import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Trophy, Zap, Star } from 'lucide-react';

function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);

  // Lightweight name generator to avoid adding faker dependency
  const randomName = () => {
    const first = [
      'Alex','Sam','Jamie','Taylor','Jordan','Casey','Riley','Cameron','Morgan','Avery',
      'Quinn','Drew','Hayden','Logan','Rowan','Parker','Reese','Blake','Elliot','Harper'
    ];
    const last = [
      'Johnson','Smith','Brown','Williams','Davis','Miller','Wilson','Moore','Taylor','Anderson',
      'Thomas','Jackson','White','Harris','Martin','Thompson','Garcia','Martinez','Robinson','Clark'
    ];
    return `${first[Math.floor(Math.random()*first.length)]} ${last[Math.floor(Math.random()*last.length)]}`;
  };

  const makeMockPlayer = () => {
    const seed = Math.random().toString(36).slice(2);
    return {
      id: seed,
      name: randomName(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
      xp: Math.floor(500 + Math.random() * 9500),
      level: Math.floor(1 + Math.random() * 40)
    };
  };

  const currentUserEntry = useMemo(() => {
    if (!user) return null;
    const id = user.id || user._id || 'me';
    const name = user.fullName || user.username || user.name || 'You';
    const avatar = user.profileImage || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`;
    const xp = user.xp ?? Math.floor(1000 + Math.random() * 4000);
    const level = user.level ?? Math.max(1, Math.floor(xp / 250));
    return { id, name, avatar, xp, level };
  }, [user]);

  useEffect(() => {
    let data = Array.from({ length: 20 }, () => makeMockPlayer());
    if (currentUserEntry) {
      // If current user exists in mock list, update it; otherwise append
      const idx = data.findIndex(p => p.id === currentUserEntry.id);
      if (idx >= 0) {
        data[idx] = { ...data[idx], ...currentUserEntry };
      } else {
        data.push(currentUserEntry);
      }
    }
    data.sort((a, b) => b.xp - a.xp);
    setLeaderboardData(data);
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
          {leaderboardData.map((player, index) => {
            const rank = index + 1;
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
                  <span>{player.xp.toLocaleString()}</span>
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
