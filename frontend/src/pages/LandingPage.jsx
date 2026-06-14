import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// import icons from assets folder
import brainIcon from "../assets/ai.png";
import trophyIcon from "../assets/creative-writing.png";
import messageCircleIcon from "../assets/joystick.png";
import penToolIcon from "../assets/onboarding.png";
import micIcon from "../assets/quiz.png";
import zapAssetIcon from "../assets/talking.png";

function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (!loading) {
      if (user) navigate("/dashboard");
      else navigate("/signup");
    }
  };

  const features = [
    {
      icon: brainIcon,
      title: "AI-Powered Learning",
      description:
        "Personalized feedback on grammar, vocabulary, and pronunciation.",
    },
    {
      icon: trophyIcon,
      title: "Gamified Experience",
      description: "Earn XP, unlock achievements, and climb the leaderboards.",
    },
    {
      icon: messageCircleIcon,
      title: "Interactive Quizzes",
      description:
        "Adaptive quizzes that adjust to your skill level and learning pace.",
    },
    {
      icon: penToolIcon,
      title: "Writing Practice",
      description:
        "Guided exercises with instant AI feedback on your compositions.",
    },
    {
      icon: micIcon,
      title: "Speaking Challenges",
      description:
        "Practice conversation with advanced speech recognition technology.",
    },
    {
      icon: zapAssetIcon,
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
              
              <span className="font-bold text-xl text-brand-dark">
                FluentFun
              </span>
            </div>
            <div className="flex items-center space-x-2">
              
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

      {/* Simplified Hero */}
      <section className="max-w-7xl min-h-[calc(70vh-4rem)] mt-20 mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-24">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-20">
          {/* Left: Heading */}
          <div className="w-full md:w-1/2">
            {/* Badge */}
            <div className="flex items-center mb-4">
             
            </div>

            <h1 className="text-3xl md:text-5xl text-brand-dark font-semibold leading-tight tracking-tight">
              <span className="block mb-3">Master Languages with</span>
              <span className="inline-block text-transparent bg-clip-text bg-[radial-gradient(circle,#FF9324_0%,#FCD760_100%)] bg-size-[200%_200%] animate-text-shine font-bold whitespace-nowrap">
                AI‑Powered
              </span>{" "}
              <span className="font-semibold">FluentFun</span>
            </h1>
          </div>

          {/* Right: Copy + CTA */}
          <div className="w-full md:w-1/2">
            <p className="text-base md:text-lg text-gray-700 max-w-xl mb-6">
              Adaptive quizzes, instant feedback, speaking challenges, and smart practice—all in one place. Your personalized language growth companion.
            </p>
            <button
              onClick={handleCTA}
              className="bg-black text-white text-sm font-semibold px-7 py-3 rounded-full hover:bg-amber-100 hover:text-black border border-transparent hover:border-amber-300 transition-colors inline-flex items-center"
            >
              {user ? "Go to Dashboard" : "Get Started"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
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
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-3xl border border-gray-200 shadow"
                >
                  <div className="w-16 h-16  rounded-2xl flex items-center justify-center mb-6">
                    <img
                      src={feature.icon}
                      alt={`${feature.title} icon`}
                      className="w-8 h-8 object-contain"
                    />
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
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
