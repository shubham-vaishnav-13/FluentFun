import { toast } from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Search, Filter, Globe, Volume2 } from 'lucide-react';
import Navbar from './Navbar';
import { API_BASE_URL } from '../config/api.config';

export default function SpeakingChallengeList() {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        difficulty: 'all',
        language: 'all',
        category: 'all'
    });
    const [selectedLanguage, setSelectedLanguage] = useState(null);
    const [fetching, setFetching] = useState(false);
    const [availableLanguages, setAvailableLanguages] = useState([]);

    const LANGUAGE_NAMES = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'hi': 'Hindi',
        'gu': 'Gujarati'
    };

    // Load available languages on mount
    useEffect(() => {
        const loadLanguages = async () => {
            try {
                console.log('Fetching languages from:', `${API_BASE_URL}/api/v1/speaking-challenges/languages`);
                const response = await fetch(`${API_BASE_URL}/api/v1/speaking-challenges/languages`, {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Languages API response:', data);
                
                if (data.success && data.data && data.data.languages) {
                    if (data.data.languages.length === 0) {
                        toast.error('No speaking challenges available yet');
                        setAvailableLanguages([]);
                        return;
                    }
                    
                    const langs = data.data.languages.map(code => ({
                        code,
                        name: LANGUAGE_NAMES[code] || code.toUpperCase()
                    }));
                    console.log('Processed languages:', langs);
                    setAvailableLanguages(langs);
                } else {
                    console.error('Invalid response structure:', data);
                    toast.error('Invalid response from server');
                }
            } catch (error) {
                console.error('Error loading languages:', error);
                toast.error('Failed to load languages: ' + error.message);
            }
        };
        loadLanguages();
    }, []);

    useEffect(() => {
        if (!selectedLanguage) return;
        
        const loadChallenges = async () => {
            setFetching(true);
            try {
                const params = new URLSearchParams({ language: selectedLanguage });
                const response = await fetch(`${API_BASE_URL}/api/v1/speaking-challenges?${params}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.success) {
                    setChallenges(data.data.challenges || []);
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                toast.error('Failed to load challenges');
            } finally {
                setLoading(false);
                setFetching(false);
            }
        };
        loadChallenges();
    }, [selectedLanguage]);

    const filteredChallenges = challenges.filter(challenge => {
        const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDifficulty = filters.difficulty === 'all' || challenge.difficulty === filters.difficulty;
        const matchesCategory = filters.category === 'all' || challenge.category === filters.category;
        
        return matchesSearch && matchesDifficulty && matchesCategory;
    });

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-100 text-green-700';
            case 'intermediate': return 'bg-yellow-100 text-yellow-700';
            case 'advanced': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'pronunciation': return '🗣️';
            case 'conversation': return '💬';
            case 'vocabulary': return '📚';
            case 'grammar': return '📖';
            case 'fluency': return '⚡';
            default: return '🎤';
        }
    };

    // Language selection step
    if (!selectedLanguage) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
                <Navbar />
                <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-10 text-center"
                    >
                        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-gray-800">
                            🎤 Speaking Challenges
                        </h1>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Choose a language to practice your speaking skills with real-time feedback.
                        </p>
                    </motion.div>

                    <div className={availableLanguages.length === 1 ? 'flex justify-center' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'}>
                        {availableLanguages.length === 0 && (
                            <div className="flex items-center justify-center py-16 w-full col-span-full">
                                <div className="text-gray-500 text-sm animate-pulse">Loading languages...</div>
                            </div>
                        )}
                        {availableLanguages.map(({ code, name }, index) => (
                            <motion.button
                                key={code}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => { setSelectedLanguage(code); setLoading(true); }}
                                className={`group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-500 hover:shadow-lg transition flex flex-col text-left overflow-hidden ${availableLanguages.length === 1 ? 'w-full max-w-md' : ''}`}
                            >
                                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 bg-gradient-to-br from-purple-500 to-transparent transition" />
                                <div className="flex items-center mb-4">
                                    <div className="p-3 rounded-xl bg-purple-100 text-purple-600 mr-4">
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800">{name}</h2>
                                        <p className="text-xs uppercase tracking-wide text-gray-500">{code}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">Practice speaking in {name}</p>
                                <div className="mt-4 text-purple-600 text-sm font-semibold group-hover:translate-x-1 transition">
                                    Start Speaking →
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <button
                        onClick={() => setSelectedLanguage(null)}
                        className="text-purple-600 hover:text-purple-700 mb-4 flex items-center gap-2"
                    >
                        ← Back to language selection
                    </button>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        🎤 Speaking Challenges
                    </h1>
                    <p className="text-gray-600">
                        Practice your {LANGUAGE_NAMES[selectedLanguage]} speaking skills
                    </p>
                </motion.div>

                {/* Search and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-md p-6 mb-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search challenges..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        {/* Difficulty Filter */}
                        <select
                            value={filters.difficulty}
                            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">All Levels</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>

                        {/* Category Filter */}
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">All Categories</option>
                            <option value="pronunciation">Pronunciation</option>
                            <option value="conversation">Conversation</option>
                            <option value="vocabulary">Vocabulary</option>
                            <option value="grammar">Grammar</option>
                            <option value="fluency">Fluency</option>
                        </select>
                    </div>
                </motion.div>

                {/* Results Count */}
                <div className="mb-4 text-gray-600">
                    {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''} found
                </div>

                {/* Challenges Grid */}
                {fetching ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading challenges...</p>
                    </div>
                ) : filteredChallenges.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 bg-white rounded-xl shadow-md"
                    >
                        <Mic size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No challenges found</h3>
                        <p className="text-gray-500">Try adjusting your filters or search term</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredChallenges.map((challenge, index) => (
                            <motion.div
                                key={challenge._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link
                                    to={`/speaking-challenge/${challenge._id}`}
                                    className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 h-full group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition">
                                                {challenge.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                                {challenge.description}
                                            </p>
                                        </div>
                                        <span className="text-2xl ml-2">
                                            {getCategoryIcon(challenge.category)}
                                        </span>
                                    </div>

                                    <div className="mb-4 bg-purple-50 rounded-lg p-3">
                                        <p className="text-sm text-gray-600 mb-1">Phrase to speak:</p>
                                        <p className="font-medium text-gray-800 line-clamp-2">
                                            {challenge.prompt}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
                                            {challenge.difficulty}
                                        </span>
                                        <span className="text-sm text-gray-500 capitalize">
                                            {challenge.category}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2 text-orange-600">
                                            <span className="text-sm font-semibold">{challenge.points} XP</span>
                                        </div>
                                        {challenge.audioUrl && (
                                            <div className="flex items-center gap-1 text-purple-600 text-sm">
                                                <Volume2 size={16} />
                                                <span>Example audio</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 text-purple-600 font-semibold text-sm group-hover:translate-x-1 transition">
                                        Start Challenge →
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
