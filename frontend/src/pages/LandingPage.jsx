import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap,
  Brain,
  Trophy,
  MessageCircle,
  PenTool,
  Mic,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description:
        "Personalized feedback on grammar, vocabulary, and pronunciation.",
    },
    {
      icon: Trophy,
      title: "Gamified Experience",
      description: "Earn XP, unlock achievements, and climb the leaderboards.",
    },
    {
      icon: MessageCircle,
      title: "Interactive Quizzes",
      description:
        "Adaptive quizzes that adjust to your skill level and learning pace.",
    },
    {
      icon: PenTool,
      title: "Writing Practice",
      description:
        "Guided exercises with instant AI feedback on your compositions.",
    },
    {
      icon: Mic,
      title: "Speaking Challenges",
      description:
        "Practice conversation with advanced speech recognition technology.",
    },
    {
      icon: Zap,
      title: "Automated Content",
      description: "Endless practice with our auto-generated learning content.",
    },
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
              <span className="font-bold text-xl text-brand-dark">
                FluentFun
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="px-3 py-2 rounded-lg border border-brand-border hover:bg-brand-gray transition"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
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
            FluentFun combines gamification and cutting-edge AI to create a
            language learning experience that's both effective and incredibly
            fun.
          </p>
          {!loading && user ? (
            <div className="flex gap-4 justify-center">
              <Link
                to="/dashboard"
                className="px-6 py-3 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 inline-flex items-center"
                style={{ backgroundColor: "#111", color: "#fff" }}
              >
                Start Learning Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link
                to="/signup"
                className="px-6 py-3 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 inline-flex items-center"
                style={{ backgroundColor: "#111", color: "#fff" }}
              >
                Start Learning Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          )}
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
              Our platform is built on principles that maximize engagement and
              retention.
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
        whileHover={{
          scale: 1.05,
          y: -12,
          rotateY: 5,
          rotateX: 2,
        }}
        whileTap={{ scale: 0.98 }}
        className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-lg hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer transition-all duration-500 ease-out overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Animated background gradient on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/5 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          initial={false}
        />
        
        {/* Subtle border glow effect */}
        <motion.div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(147,51,234,0.3), rgba(236,72,153,0.3))',
            padding: '1px',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'xor',
          }}
        />

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/30 rounded-full opacity-0 group-hover:opacity-100"
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + i * 10}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
        
        <motion.div
          whileHover={{ 
            rotate: 15, 
            scale: 1.2,
            filter: "drop-shadow(0 8px 16px rgba(59,130,246,0.3))"
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 20,
            duration: 0.6
          }}
          className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-500"
        >
          <Icon className="w-8 h-8 text-white filter drop-shadow-sm" />
          
          {/* Icon glow effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        </motion.div>
        
        <motion.h3 
          className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-700 transition-colors duration-300"
          whileHover={{ x: 4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {feature.title}
        </motion.h3>
        
        <motion.p 
          className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300"
          whileHover={{ x: 2 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
        >
          {feature.description}
        </motion.p>

        {/* Bottom shine effect */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          animate={{
            scaleX: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        />

        {/* Corner accent */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-200" />
      </motion.div>
    );
  })}
</div>
        </div>
      </section>
      <section className="py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-dark tracking-tighter mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of learners who are already mastering languages with
            FluentFun's innovative approach to education.
          </p>

          {!loading && user ? (
            <Link
              to="/dashboard"
              className="bg-brand-dark text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all transform hover:scale-105 inline-flex items-center"
            >
              Start Your Journey Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          ) : (
            <Link
              to="/signup"
              className="bg-brand-dark text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all transform hover:scale-105 inline-flex items-center"
            >
              Start Your Journey Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          )}
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
