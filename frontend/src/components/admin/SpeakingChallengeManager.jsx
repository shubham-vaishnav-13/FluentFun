import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Mic, 
  Search, 
  Play,
  Pause,
  Volume2,
  X,
  Save,
  Upload,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api.config';

const LANGUAGE_MAP = {
  en: 'English',
  hi: 'Hindi',
  gu: 'Gujarati',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
};

const SpeakingChallengeManager = () => {
  const [challenges, setChallenges] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [loading, setLoading] = useState(false);

  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    category: 'pronunciation',
    language: 'en',
    timeLimit: 120, // 2 minutes
    instructions: '',
    sampleAudio: null,
    targetWords: '',
    evaluationCriteria: 'pronunciation'
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/speaking-challenges');
        if (mounted) setChallenges(res.data.data.challenges || []);
      } catch (e) {
        console.error('Failed to load speaking challenges', e);
        toast.error('Failed to load speaking challenges');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleSubmitChallenge = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!challengeForm.title || !challengeForm.description) {
        throw new Error('Title and description are required');
      }

      if (editingChallenge) {
        const res = await api.patch(`/admin/speaking-challenges/${editingChallenge._id || editingChallenge.id}`, challengeForm);
        setChallenges(prev => prev.map(c => (c._id === res.data.data._id ? res.data.data : c)));
        toast.success('Speaking challenge updated successfully!');
      } else {
        const res = await api.post('/admin/speaking-challenges', challengeForm);
        setChallenges(prev => [res.data.data, ...prev]);
        toast.success('Speaking challenge created successfully!');
      }

      handleCloseModal();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChallenge = (challenge) => {
    setEditingChallenge(challenge);
    setChallengeForm({
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      category: challenge.category,
      language: challenge.language || 'en',
      timeLimit: challenge.timeLimit,
      instructions: challenge.instructions,
      sampleAudio: null,
      targetWords: challenge.targetWords,
      evaluationCriteria: 'pronunciation'
    });
    setShowAddModal(true);
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (window.confirm('Are you sure you want to delete this speaking challenge?')) {
      try {
        await api.delete(`/admin/speaking-challenges/${challengeId}`);
        setChallenges(prev => prev.filter(c => (c._id || c.id) !== challengeId));
        toast.success('Speaking challenge deleted successfully!');
      } catch (e) {
        console.error('Failed to delete speaking challenge', e);
        toast.error('Failed to delete speaking challenge');
      }
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingChallenge(null);
    setChallengeForm({
      title: '',
      description: '',
      difficulty: 'beginner',
      category: 'pronunciation',
      language: 'en',
      timeLimit: 120,
      instructions: '',
      sampleAudio: null,
      targetWords: '',
      evaluationCriteria: 'pronunciation'
    });
  };

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || challenge.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-500 bg-green-500/10';
      case 'intermediate': return 'text-yellow-500 bg-yellow-500/10';
      case 'advanced': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'draft': return 'text-yellow-500';
      case 'inactive': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'pronunciation': return 'text-blue-500 bg-blue-500/10';
      case 'conversation': return 'text-purple-500 bg-purple-500/10';
      case 'fluency': return 'text-orange-500 bg-orange-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-app">Speaking Challenge Management</h2>
          <p className="muted-text">Create and manage speaking practice challenges</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="neon-btn px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Speaking Challenge</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface glass neon-card rounded-2xl border border-app p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search speaking challenges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
              />
            </div>
          </div>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Challenge List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredChallenges.map((challenge, index) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-surface glass neon-card rounded-2xl border border-app p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-app mb-2">{challenge.title}</h3>
                <p className="text-sm muted-text mb-3">{challenge.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(challenge.category)}`}>
                    {challenge.category}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                    {LANGUAGE_MAP[challenge.language] || challenge.language}
                  </span>
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{Math.floor(challenge.timeLimit / 60)}min</span>
                  </div>
                </div>
              </div>
              {challenge.status === 'active' ? (
                <CheckCircle className={`w-5 h-5 ${getStatusColor(challenge.status)}`} />
              ) : challenge.status === 'draft' ? (
                <Clock className={`w-5 h-5 ${getStatusColor(challenge.status)}`} />
              ) : (
                <XCircle className={`w-5 h-5 ${getStatusColor(challenge.status)}`} />
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-app mb-2">Target Words:</p>
              <p className="text-sm muted-text italic">{challenge.targetWords}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-center">
              <div>
                <p className="text-lg font-bold text-app">{challenge.completions}</p>
                <p className="text-xs muted-text">Completions</p>
              </div>
              <div>
                <p className="text-lg font-bold text-app">{challenge.avgScore}%</p>
                <p className="text-xs muted-text">Avg Score</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEditChallenge(challenge)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border border-app hover:bg-white/5 transition text-sm"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDeleteChallenge(challenge.id)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredChallenges.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No speaking challenges found matching your criteria.</p>
        </div>
      )}

      {/* Add/Edit Challenge Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface glass neon-card rounded-2xl border border-app p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-app">
                  {editingChallenge ? 'Edit Speaking Challenge' : 'Add New Speaking Challenge'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg hover:bg-white/5 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitChallenge} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Title</label>
                    <input
                      type="text"
                      value={challengeForm.title}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                      placeholder="Enter challenge title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Time Limit (seconds)</label>
                    <input
                      type="number"
                      value={challengeForm.timeLimit}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                      min="30"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-app mb-2">Description</label>
                  <textarea
                    value={challengeForm.description}
                    onChange={(e) => setChallengeForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    rows="3"
                    placeholder="Enter challenge description"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Difficulty</label>
                    <select
                      value={challengeForm.difficulty}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Category</label>
                    <select
                      value={challengeForm.category}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    >
                      <option value="pronunciation">Pronunciation</option>
                      <option value="conversation">Conversation</option>
                      <option value="fluency">Fluency</option>
                      <option value="accent">Accent Training</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Language</label>
                    <select
                      value={challengeForm.language}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    >
                      {Object.entries(LANGUAGE_MAP).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-app mb-2">Instructions</label>
                  <textarea
                    value={challengeForm.instructions}
                    onChange={(e) => setChallengeForm(prev => ({ ...prev, instructions: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    rows="3"
                    placeholder="Enter detailed instructions for the challenge"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-app mb-2">Target Words/Phrases</label>
                  <input
                    type="text"
                    value={challengeForm.targetWords}
                    onChange={(e) => setChallengeForm(prev => ({ ...prev, targetWords: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    placeholder="Enter target words separated by commas"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-app mb-2">Sample Audio (Optional)</label>
                  <div className="border-2 border-dashed border-app rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, sampleAudio: e.target.files[0] }))}
                      className="sr-only"
                      id="audio-upload"
                    />
                    <label htmlFor="audio-upload" className="cursor-pointer">
                      <Volume2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Click to upload sample audio</p>
                      <p className="text-xs text-gray-400 mt-1">MP3, WAV files up to 10MB</p>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-app mb-2">Evaluation Criteria</label>
                  <select
                    value={challengeForm.evaluationCriteria}
                    onChange={(e) => setChallengeForm(prev => ({ ...prev, evaluationCriteria: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                  >
                    <option value="pronunciation">Pronunciation</option>
                    <option value="fluency">Fluency</option>
                    <option value="accuracy">Accuracy</option>
                    <option value="completeness">Completeness</option>
                  </select>
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2.5 border border-app rounded-lg hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 neon-btn px-4 py-2.5 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : editingChallenge ? 'Update Challenge' : 'Create Challenge'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpeakingChallengeManager;
