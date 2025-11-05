import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, FileText, Award, History, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { writingAPI } from '../services/writingAPI';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

export default function WritingChallenge() {
    const { challengeId } = useParams();
    const navigate = useNavigate();
    const { updateUserXP, user } = useAuth();
    const [challenge, setChallenge] = useState(null);
    const [text, setText] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [previousSubmissions, setPreviousSubmissions] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // Load challenge details
    useEffect(() => {
        const load = async () => {
            try {
                const data = await writingAPI.getChallenge(challengeId);
                setChallenge(data);
                setTimeLeft(data.timeLimit * 60); // convert to seconds
            } catch (e) {
                toast.error('Failed to load challenge');
                toast.error('Failed to load challenge');
                navigate('/challenges');
            }
        };
        load();
    }, [challengeId, navigate]);

    // Load previous submissions
    useEffect(() => {
        const loadSubmissions = async () => {
            try {
                const subs = await writingAPI.listMySubmissions(challengeId);
                setPreviousSubmissions(subs);
            } catch (e) {
                toast.error('Failed to load submissions');
            }
        };
        loadSubmissions();
    }, [challengeId]);

    // Timer countdown
    useEffect(() => {
        // Stop the clock once a submission result is available (freeze remaining time)
        if (result) return;
        if (timeLeft === null || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, result]);

    // Word counter
    const countWords = useCallback((text) => {
        return text.trim().split(/\s+/).filter(Boolean).length;
    }, []);

    useEffect(() => {
        setWordCount(countWords(text));
    }, [text, countWords]);

    // Format time display
    const formatTime = (seconds) => {
        if (seconds === null) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        if (submitting) return;
        
        // Validations
        if (!text.trim()) {
            toast.error('Please write something before submitting');
            return;
        }

        if (wordCount < challenge.wordLimit.min) {
            toast.error(`Minimum ${challenge.wordLimit.min} words required`);
            return;
        }

        if (wordCount > challenge.wordLimit.max) {
            toast.error(`Maximum ${challenge.wordLimit.max} words allowed`);
            return;
        }

        setSubmitting(true);
        try {
            const result = await writingAPI.submitChallenge(challengeId, text);
            setResult(result);
            setPreviousSubmissions(prev => [result, ...prev]);
            if (typeof result?.xpAwarded === 'number' && result.xpAwarded > 0) {
                // Provide absolute new XP so context updates directly
                if (user && typeof user.xp === 'number') {
                    updateUserXP({ xp: user.xp + result.xpAwarded });
                } else {
                    updateUserXP(result.xpAwarded); // fallback
                }
                toast.success(`Submission evaluated! +${result.xpAwarded} XP`);
            } else {
                toast.success('Submission evaluated successfully!');
            }
        } catch (e) {
            toast.error('Submission failed');
            toast.error(e.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const loadLeaderboard = async () => {
        try {
            const data = await writingAPI.getLeaderboard(challengeId);
            setLeaderboard(data);
            setShowLeaderboard(true);
        } catch (e) {
            toast.error('Failed to load leaderboard');
            toast.error('Failed to load leaderboard');
        }
    };

    if (!challenge) return <div className="p-8 text-center">Loading...</div>;

    return (
        <>
        <Navbar />
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-app">{challenge.title}</h1>
                <p className="text-lg muted-text">{challenge.description}</p>
                
                {/* Challenge Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Time Remaining: {formatTime(timeLeft)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Words: {wordCount} / {challenge.wordLimit.min}-{challenge.wordLimit.max}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Writing Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface glass neon-card rounded-2xl border border-app p-6">
                        <h2 className="text-xl font-semibold text-app mb-4">Writing Prompt</h2>
                        <p className="mb-6">{challenge.prompt}</p>
                        
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={timeLeft === 0 || submitting}
                            placeholder="Start writing your response here..."
                            className="w-full h-64 px-4 py-3 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent resize-none"
                        />

                        {wordCount > 0 && (wordCount < challenge.wordLimit.min || wordCount > challenge.wordLimit.max) && (
                            <div className="flex items-center space-x-2 mt-2 text-yellow-500">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm">
                                    {wordCount < challenge.wordLimit.min 
                                        ? `${challenge.wordLimit.min - wordCount} more words needed`
                                        : `${wordCount - challenge.wordLimit.max} words over limit`}
                                </span>
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                onClick={handleSubmit}
                                disabled={timeLeft === 0 || submitting || !text.trim()}
                                className="neon-btn px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
                            >
                                {submitting ? 'Evaluating...' : 'Submit Response'}
                            </button>
                        </div>
                    </div>

                    {/* Evaluation Results */}
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-surface glass neon-card rounded-2xl border border-app p-6"
                        >
                            <h2 className="text-xl font-semibold text-app mb-4">Evaluation Results {result?.xpAwarded ? <span className="text-sm font-normal text-green-400 ml-2">+{result.xpAwarded} XP</span> : null}</h2>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg">Total Score:</span>
                                    <span className="text-2xl font-bold text-app">{result.totalScore.toFixed(1)}/100</span>
                                </div>

                                <div className="space-y-4">
                                    {result.scores.map((score) => (
                                        <div key={score.key} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="capitalize">{score.label || score.key}</span>
                                                <span className="font-medium">{score.rawScore.toFixed(1)}/100</span>
                                            </div>
                                            {score.comment && (
                                                <p className="text-sm muted-text">{score.comment}</p>
                                            )}
                                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-brand-purple"
                                                    style={{ width: `${score.rawScore}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {result.feedback && (
                                    <div className="space-y-2">
                                        <h3 className="font-medium text-app">Overall Feedback:</h3>
                                        <p className="text-sm muted-text whitespace-pre-line">{result.feedback}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Previous Attempts */}
                    {previousSubmissions.length > 0 && (
                        <div className="bg-surface glass neon-card rounded-2xl border border-app p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-app flex items-center space-x-2">
                                    <History className="w-5 h-5" />
                                    <span>Your Attempts</span>
                                </h2>
                            </div>
                            <div className="space-y-4">
                                {previousSubmissions.map((sub, idx) => (
                                    <div
                                        key={sub._id || idx}
                                        className="flex items-center justify-between p-3 rounded-lg border border-app/50"
                                    >
                                        <div>
                                            <div className="font-medium">Attempt {sub.attemptNumber}</div>
                                            <div className="text-sm muted-text">
                                                {new Date(sub.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-app">{sub.totalScore.toFixed(1)}</div>
                                            {typeof sub.xpAwarded === 'number' && sub.xpAwarded > 0 && (
                                                <div className="text-xs text-green-400 font-medium">+{sub.xpAwarded} XP</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Leaderboard Toggle */}
                    {!showLeaderboard ? (
                        <button
                            onClick={loadLeaderboard}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border border-app hover:bg-white/5 transition"
                        >
                            <Award className="w-5 h-5" />
                            <span>View Leaderboard</span>
                        </button>
                    ) : (
                        <div className="bg-surface glass neon-card rounded-2xl border border-app p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-app flex items-center space-x-2">
                                    <Award className="w-5 h-5" />
                                    <span>Leaderboard</span>
                                </h2>
                            </div>
                            <div className="space-y-2">
                                {leaderboard.length === 0 ? (
                                    <div className="text-center text-sm muted-text py-4">
                                        No student yet submitted.
                                    </div>
                                ) : (
                                    leaderboard.map((entry, idx) => (
                                        <div
                                            key={entry._id || idx}
                                            className="flex items-center justify-between p-3 rounded-lg border border-app/50"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <span className="font-mono w-6 text-center">#{idx + 1}</span>
                                                <span>{entry.user.username}</span>
                                            </div>
                                            <div className="font-bold text-app">
                                                {entry.totalScore.toFixed(1)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    );
}