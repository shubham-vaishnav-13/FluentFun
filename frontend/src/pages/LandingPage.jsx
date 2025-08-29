import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Brain, 
  Trophy, 
  MessageCircle, 
  PenTool,
  Mic,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
    
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Personalized feedback on grammar, vocabulary, and pronunciation.'
    },
    {
      icon: Trophy,
      title: 'Gamified Experience',
      description: 'Earn XP, unlock achievements, and climb the leaderboards.'
    },
    {
      icon: MessageCircle,
      title: 'Interactive Quizzes',
      description: 'Adaptive quizzes that adjust to your skill level and learning pace.'
    },
    {
      icon: PenTool,
      title: 'Writing Practice',
      description: 'Guided exercises with instant AI feedback on your compositions.'
    },
    {
      icon: Mic,
      title: 'Speaking Challenges',
      description: 'Practice conversation with advanced speech recognition technology.'
    },
    {
      icon: Zap,
      title: 'Automated Content',
      description: 'Endless practice with our auto-generated learning content.'
    }
  ];

  return (
    <div className="bg-app text-app">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-brand-dark">FluentFun</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="px-3 py-2 rounded-lg border border-brand-border hover:bg-brand-gray transition"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              {/* Auth-aware nav actions */}
              {!loading && user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-600 hover:text-brand-dark font-medium transition-colors px-4 py-2 rounded-lg"
                  >
                    Home
                  </Link>
                  <Link
                    to="/profile"
                    className="bg-brand-dark text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all"
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-600 hover:text-brand-dark font-medium transition-colors px-4 py-2 rounded-lg"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/signup" 
                    className="bg-brand-dark text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold text-brand-dark tracking-tighter mb-6">
            The New Way to
            <br />
            <span className="brand-gradient-text">Master Languages</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            FluentFun combines gamification and cutting-edge AI to create a language learning experience that's both effective and incredibly fun.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/signup"
              className="neon-btn px-6 py-3 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 inline-flex items-center"
            >
              Start Learning Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="bg-brand-gray py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-brand-dark tracking-tighter">
              A Smarter Way to Learn
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">
              Our platform is built on principles that maximize engagement and retention.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-8 rounded-2xl border border-brand-border neon-card"
                >
                  <div className="w-12 h-12 bg-brand-gray rounded-xl flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-brand-dark" />
                  </div>
                  <h3 className="text-xl font-semibold text-brand-dark mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark tracking-tighter mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of learners who are already mastering languages with FluentFun's innovative approach to education.
          </p>
          <Link
            to="/signup"
            className="bg-brand-dark text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all transform hover:scale-105 inline-flex items-center"
          >
            Start Your Journey Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-gray border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">FluentFun</span>
            </div>
            <p className="text-sm text-gray-500">
              &copy; 2025 FluentFun. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

            


    </div>
  );
}

export default LandingPage;
