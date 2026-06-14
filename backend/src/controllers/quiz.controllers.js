import { asyncHandler } from '../utils/async.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Quiz } from '../models/quiz.models.js';
import { QuizAttempt } from '../models/quizAttempt.models.js';
import { User } from '../models/user.models.js';


//----------------
//get all quized
//----------------

export const listQuizzes = asyncHandler(async (req, res) => {
  const { category, difficulty, page = 1, limit = 10, language } = req.query;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const query = { isActive: true };
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;
  if (language) query.language = String(language).toLowerCase();

  const [quizzes, total] = await Promise.all([
    Quiz.find(query)
      .select('-questions.correctAnswer -questions.explanation')
      .populate('createdBy', 'username fullName')
      .sort({ sequence: 1, createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum),
    Quiz.countDocuments(query)
  ]);

  return res.status(200).json(new ApiResponse(200, {
    quizzes,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    total
  }, 'Quizzes retrieved successfully'));
});


//----------------
// get no of quizes
//----------------

export const getQuizCounts = asyncHandler(async (req, res) => {
  const { language } = req.query;
  if (!language) throw new ApiError(400, 'language query parameter is required');

  const results = await Quiz.aggregate([
    { $match: { isActive: true, language: String(language).toLowerCase() } },
    { $group: { _id: '$difficulty', count: { $sum: 1 } } }
  ]);

  const counts = { beginner: 0, intermediate: 0, advanced: 0, total: 0 };
  for (const r of results) {
    const key = String(r._id);
    counts[key] = r.count || 0;
    counts.total += r.count || 0;
  }

  return res.status(200).json(new ApiResponse(200, counts, 'Quiz counts retrieved successfully'));
});

export const getRandomQuiz = asyncHandler(async (req, res) => {
  const { language, difficulty, category } = req.query;
  if (!language) throw new ApiError(400, 'language query parameter is required');
  if (!difficulty) throw new ApiError(400, 'difficulty query parameter is required');

  const match = { isActive: true, language: String(language).toLowerCase(), difficulty };
  if (category) match.category = category;

  const results = await Quiz.aggregate([
    { $match: match },
    { $sample: { size: 1 } },
    { $project: { 'questions.correctAnswer': 0, 'questions.explanation': 0 } }
  ]);
  if (!results.length) throw new ApiError(404, 'No quiz found for specified criteria');

  return res.status(200).json(new ApiResponse(200, results[0], 'Random quiz retrieved successfully'));
});

export const getQuizProgression = asyncHandler(async (req, res) => {
  let { language, difficulty } = req.query;
  if (!language || !difficulty) throw new ApiError(400, 'language and difficulty are required');
  language = String(language).toLowerCase();
  difficulty = String(difficulty).toLowerCase();

  const quizzes = await Quiz.find({ language, difficulty, isActive: true }).sort({ sequence: 1 });
  if (!quizzes.length) return res.status(200).json(new ApiResponse(200, [], 'No quizzes in this track yet'));

  const bestAttempts = await QuizAttempt.aggregate([
    { $match: { user: req.user._id, quiz: { $in: quizzes.map(q => q._id) } } },
    { $group: { _id: '$quiz', score: { $max: '$score' } } }
  ]);
  const bestByQuiz = new Map(bestAttempts.map(a => [String(a._id), a.score]));

  const progression = quizzes.map(q => ({
    quizId: q._id,
    title: q.title,
    sequence: q.sequence,
    required: q.minScoreToUnlockNext,
    attempted: bestByQuiz.has(String(q._id)),
    score: bestByQuiz.get(String(q._id)) ?? null
  }));

  return res.status(200).json(new ApiResponse(200, progression, 'Progression data retrieved'));
});

export const getQuizById = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const freshParam = String(req.query.fresh || req.query.retry || '').toLowerCase();
  const isFresh = ['1', 'true', 'yes'].includes(freshParam);

  const quiz = await Quiz.findOne({ _id: quizId, isActive: true }).populate('createdBy', 'username fullName');
  if (!quiz) throw new ApiError(404, 'Quiz not found');

  const attempt = isFresh ? null : await QuizAttempt.findOne({ user: req.user._id, quiz: quiz._id }).sort({ createdAt: -1 });

  const questions = (!attempt)
    ? quiz.questions.map(q => ({ question: q.question, options: q.options, points: q.points || 0 }))
    : quiz.questions.map((q, idx) => {
        const a = attempt.answers.find(ans => ans.questionIndex === idx);
        return {
          questionIndex: idx,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points || 0,
          selected: a?.selected ?? null,
          isCorrect: a?.isCorrect ?? null
        };
      });

  const payload = {
    _id: quiz._id,
    title: quiz.title,
    language: quiz.language,
    difficulty: quiz.difficulty,
    sequence: quiz.sequence,
    timeLimit: quiz.timeLimit,
    minScoreToUnlockNext: quiz.minScoreToUnlockNext,
    createdBy: quiz.createdBy,
    attempted: !!attempt,
    attempt: attempt ? {
      id: attempt._id,
      score: attempt.score,
      correct: attempt.correct,
      total: attempt.total,
      timeTaken: attempt.timeTaken,
      createdAt: attempt.createdAt,
      answers: attempt.answers
    } : null,
    questions
  };

  return res.status(200).json(new ApiResponse(200, payload, 'Quiz retrieved successfully'));
});

// --------------
// submit a quiz
//----------------

export const attemptQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const { answers, timeTaken } = req.body;

  const quiz = await Quiz.findOne({ _id: quizId, isActive: true });
  if (!quiz) throw new ApiError(404, 'Quiz not found');

  if (!Array.isArray(answers)) throw new ApiError(400, 'Answers must be an array');
  if (quiz.questions.length === 0) throw new ApiError(400, 'Quiz has no questions');
  if (answers.length !== quiz.questions.length) throw new ApiError(400, 'Answers array length mismatch');

  let correct = 0;
  const processed = answers.map((sel, idx) => {
    const q = quiz.questions[idx];
    const isCorrect = Number(sel) === q.correctAnswer;
    if (isCorrect) correct += 1;
    return { questionIndex: idx, selected: Number(sel), isCorrect };
  });

  const total = quiz.questions.length;
  const score = Math.round((correct / total) * 100);
  const xpEarned = quiz.questions.reduce((sum, q, idx) => sum + ((processed[idx]?.isCorrect ? (q.points || 0) : 0)), 0);

  const maxSeconds = quiz.timeLimit ? (quiz.timeLimit * 60) : 30;
  const rawTimeTaken = Number(timeTaken);
  const clampedTimeTaken = Number.isFinite(rawTimeTaken) ? Math.max(0, Math.min(rawTimeTaken, maxSeconds)) : 0;

  const lastAttempt = await QuizAttempt.findOne({ user: req.user._id, quiz: quiz._id }).sort({ attemptNumber: -1, createdAt: -1 });
  let nextAttemptNumber;
  if (lastAttempt && Number.isFinite(Number(lastAttempt.attemptNumber))) {
    nextAttemptNumber = Number(lastAttempt.attemptNumber) + 1;
  } else {
    const cnt = await QuizAttempt.countDocuments({ user: req.user._id, quiz: quiz._id });
    nextAttemptNumber = cnt + 1;
  }

  const createAttemptAndRespond = async (attemptNumber) => {
    const attempt = await QuizAttempt.create({
      user: req.user._id,
      quiz: quiz._id,
      attemptNumber,
      score,
      correct,
      total,
      timeTaken: clampedTimeTaken,
      answers: processed
    });

    const user = await User.findByIdAndUpdate(req.user._id, { $inc: { xp: xpEarned } }, { new: true }).select('xp username');

    const prevCount = Number(quiz.attemptsCount || 0);
    const prevAvg = Number(quiz.averageScore || 0);
    quiz.attemptsCount = prevCount + 1;
    quiz.averageScore = prevCount === 0 ? score : ((prevAvg * prevCount) + score) / (prevCount + 1);
    await quiz.save();

    const questionsSafe = quiz.questions.map((q, idx) => ({
      questionIndex: idx,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      points: q.points || 0,
      selected: processed[idx]?.selected,
      isCorrect: processed[idx]?.isCorrect
    }));

    return res.status(201).json(new ApiResponse(201, {
      attempt: { id: attempt._id, score, correct, total, xpEarned, answers: processed, createdAt: attempt.createdAt, timeTaken: clampedTimeTaken, attemptNumber },
      questions: questionsSafe,
      user: { xp: user?.xp }
    }, 'Quiz attempted successfully'));
  };

  try {
    await createAttemptAndRespond(nextAttemptNumber);
  } catch (err) {
    if (err?.code === 11000) {
      await createAttemptAndRespond(nextAttemptNumber + 1);
      return;
    }
    throw err;
  }
});


//----------------
// to get next quiz if score is fulfill
//----------------

export const getNextQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const current = await Quiz.findById(quizId);
  if (!current || !current.isActive) throw new ApiError(404, 'Quiz not found');

  const best = await QuizAttempt.findOne({ user: req.user._id, quiz: current._id }).sort({ score: -1 });
  if (!best) throw new ApiError(403, 'Attempt current quiz first');
  if (best.score < current.minScoreToUnlockNext) throw new ApiError(403, 'Minimum score not achieved to unlock next quiz');

  const nextQuiz = await Quiz.findOne({
    language: current.language,
    difficulty: current.difficulty,
    isActive: true,
    sequence: { $gt: current.sequence }
  }).sort({ sequence: 1 });

  if (!nextQuiz) return res.status(200).json(new ApiResponse(200, { done: true }, 'No further quiz in this track'));
  return res.status(200).json(new ApiResponse(200, nextQuiz, 'Next quiz retrieved'));
});
