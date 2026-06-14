import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Square, Play, Award, History, Volume2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api.config';

export default function SpeakingChallenge() {
    const { challengeId } = useParams();
    const navigate = useNavigate();
    const { updateUserXP, user } = useAuth();
    
    const [challenge, setChallenge] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [duration, setDuration] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [previousAttempts, setPreviousAttempts] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    
    const mediaRecorderRef = useRef(null);
    const recognitionRef = useRef(null);
    const startTimeRef = useRef(null);
    const chunksRef = useRef([]);

    // Load challenge details
    useEffect(() => {
        const loadChallenge = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/speaking-challenges/${challengeId}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.success) {
                    setChallenge(data.data.challenge);
                    setPreviousAttempts(data.data.userAttempts || []);
                } else {
                    throw new Error(data.message || 'Failed to load challenge');
                }
            } catch (error) {
                toast.error('Failed to load challenge');
                navigate('/speaking-challenges');
            }
        };
        loadChallenge();
    }, [challengeId, navigate]);

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = getLanguageCode(challenge?.language);
            
            recognitionRef.current.onresult = (event) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error !== 'no-speech') {
                    toast.error('Speech recognition failed');
                }
            };
        }
    }, [challenge]);

    const getLanguageCode = (lang) => {
        const langMap = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'hi': 'hi-IN',
            'gu': 'gu-IN'
        };
        return langMap[lang] || 'en-US';
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                
                // Calculate duration
                const recordDuration = (Date.now() - startTimeRef.current) / 1000;
                setDuration(Math.round(recordDuration));
            };

            startTimeRef.current = Date.now();
            mediaRecorder.start();
            setIsRecording(true);
            setResult(null);
            setAudioBlob(null);
            setAudioUrl(null);

            // Start speech recognition
            if (recognitionRef.current) {
                recognitionRef.current.start();
            }

            toast.success('Recording started');
        } catch (error) {
            console.error('Error starting recording:', error);
            toast.error('Microphone access denied or not available');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);

            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore errors when stopping recognition
                }
            }

            toast.success('Recording stopped');
        }
    };

    const playExampleAudio = () => {
        if (challenge?.audioUrl) {
            const audio = new Audio(`${API_BASE_URL}${challenge.audioUrl}`);
            audio.play().catch(err => {
                toast.error('Failed to play example audio');
            });
        }
    };

    const handleSubmit = async () => {
        if (!audioBlob) {
            toast.error('Please record your response first');
            return;
        }

        if (!transcript.trim()) {
            toast.error('No speech detected. Please try recording again.');
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('challengeId', challengeId);
            formData.append('transcript', transcript);
            formData.append('duration', duration);

            const response = await fetch(`${API_BASE_URL}/api/v1/speaking-challenges/submit`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setResult(data.data);
                toast.success('Challenge submitted successfully! 🎉');
                
                // Update user XP
                if (data.data.xpAwarded && updateUserXP) {
                    updateUserXP(data.data.xpAwarded);
                }

                // Load leaderboard
                loadLeaderboard();
            } else {
                throw new Error(data.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Submission error:', error);
            toast.error(error.message || 'Failed to submit challenge');
        } finally {
            setSubmitting(false);
        }
    };

    const loadLeaderboard = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/speaking-challenges/${challengeId}/leaderboard?limit=10`,
                { credentials: 'include' }
            );
            const data = await response.json();
            
            if (data.success) {
                setLeaderboard(data.data.leaderboard || []);
                setShowLeaderboard(true);
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        }
    };

    const tryAgain = () => {
        setResult(null);
        setAudioBlob(null);
        setAudioUrl(null);
        setTranscript('');
        setDuration(0);
        setShowLeaderboard(false);
    };

    if (!challenge) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading challenge...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Challenge Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-lg p-6 mb-6"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    {challenge.title}
                                </h1>
                                <p className="text-gray-600">{challenge.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    challenge.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                    challenge.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {challenge.difficulty}
                                </span>
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                                    {challenge.category}
                                </span>
                            </div>
                        </div>

                        {/* Prompt Section */}
                        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Speak this phrase:</h3>
                            <p className="text-2xl font-bold text-gray-800 mb-3">{challenge.prompt}</p>
                            
                            {challenge.audioUrl && (
                                <button
                                    onClick={playExampleAudio}
                                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition"
                                >
                                    <Volume2 size={20} className="text-purple-600" />
                                    <span className="text-sm font-medium">Listen to example</span>
                                </button>
                            )}
                        </div>

                        {/* Hints */}
                        {challenge.hints && challenge.hints.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">💡 Hints:</h4>
                                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                                    {challenge.hints.map((hint, idx) => (
                                        <li key={idx}>{hint}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Points */}
                        <div className="flex items-center gap-2 text-orange-600">
                            <Award size={20} />
                            <span className="font-semibold">Worth {challenge.points} XP</span>
                        </div>
                    </motion.div>

                    {/* Recording Section */}
                    {!result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-lg p-8 mb-6"
                        >
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Record Your Response</h2>
                                
                                {/* Recording Button */}
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    disabled={submitting}
                                    className={`mx-auto mb-6 w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                                        isRecording
                                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                            : 'bg-purple-600 hover:bg-purple-700'
                                    } text-white shadow-lg disabled:opacity-50`}
                                >
                                    {isRecording ? <Square size={48} /> : <Mic size={48} />}
                                </button>

                                <p className="text-gray-600 mb-4">
                                    {isRecording ? '⏺ Recording... Click to stop' : '🎤 Click to start recording'}
                                </p>

                                {/* Audio Playback */}
                                {audioUrl && (
                                    <div className="mb-6">
                                        <audio controls src={audioUrl} className="mx-auto mb-3" />
                                        <p className="text-sm text-gray-600">Duration: {duration}s</p>
                                    </div>
                                )}

                                {/* Transcript */}
                                {transcript && (
                                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Your Response:</p>
                                        <p className="text-lg text-gray-800">{transcript}</p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={!audioBlob || submitting}
                                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Challenge'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Results Section */}
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-xl shadow-lg p-8 mb-6"
                        >
                            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Results</h2>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-purple-50 rounded-lg p-4 text-center">
                                    <p className="text-sm text-gray-600 mb-1">Pronunciation</p>
                                    <p className="text-3xl font-bold text-purple-600">
                                        {result.scores?.pronunciation || result.submission?.pronunciationScore || 0}%
                                    </p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <p className="text-sm text-gray-600 mb-1">Fluency</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {result.scores?.fluency || result.submission?.fluencyScore || 0}%
                                    </p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {result.scores?.accuracy || result.submission?.accuracyScore || 0}%
                                    </p>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-4 text-center">
                                    <p className="text-sm text-gray-600 mb-1">Total Score</p>
                                    <p className="text-3xl font-bold text-orange-600">
                                        {result.scores?.totalScore || result.submission?.totalScore || 0}%
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
                                <p className="text-lg text-gray-800 text-center">{result.feedback}</p>
                            </div>

                            <div className="text-center mb-6">
                                <p className="text-2xl font-bold text-orange-600">
                                    +{result.xpAwarded} XP Earned! 🎉
                                </p>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={tryAgain}
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => setShowLeaderboard(!showLeaderboard)}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                                >
                                    {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Leaderboard */}
                    {showLeaderboard && leaderboard.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-lg p-6"
                        >
                            <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Leaderboard</h3>
                            <div className="space-y-2">
                                {leaderboard.map((entry, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center justify-between p-3 rounded-lg ${
                                            entry.userId === user?._id ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-bold text-gray-400">#{idx + 1}</span>
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {entry.username || entry.fullName}
                                                    {entry.userId === user?._id && ' (You)'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Attempt #{entry.attemptNumber}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-purple-600">{entry.score}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Previous Attempts */}
                    {previousAttempts.length > 0 && !result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-lg p-6"
                        >
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <History size={24} />
                                Your Previous Attempts
                            </h3>
                            <div className="space-y-2">
                                {previousAttempts.map((attempt, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-700">Attempt #{attempt.attemptNumber}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="font-semibold text-purple-600">{attempt.totalScore}%</span>
                                            <span className="text-sm text-gray-500">
                                                {new Date(attempt.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </>
    );
}
