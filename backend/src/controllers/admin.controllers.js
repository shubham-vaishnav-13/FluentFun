import { asyncHandler } from '../utils/async.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.models.js';
import { Quiz } from '../models/quiz.models.js';
import { WritingChallenge } from '../models/writingChallenge.models.js';
import mongoose from 'mongoose';

// Dashboard Analytics
export const getDashboardStats = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const totalWritingChallenges = await WritingChallenge.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ isAdmin: true });

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({ 
        createdAt: { $gte: sevenDaysAgo } 
    });

    // Get content created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyQuizzes = await Quiz.countDocuments({ 
        createdAt: { $gte: startOfMonth } 
    });
    const monthlyWritingChallenges = await WritingChallenge.countDocuments({ 
        createdAt: { $gte: startOfMonth } 
    });

    const stats = {
        overview: {
            totalUsers,
            activeUsers,
            adminUsers,
            totalContent: totalQuizzes + totalWritingChallenges,
        },
        content: {
            totalQuizzes,
            totalWritingChallenges,
        },
        recent: {
            newUsersThisWeek: recentUsers,
            contentThisMonth: monthlyQuizzes + monthlyWritingChallenges,
        },
        monthly: {
            quizzes: monthlyQuizzes,
            writingChallenges: monthlyWritingChallenges,
        }
    };

    return res.status(200).json(
        new ApiResponse(200, stats, "Dashboard statistics retrieved successfully")
    );
});

// User Management
export const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    
    const query = {};
    
    if (search) {
        query.$or = [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { fullName: { $regex: search, $options: 'i' } }
        ];
    }
    
    if (status === 'active') {
        query.isActive = true;
    } else if (status === 'inactive') {
        query.isActive = false;
    } else if (status === 'admin') {
        query.isAdmin = true;
    }

    const users = await User.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        }, "Users retrieved successfully")
    );
});

export const updateUserStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { isActive, isAdmin } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Prevent self-deactivation
    if (userId === req.user._id.toString() && isActive === false) {
        throw new ApiError(400, "Cannot deactivate your own account");
    }

    // Prevent removing own admin privileges
    if (userId === req.user._id.toString() && isAdmin === false) {
        throw new ApiError(400, "Cannot remove your own admin privileges");
    }

    const updateData = {};
    if (typeof isActive !== 'undefined') updateData.isActive = isActive;
    if (typeof isAdmin !== 'undefined') updateData.isAdmin = isAdmin;

    const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
    ).select('-password -refreshToken');

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, user, "User status updated successfully")
    );
});

export const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Prevent self-deletion
    if (userId === req.user._id.toString()) {
        throw new ApiError(400, "Cannot delete your own account");
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "User deleted successfully")
    );
});

// Quiz Management
export const getAllQuizzes = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category = '', difficulty = '', search = '' } = req.query;
    
    const query = {};
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
        ];
    }

    const quizzes = await Quiz.find(query)
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
});

export const createQuiz = asyncHandler(async (req, res) => {
    const { title, description, category, difficulty, timeLimit, questions, tags } = req.body;

    if (!title || !description || !category || !difficulty || !timeLimit || !questions) {
        throw new ApiError(400, "All required fields must be provided");
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        throw new ApiError(400, "At least one question is required");
    }

    // Validate each question
    for (const question of questions) {
        if (!question.question || !question.options || question.options.length !== 4) {
            throw new ApiError(400, "Each question must have a question text and exactly 4 options");
        }
        if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer > 3) {
            throw new ApiError(400, "Each question must have a valid correct answer (0-3)");
        }
    }

    const quiz = await Quiz.create({
        title,
        description,
        category,
        difficulty,
        timeLimit,
        questions,
        tags: tags || [],
        createdBy: req.user._id
    });

    const populatedQuiz = await Quiz.findById(quiz._id).populate('createdBy', 'username fullName');

    return res.status(201).json(
        new ApiResponse(201, populatedQuiz, "Quiz created successfully")
    );
});

export const updateQuiz = asyncHandler(async (req, res) => {
    const { quizId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        throw new ApiError(400, "Invalid quiz ID");
    }

    const quiz = await Quiz.findByIdAndUpdate(
        quizId,
        req.body,
        { new: true, runValidators: true }
    ).populate('createdBy', 'username fullName');

    if (!quiz) {
        throw new ApiError(404, "Quiz not found");
    }

    return res.status(200).json(
        new ApiResponse(200, quiz, "Quiz updated successfully")
    );
});

export const deleteQuiz = asyncHandler(async (req, res) => {
    const { quizId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        throw new ApiError(400, "Invalid quiz ID");
    }

    const quiz = await Quiz.findByIdAndDelete(quizId);

    if (!quiz) {
        throw new ApiError(404, "Quiz not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Quiz deleted successfully")
    );
});

// Writing Challenge Management
export const getAllWritingChallenges = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category = '', difficulty = '', search = '' } = req.query;
    
    const query = {};
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
        ];
    }

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
});

export const createWritingChallenge = asyncHandler(async (req, res) => {
    const challengeData = {
        ...req.body,
        createdBy: req.user._id
    };

    const challenge = await WritingChallenge.create(challengeData);
    const populatedChallenge = await WritingChallenge.findById(challenge._id)
        .populate('createdBy', 'username fullName');

    return res.status(201).json(
        new ApiResponse(201, populatedChallenge, "Writing challenge created successfully")
    );
});

export const updateWritingChallenge = asyncHandler(async (req, res) => {
    const { challengeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
        throw new ApiError(400, "Invalid challenge ID");
    }

    const challenge = await WritingChallenge.findByIdAndUpdate(
        challengeId,
        req.body,
        { new: true, runValidators: true }
    ).populate('createdBy', 'username fullName');

    if (!challenge) {
        throw new ApiError(404, "Writing challenge not found");
    }

    return res.status(200).json(
        new ApiResponse(200, challenge, "Writing challenge updated successfully")
    );
});

export const deleteWritingChallenge = asyncHandler(async (req, res) => {
    const { challengeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
        throw new ApiError(400, "Invalid challenge ID");
    }

    const challenge = await WritingChallenge.findByIdAndDelete(challengeId);

    if (!challenge) {
        throw new ApiError(404, "Writing challenge not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Writing challenge deleted successfully")
    );
});
