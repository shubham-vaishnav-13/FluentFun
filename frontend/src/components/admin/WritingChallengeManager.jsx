import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  PenTool, 
  Search, 
  FileText,
  X,
  Save,
  Clock,
  CheckCircle,
  XCircle,
  AlignLeft,
  Hash
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api.config';
import AdminAPI from '../../services/adminAPI';

const WritingChallengeManager = () => {
  const [challenges, setChallenges] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const LANGUAGE_MAP = {
    en: 'English',
    hi: 'Hindi',
    gu: 'Gujarati',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
  };

  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    category: 'essay',
    timeLimitMinutes: 30, // minutes (backend expects minutes 15-180)
    prompt: '',
    wordLimitMin: 150,
    wordLimitMax: 300,
    requirements: '',
    language: 'en',
    rubric: {
      grammar: 25,
      vocabulary: 25,
      structure: 25,
      content: 25
    }
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
  // Fetching writing challenges from API...
        const res = await api.get('/admin/writing-challenges',{ params: { limit: 100 } });
  // API response received
        
        const loadedChallenges = res.data.data.challenges || [];
  // Received writing challenges
        
        if (mounted) setChallenges(loadedChallenges);
      } catch (e) {
  toast.error('Failed to load writing challenges');
        toast.error('Failed to load writing challenges: ' + (e.message || 'Unknown error'));
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
      if (!challengeForm.title || !challengeForm.description || !challengeForm.prompt) {
        throw new Error('Title, description, and prompt are required');
      }

      if (challengeForm.wordLimitMin < 50) {
        throw new Error('Minimum word limit must be at least 50');
      }
      if (challengeForm.wordLimitMin >= challengeForm.wordLimitMax) {
        throw new Error('Minimum word limit must be less than maximum word limit');
      }

      // Prepare payload for backend validators
      const payload = {
        title: challengeForm.title,
        description: challengeForm.description,
        difficulty: challengeForm.difficulty,
        category: challengeForm.category,
        timeLimit: Number(challengeForm.timeLimitMinutes),
        prompt: challengeForm.prompt,
        wordLimit: { min: Number(challengeForm.wordLimitMin), max: Number(challengeForm.wordLimitMax) },
        requirements: challengeForm.requirements,
        rubric: Object.entries(challengeForm.rubric).map(([name, weight]) => ({ name, weight: Number(weight), description: '' }))
      };

      // Final validation
      if (payload.timeLimit < 15 || payload.timeLimit > 180) {
        throw new Error('Time limit must be between 15 and 180 minutes');
      }
      if (payload.wordLimit.min >= payload.wordLimit.max) {
        throw new Error('Word limit min must be less than max');
      }
      const rubricTotal = payload.rubric.reduce((s, r) => s + r.weight, 0);
      if (rubricTotal !== 100) {
        throw new Error(`Rubric weights must sum to 100 (got ${rubricTotal})`);
      }

      if (editingChallenge) {
        const res = await api.patch(`/admin/writing-challenges/${editingChallenge._id || editingChallenge.id}`, payload);
        setChallenges(prev => prev.map(c => (c._id === res.data.data._id ? res.data.data : c)));
        toast.success('Writing challenge updated successfully!');
      } else {
        const res = await api.post('/admin/writing-challenges', payload);
        setChallenges(prev => [res.data.data, ...prev]);
        toast.success('Writing challenge created successfully!');
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
    const wl = challenge.wordLimit || {};
    const wlMin = typeof wl === 'object' ? (wl.min ?? 150) : (typeof wl === 'number' ? Math.max(50, wl - 20) : 150);
    const wlMax = typeof wl === 'object' ? (wl.max ?? (wlMin + 150)) : (typeof wl === 'number' ? wl + 20 : 300);
    setChallengeForm({
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      category: challenge.category,
      timeLimitMinutes: challenge.timeLimit, // already minutes in backend
      prompt: challenge.prompt,
      wordLimitMin: wlMin,
      wordLimitMax: wlMax <= wlMin ? wlMin + 1 : wlMax,
      requirements: challenge.requirements || '',
      language: challenge.language || 'en',
      rubric: {
        grammar: 25,
        vocabulary: 25,
        structure: 25,
        content: 25
      }
    });
    setShowAddModal(true);
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (window.confirm('Are you sure you want to delete this writing challenge?')) {
      try {
        await api.delete(`/admin/writing-challenges/${challengeId}`);
        setChallenges(prev => prev.filter(c => (c._id || c.id) !== challengeId));
        toast.success('Writing challenge deleted successfully!');
      } catch (e) {
  toast.error('Failed to delete writing challenge');
        toast.error('Failed to delete writing challenge');
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
      category: 'essay',
      timeLimitMinutes: 30,
      prompt: '',
      wordLimitMin: 150,
      wordLimitMax: 300,
      requirements: '',
      language: 'en',
      rubric: {
        grammar: 25,
        vocabulary: 25,
        structure: 25,
        content: 25
      }
    });
  };

  const handleRubricChange = (criteria, value) => {
    setChallengeForm(prev => ({
      ...prev,
      rubric: {
        ...prev.rubric,
        [criteria]: parseInt(value)
      }
    }));
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
      case 'essay': return 'text-blue-500 bg-blue-500/10';
      case 'descriptive': return 'text-purple-500 bg-purple-500/10';
      case 'opinion': return 'text-orange-500 bg-orange-500/10';
      case 'creative': return 'text-pink-500 bg-pink-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}min`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-app">Writing Challenge Management</h2>
          <p className="muted-text">Create and manage writing practice challenges</p>
        </div>
        <div className="flex items-center space-x-3">
          <label htmlFor="import-writing-json" className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-app hover:bg-white/5 transition text-sm cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>{importing ? 'Importing...' : 'Import JSON'}</span>
          </label>
          <input id="import-writing-json" type="file" accept=".json,application/json" onChange={async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            setImporting(true);
            try {
              const text = await file.text();
              let parsed = JSON.parse(text);
              if (!Array.isArray(parsed)) {
                if (parsed.items && Array.isArray(parsed.items)) parsed = parsed.items;
                else parsed = [parsed];
              }

              const created = [];
              for (const item of parsed) {
                try {
                  // Validate and transform the imported data
                  const transformedItem = {
                    title: item.title,
                    description: item.description,
                    prompt: item.prompt || item.description, // fallback if prompt is missing
                    category: item.category,
                    difficulty: item.difficulty,
                    language: item.language === 'spanish' ? 'es' : (item.language || 'en'), // Fix language codes
                    timeLimit: item.timeLimit,
                    wordLimit: item.wordLimit,
                    rubric: item.rubric || [
                      { name: 'grammar', weight: 25, description: '' },
                      { name: 'vocabulary', weight: 25, description: '' },
                      { name: 'structure', weight: 25, description: '' },
                      { name: 'content', weight: 25, description: '' }
                    ],
                    tags: item.tags || [],
                    isActive: item.isActive !== false // default to true
                  };

                  // Validate required fields
                  if (!transformedItem.title || !transformedItem.description || !transformedItem.prompt) {
                    throw new Error('Missing required fields: title, description, or prompt');
                  }

                  // Validate language
                  const validLanguages = ['en', 'hi', 'gu', 'fr', 'es', 'de'];
                  if (!validLanguages.includes(transformedItem.language)) {
                    // Invalid language for item, defaulted to en
                    transformedItem.language = 'en';
                  }

                  // Validate wordLimit structure
                  if (!transformedItem.wordLimit || typeof transformedItem.wordLimit !== 'object') {
                    transformedItem.wordLimit = { min: 150, max: 300 };
                  }

                  const res = await api.post('/admin/writing-challenges', transformedItem);
                  if (res && res.data && res.data.data) {
                    created.push(res.data.data);
                    toast.success(`Imported: ${transformedItem.title}`);
                  } else {
                    throw new Error('Invalid response from server');
                  }
                } catch (err) {
                  toast.error('Failed to import writing challenge');
                  // Continue with other items even if one fails
                }
              }

              if (created.length) {
                setChallenges(prev => [...created, ...prev]);
                toast.success(`Successfully imported ${created.length} writing challenge${created.length > 1 ? 's' : ''}!`);
              } else {
                toast.error('No writing challenges were imported. Check the console for details on validation errors.');
              }
            } catch (err) {
              toast.error('Failed to read/parse JSON file');
              toast.error('Invalid JSON file');
            } finally {
              e.target.value = '';
              setImporting(false);
            }
          }} className="hidden" />

          <button
            onClick={async () => {
              setGenerating(true);
              try {
                const payload = { language: 'en', difficulty: filterDifficulty === 'all' ? 'beginner' : filterDifficulty, count: 3 };
                const resp = await AdminAPI.generateWritingChallenges(payload);
                if (resp?.success) {
                  const created = resp.data?.challenges || [];
                  if (created.length) setChallenges(prev => [...created, ...prev]);
                  toast.success(`Generated ${resp.data?.count || created.length} challenges via n8n`);
                } else {
                  toast.error(resp?.message || 'Generation failed');
                }
              } catch (err) {
                toast.error(err?.message || 'Failed to generate challenges');
              } finally {
                setGenerating(false);
              }
            }}
            className="neon-btn px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2 disabled:opacity-50"
            disabled={generating}
          >
            <Plus className="w-4 h-4" />
            <span>{generating ? 'Generating…' : 'Generate via n8n'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="neon-btn px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Writing Challenge</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface glass neon-card rounded-2xl border border-app p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search writing challenges..."
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
            key={challenge._id || challenge.id}
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
                    <Hash className="w-3 h-3" />
                    <span>{(() => {
                      const wl = challenge.wordLimit;
                      if (wl == null) return '—';
                      if (typeof wl === 'number') return `${wl} words`;
                      if (typeof wl === 'object') {
                        const min = wl.min ?? wl.from ?? '';
                        const max = wl.max ?? wl.to ?? '';
                        if (min && max) return `${min}-${max} words`;
                        if (min) return `${min} words`;
                        if (max) return `${max} words`;
                        return '—';
                      }
                      return String(wl);
                    })()}</span>
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
              <p className="text-sm font-medium text-app mb-2">Prompt:</p>
              <p className="text-sm muted-text italic line-clamp-3">{challenge.prompt}</p>
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
                onClick={() => handleDeleteChallenge(challenge._id || challenge.id)}
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
          <p className="text-gray-500">No writing challenges found matching your criteria.</p>
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
              className="bg-surface glass neon-card rounded-2xl border border-app p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-app">
                  {editingChallenge ? 'Edit Writing Challenge' : 'Add New Writing Challenge'}
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
                    <label className="block text-sm font-medium text-app mb-2">Time Limit (minutes)</label>
                    <input
                      type="number"
                      value={challengeForm.timeLimitMinutes}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, timeLimitMinutes: Number(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                      min="15"
                      max="180"
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
                      <option value="essay">Essay</option>
                      <option value="descriptive">Descriptive</option>
                      <option value="opinion">Opinion</option>
                      <option value="creative">Creative</option>
                      <option value="formal">Formal Writing</option>
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
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Word Limit Min</label>
                    <input
                      type="number"
                      value={challengeForm.wordLimitMin}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, wordLimitMin: Number(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                      min="50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Word Limit Max</label>
                    <input
                      type="number"
                      value={challengeForm.wordLimitMax}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, wordLimitMax: Number(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                      min={challengeForm.wordLimitMin + 1}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-app mb-2">Writing Prompt</label>
                  <textarea
                    value={challengeForm.prompt}
                    onChange={(e) => setChallengeForm(prev => ({ ...prev, prompt: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    rows="4"
                    placeholder="Enter the writing prompt that students will see"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-app mb-2">Requirements & Guidelines</label>
                  <textarea
                    value={challengeForm.requirements}
                    onChange={(e) => setChallengeForm(prev => ({ ...prev, requirements: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    rows="3"
                    placeholder="Enter specific requirements (e.g., use past tense, include dialogue, etc.)"
                  />
                </div>

                {/* Rubric */}
                <div>
                  <h3 className="text-lg font-semibold text-app mb-4">Evaluation Rubric (Total: 100%)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(challengeForm.rubric).map(([criteria, percentage]) => (
                      <div key={criteria}>
                        <label className="block text-sm font-medium text-app mb-2 capitalize">{criteria}</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={percentage}
                            onChange={(e) => handleRubricChange(criteria, e.target.value)}
                            className="w-full px-3 py-2 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                            min="0"
                            max="100"
                          />
                          <span className="text-sm muted-text">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm muted-text mt-2">
                    Total: {Object.values(challengeForm.rubric).reduce((sum, val) => sum + val, 0)}%
                  </p>
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

export default WritingChallengeManager;
