import { Router } from "express";
import { asyncHandler } from '../utils/async.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Quiz } from '../models/quiz.models.js';
import { QuizAttempt } from '../models/quizAttempt.models.js';
import { User } from '../models/user.models.js';
import { WritingChallenge } from '../models/writingChallenge.models.js';
import { Language } from '../models/language.models.js';
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Apply authentication to all routes
router.use(verifyJWT);

// Get all active quizzes
router.get('/quizzes', asyncHandler(async (req, res) => {
    const { category, difficulty, page = 1, limit = 10, language } = req.query;
    
    const query = { isActive: true };
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (language) query.language = language;

    const quizzes = await Quiz.find(query)
        .select('-questions.correctAnswer -questions.explanation') // Hide answers for public access
        .populate('createdBy', 'username fullName')
        .sort({ sequence: 1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Quiz.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            quizzes,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        }, "Quizzes retrieved successfully")
    );
}));

// Get counts of quizzes grouped by difficulty for a specific language
router.get('/quizzes/counts', asyncHandler(async (req, res) => {
    const { language } = req.query;
    if (!language) {
        throw new ApiError(400, 'language query parameter is required');
    }

    // Aggregate counts by difficulty
    const pipeline = [
        { $match: { isActive: true, language: String(language).toLowerCase() } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ];

    const results = await Quiz.aggregate(pipeline);

    // Build response object with expected difficulty keys
    const counts = { beginner: 0, intermediate: 0, advanced: 0, total: 0 };
    results.forEach(r => {
        const key = String(r._id);
        counts[key] = r.count || 0;
        counts.total += r.count || 0;
    });

    return res.status(200).json(
        new ApiResponse(200, counts, 'Quiz counts retrieved successfully')
    );
}));

// Get a single random quiz matching language & difficulty (or optionally category)
router.get('/quizzes/random', asyncHandler(async (req, res) => {
    const { language, difficulty, category } = req.query;
    if (!language) {
        throw new ApiError(400, 'language query parameter is required');
    }
    if (!difficulty) {
        throw new ApiError(400, 'difficulty query parameter is required');
    }

    const match = { isActive: true, language: String(language).toLowerCase(), difficulty };
    if (category) match.category = category;

    const pipeline = [
        { $match: match },
        { $sample: { size: 1 } },
        { $project: { 'questions.correctAnswer': 0, 'questions.explanation': 0 } }
    ];

    const results = await Quiz.aggregate(pipeline);
    if (!results.length) {
        throw new ApiError(404, 'No quiz found for specified criteria');
    }

    return res.status(200).json(
        new ApiResponse(200, results[0], 'Random quiz retrieved successfully')
    );
}));

// IMPORTANT: Place progression route BEFORE /quizzes/:quizId to avoid 'progression' being treated as an :quizId
router.get('/quizzes/progression', asyncHandler(async (req, res) => {
    let { language, difficulty } = req.query;
    if (!language || !difficulty) throw new ApiError(400, 'language and difficulty are required');
    language = String(language).toLowerCase();
    difficulty = String(difficulty).toLowerCase();

    // Fetch quizzes for track
    const quizzes = await Quiz.find({ language, difficulty, isActive: true }).sort({ sequence: 1 });
    if (!quizzes.length) {
        return res.status(200).json(new ApiResponse(200, [], 'No quizzes in this track yet'));
    }
    const attempts = await QuizAttempt.find({ user: req.user._id, quiz: { $in: quizzes.map(q => q._id) } });
    const attemptMap = new Map(attempts.map(a => [a.quiz.toString(), a]));

    const progression = quizzes.map(q => {
        const a = attemptMap.get(q._id.toString());
        return {
            quizId: q._id,
            title: q.title,
            sequence: q.sequence,
            required: q.minScoreToUnlockNext,
            attempted: !!a,
            score: a?.score ?? null
        };
    });

    if (process.env.NODE_ENV !== 'production') {
        console.log('[progression]', { language, difficulty, quizzes: quizzes.length, attempts: attempts.length });
    }

    return res.status(200).json(new ApiResponse(200, progression, 'Progression data retrieved'));
}));

// Get single quiz with questions (for taking the quiz) - keep AFTER progression route
router.get('/quizzes/:quizId', asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const quiz = await Quiz.findOne({ _id: quizId, isActive: true })
        .populate('createdBy', 'username fullName');
    if (!quiz) throw new ApiError(404, "Quiz not found");

    // Fetch existing attempt (single attempt model) if any
    const attempt = await QuizAttempt.findOne({ user: req.user._id, quiz: quiz._id });

    // Build safe question set:
    //  - If no attempt yet: hide correctAnswer/explanation
    //  - If attempted: include correctAnswer and user's selection/correctness
    let safeQuestions;
    if (!attempt) {
        safeQuestions = quiz.questions.map(q => ({
            question: q.question,
            options: q.options,
            points: q.points || 0
        }));
    } else {
        safeQuestions = quiz.questions.map((q, idx) => {
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
    }

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
        questions: safeQuestions
    };

    if (process.env.NODE_ENV !== 'production') {
        console.log('[quiz:get]', { quizId, attempted: !!attempt });
    }

    return res.status(200).json(new ApiResponse(200, payload, "Quiz retrieved successfully"));
}));

// Submit quiz attempt (single attempt enforced)
router.post('/quizzes/:quizId/attempt', asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const { answers, timeTaken } = req.body;

    const quiz = await Quiz.findOne({ _id: quizId, isActive: true });
    if (!quiz) throw new ApiError(404, 'Quiz not found');

    // Check existing attempt
    const existing = await QuizAttempt.findOne({ user: req.user._id, quiz: quiz._id });
    if (existing) throw new ApiError(400, 'You have already attempted this quiz');

    if (!Array.isArray(answers)) {
        throw new ApiError(400, 'Answers must be an array');
    }
    if (quiz.questions.length === 0) {
        throw new ApiError(400, 'Quiz has no questions');
    }
    if (answers.length !== quiz.questions.length) {
        console.warn('[attempt] length mismatch', { expected: quiz.questions.length, got: answers.length, quizId });
        throw new ApiError(400, 'Answers array length mismatch');
    }

    let correct = 0;
    const processed = answers.map((sel, idx) => {
        const q = quiz.questions[idx];
        const isCorrect = Number(sel) === q.correctAnswer;
        if (isCorrect) correct += 1;
        return { questionIndex: idx, selected: Number(sel), isCorrect };
    });

    const total = quiz.questions.length;
    const score = Math.round((correct / total) * 100);
    const xpEarned = quiz.questions.reduce((sum, q, idx) => {
        const p = processed[idx];
        return sum + (p?.isCorrect ? (q.points || 0) : 0);
    }, 0);
    try {
        const attempt = await QuizAttempt.create({
            user: req.user._id,
            quiz: quiz._id,
            score,
            correct,
            total,
            timeTaken: timeTaken || 0,
            answers: processed
        });

        // Increment user XP (atomic)
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $inc: { xp: xpEarned } },
            { new: true }
        ).select('xp username');

        // Update quiz aggregated stats (naive incremental)
        quiz.attemptsCount += 1;
        quiz.averageScore = ((quiz.averageScore * (quiz.attemptsCount - 1)) + score) / quiz.attemptsCount;
        await quiz.save();

        if (process.env.NODE_ENV !== 'production') {
            console.log('[attempt] success', { quizId, score, user: req.user._id });
        }
        // Build safe question data (include correctAnswer only AFTER attempt)
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
            attempt: {
                id: attempt._id,
                score,
                correct,
                total,
                xpEarned,
                answers: processed
            },
            questions: questionsSafe,
            user: {
                xp: user?.xp
            }
        }, 'Quiz attempted successfully'));
    } catch (err) {
        console.error('[attempt] error', err?.message, err);
        if (err.code === 11000) {
            throw new ApiError(400, 'Duplicate attempt');
        }
        throw new ApiError(500, 'Failed to record attempt');
    }
}));

// Get next quiz in progression (same language & difficulty) unlocked by score
router.get('/quizzes/:quizId/next', asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    const current = await Quiz.findById(quizId);
    if (!current || !current.isActive) throw new ApiError(404, 'Quiz not found');

    // Ensure user attempted current
    const attempt = await QuizAttempt.findOne({ user: req.user._id, quiz: current._id });
    if (!attempt) throw new ApiError(403, 'Attempt current quiz first');

    // Check if user reached threshold to unlock next
    if (attempt.score < current.minScoreToUnlockNext) {
        throw new ApiError(403, 'Minimum score not achieved to unlock next quiz');
    }

    const nextQuiz = await Quiz.findOne({
        language: current.language,
        difficulty: current.difficulty,
        isActive: true,
        sequence: { $gt: current.sequence }
    }).sort({ sequence: 1 });

    if (!nextQuiz) {
        return res.status(200).json(new ApiResponse(200, { done: true }, 'No further quiz in this track'));
    }

    return res.status(200).json(new ApiResponse(200, nextQuiz, 'Next quiz retrieved'));
}));

// (Old progression route removed; logic relocated above)

// Get all active writing challenges
router.get('/writing-challenges', asyncHandler(async (req, res) => {
    const { category, difficulty, page = 1, limit = 10, language } = req.query;
    
    const query = { isActive: true };
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (language) query.language = String(language).toLowerCase();

    const challenges = await WritingChallenge.find(query)
        .populate('createdBy', 'username fullName')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await WritingChallenge.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            challenges,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        }, "Writing challenges retrieved successfully")
    );
}));

// Get available languages for writing challenges (intersection with user preferredLanguages if any)
router.get('/writing-challenges/languages/available', asyncHandler(async (req, res) => {
    // Distinct languages from active challenges
    const activeLangs = await WritingChallenge.distinct('language', { isActive: true });
    let codes = activeLangs.map(l => String(l).toLowerCase());

    // If user has preferredLanguages, intersect (but if intersection empty, fall back to all to avoid lockout)
    if (Array.isArray(req.user?.preferredLanguages) && req.user.preferredLanguages.length) {
        const preferred = req.user.preferredLanguages.map(l => l.toLowerCase());
        const inter = codes.filter(c => preferred.includes(c));
        if (inter.length) codes = inter; // only reduce if we get at least one match
    }

    // Map to objects (name resolved optionally through Language collection if exists)
    const languageDocs = await Language.find({ code: { $in: codes } }).select('code name').lean();
    const nameMap = new Map(languageDocs.map(l => [l.code.toLowerCase(), l.name]));
    const payload = codes.sort().map(code => ({ code, name: nameMap.get(code) || code }));

    return res.status(200).json(new ApiResponse(200, { languages: payload }, 'Available writing challenge languages'));
}));

// Get single writing challenge
router.get('/writing-challenges/:challengeId', asyncHandler(async (req, res) => {
    const { challengeId } = req.params;
    
    const challenge = await WritingChallenge.findOne({ _id: challengeId, isActive: true })
        .populate('createdBy', 'username fullName');

    if (!challenge) {
        throw new ApiError(404, "Writing challenge not found");
    }

    return res.status(200).json(
        new ApiResponse(200, challenge, "Writing challenge retrieved successfully")
    );
}));

// Get all active languages
router.get('/languages', asyncHandler(async (req, res) => {
    const languages = await Language.find({ isActive: true })
        .select('code name')
        .sort({ name: 1 });

    return res.status(200).json(
        new ApiResponse(200, languages, "Languages retrieved successfully")
    );
}));

export default router;
