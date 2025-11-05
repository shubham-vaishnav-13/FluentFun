import api from '../config/api.config.js';
import { API_PATHS } from '../config/apiPaths.js';

// Fetch a paginated list of quizzes with optional filters
export const getQuizzes = async ({ language, difficulty, category, page = 1, limit = 10 } = {}) => {
  const params = { page, limit };
  if (language) params.language = language;
  if (difficulty) params.difficulty = difficulty;
  if (category) params.category = category;
  const res = await api.get(API_PATHS.CONTENT.GET_QUIZZES, { params });
  return res.data;
};

// Fetch a single random quiz for language & difficulty
export const getRandomQuiz = async ({ language, difficulty, category }) => {
  if (!language || !difficulty) throw new Error('language and difficulty are required');
  const params = { language, difficulty };
  if (category) params.category = category;
  const res = await api.get(API_PATHS.CONTENT.GET_RANDOM_QUIZ, { params });
  return res.data;
};

// Fetch quiz by ID (with questions hidden answers)
export const getQuizById = async (quizId) => {
  if (!quizId) throw new Error('quizId is required');
  const res = await api.get(API_PATHS.CONTENT.GET_QUIZ(quizId));
  return res.data;
};

// Submit attempt (single attempt enforced server-side)
export const attemptQuiz = async (quizId, { answers, timeTaken }) => {
  if (!quizId) throw new Error('quizId is required');
  const res = await api.post(API_PATHS.CONTENT.ATTEMPT_QUIZ(quizId), { answers, timeTaken });
  return res.data;
};

// Get progression list for a track
export const getProgression = async ({ language, difficulty }) => {
  if (!language || !difficulty) throw new Error('language and difficulty are required');
  const res = await api.get(API_PATHS.CONTENT.GET_PROGRESSION, { params: { language, difficulty } });
  return res.data;
};

// Get next quiz after a completed one
export const getNextQuiz = async (quizId) => {
  if (!quizId) throw new Error('quizId is required');
  const res = await api.get(API_PATHS.CONTENT.GET_NEXT_QUIZ(quizId));
  return res.data;
};

export default { getQuizzes, getRandomQuiz, getQuizById, attemptQuiz, getProgression, getNextQuiz };