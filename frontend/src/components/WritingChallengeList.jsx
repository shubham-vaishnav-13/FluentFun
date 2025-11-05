import { toast } from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, FileText, Search, Filter, Globe, ArrowLeft } from 'lucide-react';
import { writingAPI } from '../services/writingAPI';
import Navbar from './Navbar';

export default function WritingChallengeList() {
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

    useEffect(() => {
        // Only fetch when language chosen
        if (!selectedLanguage) return;
        const loadChallenges = async () => {
            setFetching(true);
            try {
                const data = await writingAPI.listAvailableChallenges({ language: selectedLanguage });
                setChallenges(data);
            } catch (e) {
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
        const matchesLanguage = filters.language === 'all' || challenge.language === filters.language;
        const matchesCategory = filters.category === 'all' || challenge.category === filters.category;
        
        return matchesSearch && matchesDifficulty && matchesLanguage && matchesCategory;
    });

    const [availableLanguages, setAvailableLanguages] = useState([]);
    const LANGUAGE_LABEL = (code) => {
        const found = availableLanguages.find(l => l.code === code);
        return found?.name || code;
    };

    // Load available languages on mount
    useEffect(() => {
        writingAPI.listAvailableWritingLanguages()
            .then(langs => setAvailableLanguages(langs))
            .catch(() => toast.error('Failed to load writing languages'));
    }, []);

        // Language selection step (Quiz-style)
        if (!selectedLanguage) {
                return (
                        <div className="min-h-screen bg-app text-app">
                            <Navbar />
                            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="mb-10 text-center"
                                >
                                    <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-brand-dark">Writing Challenges</h1>
                                    <p className="text-gray-600 max-w-2xl mx-auto">Choose a language to explore available writing challenges and practice with AI-generated feedback.</p>
                                </motion.div>
                                                <div className={availableLanguages.length === 1 ? 'flex justify-center' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'}>
                                                    {availableLanguages.length === 0 && (
                                                        <div className="flex items-center justify-center py-16 w-full">
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
                                                            className={`group relative bg-white rounded-2xl p-6 border border-brand-border hover:border-brand-purple hover:shadow-md transition flex flex-col text-left overflow-hidden ${availableLanguages.length === 1 ? 'w-full max-w-md' : ''}`}
                                                        >
                                                            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 bg-gradient-to-br from-brand-purple to-transparent transition" />
                                                            <div className="flex items-center mb-4">
                                                                <div className="p-3 rounded-xl bg-brand-purple/10 text-brand-purple mr-4">
                                                                    <Globe className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <h2 className="text-lg font-semibold text-brand-dark">{name}</h2>
                                                                    <p className="text-xs uppercase tracking-wide text-gray-500">{code}</p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-auto flex items-center text-sm font-medium text-brand-purple">
                                                                Select <ArrowLeft className="ml-2 rotate-180 w-4 h-4" />
                                                            </div>
                                                        </motion.button>
                                                    ))}
                                                </div>
                            </main>
                        </div>
                );
        }

        return (
            <div className="min-h-screen bg-app text-app">
                <Navbar />
                <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-brand-dark">Writing Challenges</h1>
                            <p className="text-gray-600 mt-1">Language: <span className="font-semibold uppercase">{LANGUAGE_LABEL(selectedLanguage)}</span></p>
                        </div>
                        <button
                            onClick={() => { setSelectedLanguage(null); setChallenges([]); setSearchTerm(''); }}
                            className="inline-flex items-center px-4 py-2 border border-brand-border rounded-xl hover:border-brand-purple hover:shadow-sm transition bg-white text-sm"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Change Language
                        </button>
                    </div>

                    <section className="bg-white rounded-2xl p-6 border border-brand-border shadow-sm">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search challenges..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/60 transition bg-white text-sm"
                                    />
                                </div>
                            </div>
                            <select
                                value={filters.difficulty}
                                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                                className="px-4 py-2.5 rounded-xl border border-brand-border focus:ring-2 focus:ring-brand-purple focus:border-brand-purple/60 bg-white text-sm"
                            >
                                <option value="all">All Difficulties</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {(filteredChallenges || []).map((challenge, index) => (
                            <motion.div
                                key={challenge._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl border border-brand-border hover:border-brand-purple/60 hover:shadow-lg transition p-6 flex flex-col group"
                            >
                                <div className="flex-1 flex flex-col">
                                    <h3 className="text-xl font-semibold text-brand-dark mb-2 line-clamp-2">{challenge.title}</h3>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{challenge.description}</p>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] font-medium mb-4">
                                        <div className="flex items-center gap-1 bg-brand-purple/5 text-brand-purple rounded-md px-2 py-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{challenge.timeLimit}m</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-brand-purple/5 text-brand-purple rounded-md px-2 py-1">
                                            <FileText className="w-3 h-3" />
                                            <span>{challenge.wordLimit.min}-{challenge.wordLimit.max}w</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide shadow-sm ${
                                            challenge.difficulty === 'beginner' ? 'bg-green-100 text-green-700 border border-green-200' :
                                            challenge.difficulty === 'intermediate' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                            'bg-purple-100 text-purple-700 border border-purple-200'
                                        }`}>{challenge.difficulty}</span>
                                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide shadow-sm">{challenge.category}</span>
                                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wide shadow-sm">{LANGUAGE_LABEL(challenge.language)}</span>
                                    </div>
                                </div>
                                <Link
                                    to={`/challenges/writing/${challenge._id}`}
                                    className="mt-auto inline-flex items-center justify-center bg-gray-300 px-4 py-2.5 rounded-xl bg-brand-purple text-black text-sm font-semibold shadow-sm hover:shadow-md hover:bg-brand-purple/90 focus:ring-2 focus:ring-brand-purple/40 focus:outline-none transition group-hover:-translate-y-0.5"
                                >
                                    Start Challenge
                                </Link>
                            </motion.div>
                        ))}
                    </section>

                    {(!fetching && filteredChallenges.length === 0) && (
                        <div className="text-center py-16 bg-white rounded-2xl border border-brand-border">
                            <p className="text-gray-500 text-sm">No writing challenges found for this language.</p>
                        </div>
                    )}
                    {fetching && (
                        <div className="text-center py-16 bg-white rounded-2xl border border-brand-border animate-pulse">
                            <p className="text-gray-500 text-sm">Loading {LANGUAGE_LABEL(selectedLanguage)} challenges...</p>
                        </div>
                    )}
                </main>
            </div>
        );
}