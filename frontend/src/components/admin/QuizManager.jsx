import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  X,
  Save,
  Clock,
  CheckCircle,
  
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api.config';

const QuizManager = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
  language: 'en',
    category: 'grammar',
    timeLimit: 300, // 5 minutes
    questions: [
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: ''
      }
    ]
  });

  const LANGUAGE_MAP = {
    en: 'English',
    hi: 'Hindi',
    gu: 'Gujarati',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
  };

  // Load quizzes from backend
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/quizzes');
        if (mounted) setQuizzes(res.data.data.quizzes || []);
      } catch (e) {
        console.error('Failed to load quizzes', e);
        toast.error('Failed to load quizzes');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleAddQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: ''
        }
      ]
    }));
  };

  const handleRemoveQuestion = (index) => {
    if (quizForm.questions.length > 1) {
      setQuizForm(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    }
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex ? { ...q, [field]: value } : q
      )
    }));
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options.map((opt, oi) => oi === optionIndex ? value : opt)
            } 
          : q
      )
    }));
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!quizForm.title || !quizForm.description) {
        throw new Error('Title and description are required');
      }

      // Validate questions
      for (let i = 0; i < quizForm.questions.length; i++) {
        const q = quizForm.questions[i];
        if (!q.question) {
          throw new Error(`Question ${i + 1} is required`);
        }
        if (q.options.some(opt => !opt.trim())) {
          throw new Error(`All options for question ${i + 1} are required`);
        }
      }

      // Here you would make an API call to save the quiz
      // Save via API
      if (editingQuiz) {
        const res = await api.patch(`/admin/quizzes/${editingQuiz._id || editingQuiz.id}`, quizForm);
        setQuizzes(prev => prev.map(q => q._id === res.data.data._id ? res.data.data : q));
        toast.success('Quiz updated successfully!');
      } else {
        const res = await api.post('/admin/quizzes', quizForm);
        setQuizzes(prev => [res.data.data, ...prev]);
        toast.success('Quiz created successfully!');
      }

      handleCloseModal();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty,
  language: quiz.language || 'en',
      category: quiz.category,
      timeLimit: quiz.timeLimit,
      questions: [
        {
          question: 'Sample question',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          explanation: 'Sample explanation'
        }
      ]
    });
    setShowAddModal(true);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await api.delete(`/admin/quizzes/${quizId}`);
        setQuizzes(prev => prev.filter(q => (q._id || q.id) !== quizId));
        toast.success('Quiz deleted successfully!');
      } catch (e) {
        console.error('Failed to delete quiz', e);
        toast.error('Failed to delete quiz');
      }
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingQuiz(null);
    setQuizForm({
      title: '',
      description: '',
      difficulty: 'beginner',
      category: 'grammar',
      timeLimit: 300,
      questions: [
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: ''
        }
      ]
    });
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || quiz.difficulty === filterDifficulty;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-app">Quiz Management</h2>
          <p className="muted-text">Create and manage interactive quizzes</p>
        </div>
        <div className="flex items-center space-x-3">
          <label htmlFor="import-json-input" className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-app hover:bg-white/5 transition text-sm cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>{importing ? 'Importing...' : 'Import JSON'}</span>
          </label>
          <input id="import-json-input" type="file" accept=".json,application/json" onChange={async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            setImporting(true);
            try {
              const text = await file.text();
              let parsed = JSON.parse(text);
              if (!Array.isArray(parsed)) {
                // support object with items property
                if (parsed.items && Array.isArray(parsed.items)) parsed = parsed.items;
                else parsed = [parsed];
              }

              const created = [];
              for (const item of parsed) {
                try {
                  const res = await api.post('/admin/quizzes', item);
                  if (res && res.data && res.data.data) created.push(res.data.data);
                } catch (err) {
                  console.error('Failed to import item', err, item);
                }
              }

              if (created.length) {
                setQuizzes(prev => [...created, ...prev]);
                toast.success(`Imported ${created.length} quizzes`);
              } else {
                toast.error('No quizzes were imported. Check file format or permissions.');
              }
            } catch (err) {
              console.error('Failed to read/parse JSON file', err);
              toast.error('Invalid JSON file');
            } finally {
              e.target.value = '';
              setImporting(false);
            }
          }} className="hidden" />

          <button
            onClick={() => setShowAddModal(true)}
            className="neon-btn px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Quiz</span>
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
                placeholder="Search quizzes..."
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

      {/* Quiz List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredQuizzes.map((quiz, index) => (
          <motion.div
            key={quiz._id || quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-surface glass neon-card rounded-2xl border border-app p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-app mb-2">{quiz.title}</h3>
                <p className="text-sm muted-text mb-3">{quiz.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                    {quiz.difficulty}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                    {quiz.category}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {LANGUAGE_MAP[quiz.language] || quiz.language || 'Unknown'}
                  </span>
                </div>
              </div>
              {quiz.status === 'active' ? (
                <CheckCircle className={`w-5 h-5 ${getStatusColor(quiz.status)}`} />
              ) : quiz.status === 'draft' ? (
                <Clock className={`w-5 h-5 ${getStatusColor(quiz.status)}`} />
              ) : null}
            </div>

            {/* <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <p className="text-lg font-bold text-app">{quiz.questionsCount}</p>
                <p className="text-xs muted-text">Questions</p>
              </div>
              <div>
                <p className="text-lg font-bold text-app">{quiz.completions}</p>
                <p className="text-xs muted-text">Completions</p>
              </div>
              <div>
                <p className="text-lg font-bold text-app">{quiz.avgScore}%</p>
                <p className="text-xs muted-text">Avg Score</p>
              </div>
            </div> */}

            <div className="flex space-x-2">
              <button
                onClick={() => handleEditQuiz(quiz)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border border-app hover:bg-white/5 transition text-sm"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDeleteQuiz(quiz._id || quiz.id)}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredQuizzes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No quizzes found matching your criteria.</p>
        </div>
      )}

      {/* Add/Edit Quiz Modal */}
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
                  {editingQuiz ? 'Edit Quiz' : 'Add New Quiz'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg hover:bg-white/5 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitQuiz} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Title</label>
                    <input
                      type="text"
                      value={quizForm.title}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                      placeholder="Enter quiz title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Time Limit (seconds)</label>
                    <input
                      type="number"
                      value={quizForm.timeLimit}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                      min="60"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-app mb-2">Description</label>
                  <textarea
                    value={quizForm.description}
                    onChange={(e) => setQuizForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    rows="3"
                    placeholder="Enter quiz description"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Difficulty</label>
                    <select
                      value={quizForm.difficulty}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, difficulty: e.target.value }))}
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
                      value={quizForm.category}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    >
                      <option value="grammar">Grammar</option>
                      <option value="vocabulary">Vocabulary</option>
                      <option value="reading">Reading</option>
                      <option value="listening">Listening</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-app mb-2">Language</label>
                    <select
                      value={quizForm.language}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                    >
                      {Object.entries(LANGUAGE_MAP).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Questions */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-app">Questions</h3>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-app hover:bg-white/5 transition text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {quizForm.questions.map((question, qIndex) => (
                    <div key={qIndex} className="border border-app rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-app">Question {qIndex + 1}</h4>
                        {quizForm.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIndex)}
                            className="text-red-500 hover:text-red-700 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                          className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                          placeholder="Enter question"
                          required
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={question.correctAnswer === oIndex}
                                onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                                className="text-brand-purple"
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                                placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                required
                              />
                            </div>
                          ))}
                        </div>

                        <input
                          type="text"
                          value={question.explanation}
                          onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                          className="w-full px-4 py-2.5 border border-app rounded-lg focus:ring-2 focus:ring-brand-purple focus:border-transparent transition bg-transparent"
                          placeholder="Explanation (optional)"
                        />
                      </div>
                    </div>
                  ))}
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
                    <span>{loading ? 'Saving...' : editingQuiz ? 'Update Quiz' : 'Create Quiz'}</span>
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

export default QuizManager;
