import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { BookText, MessageSquare, Mic, PenSquare } from 'lucide-react';

function PersonalizedLearningPathPage() {
  const skills = [
    { name: 'Grammar', icon: BookText, progress: 75, color: 'text-brand-blue' },
    { name: 'Vocabulary', icon: PenSquare, progress: 60, color: 'text-green-500' },
    { name: 'Pronunciation', icon: Mic, progress: 45, color: 'text-brand-purple' },
    { name: 'Conversation', icon: MessageSquare, progress: 30, color: 'text-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-app text-app">
      <Navbar borderClass="border-brand-border" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-brand-dark">Your Learning Path</h1>
          <p className="text-gray-500 mt-2">Track your progress across different language skills.</p>
        </motion.div>

        <div className="space-y-6">
          {skills.map((skill, index) => {
            const Icon = skill.icon;
            return (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass neon-card bg-white/5 p-6 rounded-2xl border border-brand-border"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl bg-gray-100 ${skill.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-brand-dark">{skill.name}</h2>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          className="bg-current h-2.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.progress}%` }}
                          transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">{skill.progress}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PersonalizedLearningPathPage;
