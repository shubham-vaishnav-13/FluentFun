import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X, Brain, Zap, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

function QuizPage() {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const questions = [
    { question: "What is the French word for 'hello'?", options: ["Bonjour", "Au revoir", "Merci", "S'il vous plaît"], correct: 0, xp: 25 },
    { question: "Which Spanish word means 'thank you'?", options: ["Hola", "Gracias", "Adiós", "Por favor"], correct: 1, xp: 25 },
    { question: "What does 'Guten Tag' mean in English?", options: ["Good night", "Good morning", "Good day", "Goodbye"], correct: 2, xp: 25 },
    { question: "Choose the correct Italian phrase for 'How are you?'", options: ["Come stai?", "Dove sei?", "Cosa fai?", "Chi sei?"], correct: 0, xp: 25 },
    { question: "What is the past tense of 'to go' in English?", options: ["Goes", "Going", "Went", "Gone"], correct: 2, xp: 25 }
  ];

  React.useEffect(() => {
    if (timeLeft > 0 && !showResult && !quizCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleAnswerSubmit();
    }
  }, [timeLeft, showResult, quizCompleted]);

  const handleAnswerSelect = (answerIndex) => {
    if (!showResult) setSelectedAnswer(answerIndex);
  };

  const handleAnswerSubmit = () => {
    const isCorrect = selectedAnswer === questions[currentQuestion].correct;
    if (isCorrect) setScore(score + 1);
    setShowResult(true);
    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(30);
      } else {
        setQuizCompleted(true);
        const finalScore = isCorrect ? score + 1 : score;
        const xpEarned = finalScore * questions[0].xp;
        toast.success(`Quiz completed! You earned ${xpEarned} XP!`);
      }
    }, 2000);
  };

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-app text-app">
        <Navbar borderClass="border-brand-border" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass neon-card bg-white/5 rounded-2xl p-8 border border-brand-border text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-brand-dark mb-2">Quiz Completed!</h2>
            <p className="text-lg text-gray-500 mb-6">You scored {score} out of {questions.length} correct.</p>
            <div className="flex items-center justify-center space-x-6 mb-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">+{score * questions[0].xp}</p>
                <p className="text-sm text-gray-500">XP Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-purple">{((score / questions.length) * 100).toFixed(0)}%</p>
                <p className="text-sm text-gray-500">Accuracy</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-brand-dark text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all"
              >
                Take Another Quiz
              </button>
              <Link
                to="/dashboard"
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Back to Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const current = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-app text-app">
      <Navbar borderClass="border-brand-border" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-4 text-sm">
          <Link to="/dashboard" className="flex items-center space-x-2 text-gray-500 hover:text-brand-dark">
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Quiz</span>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-orange-600">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">{timeLeft}s</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-500">
              <Brain className="w-4 h-4" />
              <span className="font-semibold">{currentQuestion + 1}/{questions.length}</span>
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <motion.div
            className="bg-brand-purple h-2 rounded-full"
            animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass neon-card bg-white/5 rounded-2xl p-8 border border-brand-border"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-brand-dark">{current.question}</h2>
            <div className="flex items-center space-x-1 text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
              <Zap className="w-4 h-4" />
              <span>+{current.xp} XP</span>
            </div>
          </div>
          <div className="space-y-3">
            {current.options.map((option, index) => {
              let optionClass = "w-full p-4 text-left rounded-xl border-2 transition-all font-medium ";
              if (showResult) {
                if (index === current.correct) optionClass += "border-green-500 bg-green-50 text-green-700";
                else if (index === selectedAnswer) optionClass += "border-red-500 bg-red-50 text-red-700";
                else optionClass += "border-brand-border bg-gray-50 text-gray-500";
              } else if (selectedAnswer === index) {
                optionClass += "border-brand-purple bg-purple-50 text-brand-purple";
              } else {
                optionClass += "border-brand-border hover:border-brand-purple text-brand-dark";
              }
              return (
                <button key={index} onClick={() => handleAnswerSelect(index)} disabled={showResult} className={optionClass}>
                  {option}
                </button>
              );
            })}
          </div>
          <div className="mt-8">
            <button
              onClick={handleAnswerSubmit}
              disabled={selectedAnswer === null || showResult}
              className="w-full bg-brand-dark text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              {showResult ? (selectedAnswer === current.correct ? 'Correct!' : 'Incorrect') : 'Submit Answer'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default QuizPage;
