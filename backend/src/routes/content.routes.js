import { Router } from "express";
import { asyncHandler } from '../utils/async.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Quiz } from '../models/quiz.models.js';
import { SpeakingChallenge } from '../models/speakingChallenge.models.js';
import { WritingChallenge } from '../models/writingChallenge.models.js';
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Apply authentication to all routes
router.use(verifyJWT);

// Get all active quizzes
router.get('/quizzes', asyncHandler(async (req, res) => {
    const { category, difficulty, page = 1, limit = 10 } = req.query;
    
    const query = { isActive: true };
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const quizzes = await Quiz.find(query)
        .select('-questions.correctAnswer -questions.explanation') // Hide answers for public access
        .populate('createdBy', 'username fullName')
        .sort({ createdAt: -1 })
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

// Get single quiz with questions (for taking the quiz)
router.get('/quizzes/:quizId', asyncHandler(async (req, res) => {
    const { quizId } = req.params;
    
    const quiz = await Quiz.findOne({ _id: quizId, isActive: true })
        .select('-questions.correctAnswer -questions.explanation') // Hide answers
        .populate('createdBy', 'username fullName');

    if (!quiz) {
        throw new ApiError(404, "Quiz not found");
    }

    return res.status(200).json(
        new ApiResponse(200, quiz, "Quiz retrieved successfully")
    );
}));

// Get all active speaking challenges
router.get('/speaking-challenges', asyncHandler(async (req, res) => {
    const { category, difficulty, page = 1, limit = 10 } = req.query;
    
    const query = { isActive: true };
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

    const challenges = await SpeakingChallenge.find(query)
        .populate('createdBy', 'username fullName')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await SpeakingChallenge.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            challenges,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        }, "Speaking challenges retrieved successfully")
    );
}));

// Get single speaking challenge
router.get('/speaking-challenges/:challengeId', asyncHandler(async (req, res) => {
    const { challengeId } = req.params;
    
    const challenge = await SpeakingChallenge.findOne({ _id: challengeId, isActive: true })
        .populate('createdBy', 'username fullName');

    if (!challenge) {
        throw new ApiError(404, "Speaking challenge not found");
    }

    return res.status(200).json(
        new ApiResponse(200, challenge, "Speaking challenge retrieved successfully")
    );
}));

// Get all active writing challenges
router.get('/writing-challenges', asyncHandler(async (req, res) => {
    const { category, difficulty, page = 1, limit = 10 } = req.query;
    
    const query = { isActive: true };
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;

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

export default router;
