import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Zap, Flame, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function DailyChallengePage() {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Simulate fetching a daily challenge
    const challengeTypes = ['quiz', 'writing', 'speaking'];
    const today = new Date().toDateString();
    const lastChallengeDate = localStorage.getItem('fluentfun_last_challenge');
    
    if (lastChallengeDate === today) {
      setCompleted(true);
    } else {
      const type = challengeTypes[new Date().getDate() % 3]; // Simple deterministic "random"
      setChallenge({ type, xp: 100 });
    }
  }, []);

  const handleComplete = () => {
    const today = new Date().toDateString();
    localStorage.setItem('fluentfun_last_challenge', today);
    setCompleted(true);
    toast.success('Daily Challenge Complete! Your streak is safe.');
  };

  return (
    <div className="min-h-screen bg-app text-app">
      <Navbar borderClass="border-brand-border" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-brand-dark">Daily Challenge</h1>
          <p className="text-gray-500 mt-2">Complete your daily task to maintain your streak!</p>
        </motion.div>

        {completed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass neon-card bg-white/5 rounded-2xl p-8 border border-brand-border text-center"
          >
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-brand-dark">Challenge Complete!</h2>
            <p className="text-gray-500 mt-2">Great job! Come back tomorrow for a new challenge.</p>
          </motion.div>
        ) : (
          <div className="glass neon-card bg-white/5 rounded-2xl border border-brand-border p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-brand-dark capitalize">{challenge?.type} Challenge</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5 text-green-600 font-medium">
                  <Zap className="w-4 h-4" />
                  <span>+{challenge?.xp} XP</span>
                </div>
                <div className="flex items-center space-x-1.5 text-orange-600 font-medium">
                  <Flame className="w-4 h-4" />
                  <span>+1 Streak</span>
                </div>
              </div>
            </div>
            <div className="border-t border-brand-border pt-6">
              <p className="text-center text-gray-500 mb-4">
                The {challenge?.type} challenge would appear here. Click below to simulate completion.
              </p>
              <button 
                onClick={handleComplete} 
                className="w-full bg-brand-dark text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all"
              >
                Simulate Completion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyChallengePage;
