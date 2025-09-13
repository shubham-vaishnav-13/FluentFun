import api from '../config/api.config.js';

// Fetch a paginated list of quizzes with optional filters
export const getQuizzes = async ({ language, difficulty, category, page = 1, limit = 10 } = {}) => {
  const params = { page, limit };
  if (language) params.language = language;
  if (difficulty) params.difficulty = difficulty;
  if (category) params.category = category;
  const res = await api.get('/content/quizzes', { params });
  return res.data;
};

// Fetch a single random quiz for language & difficulty
export const getRandomQuiz = async ({ language, difficulty, category }) => {
  if (!language || !difficulty) throw new Error('language and difficulty are required');
  const params = { language, difficulty };
  if (category) params.category = category;
  const res = await api.get('/content/quizzes/random', { params });
  return res.data;
};

// Fetch quiz by ID (with questions hidden answers)
export const getQuizById = async (quizId) => {
  if (!quizId) throw new Error('quizId is required');
  const res = await api.get(`/content/quizzes/${quizId}`);
  return res.data;
};

// Submit attempt (single attempt enforced server-side)
export const attemptQuiz = async (quizId, { answers, timeTaken }) => {
  if (!quizId) throw new Error('quizId is required');
  const res = await api.post(`/content/quizzes/${quizId}/attempt`, { answers, timeTaken });
  return res.data;
};

// Get progression list for a track
export const getProgression = async ({ language, difficulty }) => {
  if (!language || !difficulty) throw new Error('language and difficulty are required');
  const res = await api.get('/content/quizzes/progression', { params: { language, difficulty } });
  return res.data;
};

// Get next quiz after a completed one
export const getNextQuiz = async (quizId) => {
  if (!quizId) throw new Error('quizId is required');
  const res = await api.get(`/content/quizzes/${quizId}/next`);
  return res.data;
};

export default { getQuizzes, getRandomQuiz, getQuizById, attemptQuiz, getProgression, getNextQuiz };