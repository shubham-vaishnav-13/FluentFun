import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, Search, X, Save, Mic,
  CheckCircle, XCircle, Globe, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api.config';

const LANGUAGE_MAP = {
  en: 'English', hi: 'Hindi', gu: 'Gujarati',
  fr: 'French', es: 'Spanish', de: 'German',
};

const CATEGORIES = ['pronunciation', 'conversation', 'vocabulary', 'grammar', 'fluency'];

const emptyForm = {
  language: 'en',
  title: '',
  description: '',
  prompt: '',
  expectedResponse: '',
  category: 'pronunciation',
  difficulty: 'beginner',
  points: 50,
  hints: '',
  tags: '',
  isActive: true,
};

const SpeakingChallengeManager = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');

  // ── Load challenges ──────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/speaking-challenges', { params: { limit: 200 } });
        if (mounted) setChallenges(res.data?.data?.challenges || []);
      } catch (e) {
        toast.error('Failed to load speaking challenges');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────
  const getDifficultyColor = (d) => ({
    beginner: 'text-green-500 bg-green-500/10',
    intermediate: 'text-yellow-500 bg-yellow-500/10',
    advanced: 'text-red-500 bg-red-500/10',
  }[d] || 'text-gray-500 bg-gray-500/10');

  const filteredChallenges = challenges.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    const matchDiff = filterDifficulty === 'all' || c.difficulty === filterDifficulty;
    const matchLang = filterLanguage === 'all' || c.language === filterLanguage;
    return matchSearch && matchDiff && matchLang;
  });

  // ── Open modal ───────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingChallenge(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (challenge) => {
    setEditingChallenge(challenge);
    setForm({
      language: challenge.language,
      title: challenge.title,
      description: challenge.description,
      prompt: challenge.prompt,
      expectedResponse: challenge.expectedResponse,
      category: challenge.category,
      difficulty: challenge.difficulty,
      points: challenge.points,
      hints: (challenge.hints || []).join(', '),
      tags: (challenge.tags || []).join(', '),
      isActive: challenge.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingChallenge(null);
    setForm(emptyForm);
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.prompt || !form.expectedResponse) {
      toast.error('Title, prompt, and expected response are required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        points: Number(form.points) || 50,
        hints: form.hints.split(',').map(s => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      };

      if (editingChallenge) {
        const res = await api.patch(`/admin/speaking-challenges/${editingChallenge._id}`, payload);
        setChallenges(prev => prev.map(c => c._id === res.data.data._id ? res.data.data : c));
        toast.success('Speaking challenge updated!');
      } else {
        const res = await api.post('/admin/speaking-challenges', payload);
        setChallenges(prev => [res.data.data, ...prev]);
        toast.success('Speaking challenge created!');
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save challenge');
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this speaking challenge?')) return;
    try {
      await api.delete(`/admin/speaking-challenges/${id}`);
      setChallenges(prev => prev.filter(c => c._id !== id));
      toast.success('Speaking challenge deleted!');
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ── Toggle active ────────────────────────────────────────────
  const handleToggleActive = async (challenge) => {
    try {
      const res = await api.patch(`/admin/speaking-challenges/${challenge._id}`, { isActive: !challenge.isActive });
      setChallenges(prev => prev.map(c => c._id === challenge._id ? res.data.data : c));
      toast.success(`Challenge ${challenge.isActive ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-app">Speaking Challenge Management</h2>
          <p className="muted-text">Create and manage pronunciation and speaking practice challenges</p>
        </div>
        <button
          onClick={openCreateModal}
          className="neon-btn px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Speaking Challenge</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface glass neon-card rounded-2xl border border-app p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search speaking challenges..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
            />
          </div>
          <select
            value={filterLanguage}
            onChange={e => setFilterLanguage(e.target.value)}
            className="px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
          >
            <option value="all">All Languages</option>
            {Object.entries(LANGUAGE_MAP).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
          <select
            value={filterDifficulty}
            onChange={e => setFilterDifficulty(e.target.value)}
            className="px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Challenge Grid */}
      {loading && challenges.length === 0 ? (
        <div className="text-center py-12 muted-text">Loading challenges…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge, index) => (
            <motion.div
              key={challenge._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-surface glass neon-card rounded-2xl border border-app p-6"
            >
              {/* Top row */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-app mb-1 truncate">{challenge.title}</h3>
                  <p className="text-sm muted-text line-clamp-2">{challenge.description}</p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  {challenge.isActive
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <XCircle className="w-5 h-5 text-red-400" />}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                  {challenge.category}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500 flex items-center gap-1">
                  <Globe className="w-3 h-3" />{LANGUAGE_MAP[challenge.language] || challenge.language}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600">
                  {challenge.points} pts
                </span>
              </div>

              {/* Prompt preview */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-app mb-1 uppercase tracking-wide">Prompt:</p>
                <p className="text-sm muted-text italic line-clamp-2">"{challenge.prompt}"</p>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(challenge)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg border border-app hover:bg-white/5 transition text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleToggleActive(challenge)}
                  className={`px-3 py-2 rounded-lg border transition text-sm ${
                    challenge.isActive
                      ? 'border-red-300 text-red-600 hover:bg-red-50'
                      : 'border-green-300 text-green-600 hover:bg-green-50'
                  }`}
                  title={challenge.isActive ? 'Deactivate' : 'Activate'}
                >
                  {challenge.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(challenge._id)}
                  className="px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition text-sm"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredChallenges.length === 0 && (
        <div className="text-center py-12">
          <Mic className="w-12 h-12 muted-text mx-auto mb-3 opacity-40" />
          <p className="text-gray-500">No speaking challenges found. Create one above!</p>
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface glass neon-card rounded-2xl border border-app p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-app flex items-center gap-2">
                  <Mic className="w-5 h-5 text-brand-purple" />
                  {editingChallenge ? 'Edit Speaking Challenge' : 'Add Speaking Challenge'}
                </h2>
                <button onClick={closeModal} className="p-2 rounded-lg hover:bg-white/5 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Language + Difficulty + Category */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Language</label>
                    <select
                      value={form.language}
                      onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple bg-transparent"
                    >
                      {Object.entries(LANGUAGE_MAP).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Difficulty</label>
                    <select
                      value={form.difficulty}
                      onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple bg-transparent"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple bg-transparent"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-app mb-2">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple bg-transparent"
                    placeholder="e.g. Introduce Yourself"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-app mb-2">Description *</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple bg-transparent"
                    placeholder="Brief description of the challenge"
                    required
                  />
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-sm font-medium text-app mb-2">Prompt (displayed to user) *</label>
                  <textarea
                    value={form.prompt}
                    onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple bg-transparent"
                    rows={3}
                    placeholder="The text/phrase the user should say"
                    required
                  />
                </div>

                {/* Expected Response */}
                <div>
                  <label className="block text-sm font-medium text-app mb-2">Expected Response (for scoring) *</label>
                  <textarea
                    value={form.expectedResponse}
                    onChange={e => setForm(f => ({ ...f, expectedResponse: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple bg-transparent"
                    rows={2}
                    placeholder="Exact text the user's speech should match (used for accuracy scoring)"
                    required
                  />
                </div>

                {/* Points + Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Points</label>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      value={form.points}
                      onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple bg-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-7">
                    <input
                      type="checkbox"
                      id="sc-isActive"
                      checked={form.isActive}
                      onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                      className="rounded border-app text-brand-purple focus:ring-brand-purple"
                    />
                    <label htmlFor="sc-isActive" className="text-sm font-medium text-app">Active (visible to users)</label>
                  </div>
                </div>

                {/* Hints */}
                <div>
                  <label className="block text-sm font-medium text-app mb-2">
                    Hints <span className="muted-text font-normal">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={form.hints}
                    onChange={e => setForm(f => ({ ...f, hints: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple bg-transparent"
                    placeholder="Speak clearly, Don't rush, Practice vowels"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-app mb-2">
                    Tags <span className="muted-text font-normal">(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple bg-transparent"
                    placeholder="greetings, beginner, conversation"
                  />
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
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
                    <span>{loading ? 'Saving…' : editingChallenge ? 'Update Challenge' : 'Create Challenge'}</span>
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
