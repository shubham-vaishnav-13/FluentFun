import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Brain, Zap, Clock } from 'lucide-react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../config/api.config.js';
import { API_PATHS } from '../config/apiPaths.js';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

function QuizPage() {
  const { user, updateUserXP } = useAuth();
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const search = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const retryFlag = React.useMemo(() => search.get('retry'), [search]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizCompleted, setQuizCompleted] = useState(false); // true when user just completed OR had prior attempt
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState([]); // store selected answers for backend submission
  const [attemptReview, setAttemptReview] = useState(null); // store attempt + questions with correctness for review

  // Derived questions array from loaded quiz
  const questions = React.useMemo(() => {
    if (!quiz) return [];
    return (quiz.questions || []).map(q => ({
      question: q.question,
      options: q.options,
      xp: q.points || 10
    }));
  }, [quiz]);

  // Fetch quiz on mount by id
  React.useEffect(() => {
    let ignore = false;
    const fetchQuiz = async () => {
      if (!quizId) {
        setError('Missing quiz id');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(API_PATHS.CONTENT.GET_QUIZ(quizId) + (retryFlag ? '?fresh=1' : ''));
        if (!ignore) {
          if (res.data?.success && res.data?.data) {
            const q = res.data.data;
            // Loaded quiz data
            
            // If user already attempted, immediately enter review mode
            if (q.attempted && q.attempt) {
              setQuizCompleted(true);
              setScore(q.attempt.score || 0);
              setAttemptReview({
                attempt: q.attempt,
                questions: q.questions || []
              });
            } else {
              setQuizCompleted(false);
            }
            
            // Reset active quiz state for taking
            setCurrentQuestion(0);
            setSelectedAnswer(null);
            setShowResult(false);
            setAnswers([]);
            setQuiz(q);
            
            // Safely set timeLeft - validate timeLimit
            const timeLimit = q.timeLimit && typeof q.timeLimit === 'number' 
              ? Math.max(q.timeLimit * 60, 300)
              : 1800; // 30 min default
            setTimeLeft(timeLimit);
          } else {
            setError(res.data?.message || 'Failed to load quiz');
          }
        }
      } catch (e) {
        if (!ignore) {
          toast.error('Failed to load quiz');
          setError(e.response?.data?.message || e.message || 'Error fetching quiz');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchQuiz();
    return () => { ignore = true; };
  }, [quizId]);

  // Countdown timer
  React.useEffect(() => {
    if (timeLeft > 0 && !showResult && !quizCompleted && questions.length) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult && questions.length) {
      handleAnswerSubmit();
    }
  }, [timeLeft, showResult, quizCompleted, questions.length]);

  const handleAnswerSelect = (answerIndex) => {
    if (!showResult) setSelectedAnswer(answerIndex);
  };

  const handleAnswerSubmit = () => {
    if (!questions.length) return;
    const selected = selectedAnswer;
    setShowResult(true);
    // Update answers immediately
    setAnswers(prev => {
      const next = [...prev];
      next[currentQuestion] = selected;
      return next;
    });
    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(q => q + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(prev => prev); // keep remaining time; alternatively reset per question
      } else {
        // Build a finalized answers array to avoid state timing issues
        submitAttempt();
      }
    }, 800);
  };

  const submitAttempt = async () => {
    if (!quizId || !questions.length) return;
    try {
      setSubmitting(true);
      // Construct full answers array now (in case state not fully flushed)
      const finalAnswers = (() => {
        const arr = [...answers];
        for (let i = 0; i < questions.length; i++) {
          if (arr[i] == null) arr[i] = -1; // mark unanswered
        }
        return arr;
      })();
      const res = await api.post(API_PATHS.CONTENT.ATTEMPT_QUIZ(quizId), {
        answers: finalAnswers,
        timeTaken: (quiz?.timeLimit ? quiz.timeLimit * 60 : 30) - timeLeft
      });
      if (res.data?.success) {
        const attemptScore = res.data.data.attempt?.score ?? res.data.data.score;
        setScore(attemptScore); // store percentage
        if (res.data.data.user?.xp != null) {
          updateUserXP({ xp: res.data.data.user.xp });
        }
        // Build review data from response (questions include correctAnswer & selection)
        setAttemptReview({
          attempt: res.data.data.attempt,
          questions: res.data.data.questions
        });
        toast.success(`Quiz submitted! Score ${attemptScore}%`);
      } else {
        toast.error(res.data?.message || 'Failed to submit attempt');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error submitting attempt');
    } finally {
      setQuizCompleted(true);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app text-app">
        <Navbar borderClass="border-brand-border" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-purple mx-auto"></div>
          <p className="mt-6 text-gray-500">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app text-app">
        <Navbar borderClass="border-brand-border" />
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-2xl font-semibold text-brand-dark mb-4">Unable to load quiz</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/dashboard" className="inline-block bg-brand-dark text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-app text-app">
        <Navbar borderClass="border-brand-border" />
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-2xl font-semibold text-brand-dark mb-4">No questions available</h2>
          <p className="text-gray-500 mb-6">This quiz currently has no questions to display.</p>
          <Link to="/dashboard" className="inline-block bg-brand-dark text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (quizCompleted && attemptReview) {
    // Review screen (either after submit or revisiting attempted quiz)
    return (
      <div className="min-h-screen bg-app text-app">
        <Navbar borderClass="border-brand-border" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass neon-card bg-white/5 rounded-2xl p-8 border border-brand-border"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-brand-dark mb-2">Quiz Review</h2>
                <p className="text-gray-500">You scored <span className="font-semibold text-brand-dark">{score}%</span>. Below is your answer breakdown.</p>
              </div>
              <div className="flex gap-2">
                {quiz && (score < (quiz.minScoreToUnlockNext ?? 0)) && (
                  <button
                    onClick={async () => {
                      // Reset to allow retry: fetch fresh quiz (without attempt answers)
                      try {
                        const res = await api.get(API_PATHS.CONTENT.GET_QUIZ(quizId) + '?fresh=1');
                        if (res.data?.success) {
                          const q = res.data.data;
                          // Force taking mode regardless of previous attempt
                          setQuiz(q);
                          setQuizCompleted(false);
                          setAttemptReview(null);
                          setCurrentQuestion(0);
                          setSelectedAnswer(null);
                          setShowResult(false);
                          setAnswers([]);
                          const tl = q.timeLimit ? q.timeLimit * 60 : 30;
                          setTimeLeft(Math.min(tl, 3600));
                          toast('Retry started. Good luck!', { icon: '🔁' });
                        }
                      } catch (e) {
                        toast.error(e.response?.data?.message || 'Unable to start retry');
                      }
                    }}
                    className="bg-brand-purple text-white px-4 py-2 rounded-xl font-semibold hover:bg-brand-purple/90 transition-all"
                  >
                    Retry Quiz
                  </button>
                )}
                <button
                  onClick={() => navigate('/quiz-list')}
                  className="bg-brand-dark text-white px-4 py-2 rounded-xl font-semibold hover:bg-gray-800 transition-all"
                >
                  Back to Quizzes
                </button>
                <Link
                  to="/dashboard"
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Dashboard
                </Link>
              </div>
            </div>
            <div className="grid gap-6">
              {attemptReview.questions.map((q, idx) => {
                const correct = q.isCorrect;
                const selected = q.selected;
                return (
                  <div key={idx} className={`rounded-xl border-2 p-5 ${correct ? 'border-green-400 bg-green-50/40' : 'border-red-300 bg-red-50/40'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-brand-dark text-lg">Q{idx + 1}. {q.question}</h3>
                      <div className={`text-xs font-semibold px-2 py-1 rounded ${correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{correct ? 'Correct' : 'Incorrect'}</div>
                    </div>
                    <ul className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        const isCorrectAnswer = oIdx === q.correctAnswer;
                        const isSelected = oIdx === selected;
                        let cls = 'px-3 py-2 rounded-lg border text-sm flex items-center gap-2 ';
                        if (isCorrectAnswer) cls += 'border-green-500 bg-green-50';
                        else cls += 'border-brand-border bg-white/40';
                        if (isSelected && !isCorrectAnswer) cls += ' ring-2 ring-red-300';
                        if (isSelected && isCorrectAnswer) cls += ' ring-2 ring-green-300';
                        return (
                          <li key={oIdx} className={cls}>
                            <span className="font-mono text-xs w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-600">{String.fromCharCode(65 + oIdx)}</span>
                            <span className="flex-1">{opt}</span>
                            {isCorrectAnswer && <span className="text-green-600 font-medium text-xs">Correct</span>}
                            {isSelected && !isCorrectAnswer && <span className="text-red-600 font-medium text-xs">Your choice</span>}
                            {isSelected && isCorrectAnswer && <span className="text-green-600 font-medium text-xs">Your choice</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
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
          <Link to="/quiz-list" className="flex items-center space-x-2 text-gray-500 hover:text-brand-dark">
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
        {/* Quiz metadata header */}
        {quiz && (
          <div className="mb-6 text-sm text-gray-600 flex flex-wrap gap-4">
            <div><span className="font-semibold text-brand-dark">Title:</span> {quiz.title}</div>
            {quiz.language && <div><span className="font-semibold text-brand-dark">Language:</span> {quiz.language.toUpperCase()}</div>}
            {quiz.difficulty && <div><span className="font-semibold text-brand-dark">Difficulty:</span> {quiz.difficulty}</div>}
            {quiz.sequence && <div><span className="font-semibold text-brand-dark">Sequence:</span> {quiz.sequence}</div>}
            <div><span className="font-semibold text-brand-dark">Quiz ID:</span> <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{quiz._id}</code></div>
          </div>
        )}
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
                if (index === selectedAnswer) optionClass += "border-brand-purple bg-purple-50 text-brand-purple"; // highlight selection briefly
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
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleAnswerSubmit}
              disabled={selectedAnswer === null || showResult || submitting}
              className="flex-1 bg-brand-dark text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              {currentQuestion + 1 === questions.length ? 'Submit Quiz' : 'Next'}
            </button>
            {process.env.NODE_ENV !== 'production' && (
              <div className="text-xs text-gray-400 self-center">Answered {answers.filter(a => a != null).length}/{questions.length}</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default QuizPage;
