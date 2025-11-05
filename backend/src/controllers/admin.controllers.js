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
    
    // [getAllQuizzes] Request received
    
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

    // [getAllQuizzes] Using MongoDB query

    try {
        const quizzes = await Quiz.find(query)
            .populate('createdBy', 'username fullName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Quiz.countDocuments(query);

    // [getAllQuizzes] Results summarized

        return res.status(200).json(
            new ApiResponse(200, {
                quizzes,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }, "Quizzes retrieved successfully")
        );
    } catch (err) {
        console.error("[getAllQuizzes] Error:", err);
        throw new ApiError(500, "Failed to retrieve quizzes", err.message);
    }
});

export const createQuiz = asyncHandler(async (req, res) => {
    // Include language and progression metadata
    const { title, description, category, difficulty, timeLimit, questions, tags, language, sequence, minScoreToUnlockNext } = req.body;

    if (!title || !description || !category || !difficulty || !timeLimit || !questions || !language) {
        throw new ApiError(400, "All required fields (including language) must be provided");
    }

    const allowedLanguages = ['en', 'hi', 'gu', 'fr', 'es', 'de'];
    const normalizedLanguage = String(language).toLowerCase();
    if (!allowedLanguages.includes(normalizedLanguage)) {
        throw new ApiError(400, `Invalid language. Allowed: ${allowedLanguages.join(', ')}`);
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

    try {
        const quiz = await Quiz.create({
            title,
            description,
            category,
            difficulty,
            timeLimit,
            questions,
            language: normalizedLanguage,
            sequence: sequence || 1,
            minScoreToUnlockNext: typeof minScoreToUnlockNext === 'number' ? minScoreToUnlockNext : 60,
            tags: tags || [],
            createdBy: req.user._id
        });

        const populatedQuiz = await Quiz.findById(quiz._id).populate('createdBy', 'username fullName');

        return res.status(201).json(
            new ApiResponse(201, populatedQuiz, "Quiz created successfully")
        );
    } catch (err) {
        // Log detailed validation info in non-production
        if (process.env.NODE_ENV !== 'production') {
            console.error('[createQuiz:error]', {
                message: err.message,
                name: err.name,
                code: err.code,
                errors: err.errors && Object.fromEntries(Object.entries(err.errors).map(([k,v]) => [k, v.message]))
            });
        }
        if (err.name === 'ValidationError') {
            throw new ApiError(400, 'Validation failed', err.message);
        }
        throw new ApiError(500, 'Failed to create quiz');
    }
});

export const updateQuiz = asyncHandler(async (req, res) => {
    const { quizId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
        throw new ApiError(400, "Invalid quiz ID");
    }

    // If language is being updated, validate it
    if (req.body.language) {
        const allowedLanguages = ['en', 'hi', 'gu', 'fr', 'es', 'de'];
        const normalizedLanguage = String(req.body.language).toLowerCase();
        if (!allowedLanguages.includes(normalizedLanguage)) {
            throw new ApiError(400, `Invalid language. Allowed: ${allowedLanguages.join(', ')}`);
        }
        req.body.language = normalizedLanguage;
    }
    // Validate sequence/minScore if provided
    if (req.body.sequence) {
        const seq = Number(req.body.sequence);
        if (!Number.isInteger(seq) || seq < 1) {
            throw new ApiError(400, 'sequence must be a positive integer');
        }
        req.body.sequence = seq;
    }
    if (req.body.minScoreToUnlockNext) {
        const ms = Number(req.body.minScoreToUnlockNext);
        if (isNaN(ms) || ms < 0 || ms > 100) {
            throw new ApiError(400, 'minScoreToUnlockNext must be between 0 and 100');
        }
        req.body.minScoreToUnlockNext = ms;
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
    
    // [getAllWritingChallenges] Request received
    
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
    
    // [getAllWritingChallenges] Using MongoDB query
    
    try {
        const challenges = await WritingChallenge.find(query)
            .populate('createdBy', 'username fullName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await WritingChallenge.countDocuments(query);
        
    // [getAllWritingChallenges] Results summarized

        return res.status(200).json(
            new ApiResponse(200, {
                challenges,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }, "Writing challenges retrieved successfully")
        );
    } catch (err) {
        console.error("[getAllWritingChallenges] Error:", err);
        throw new ApiError(500, "Failed to retrieve writing challenges", err.message);
    }
});

export const createWritingChallenge = asyncHandler(async (req, res) => {
    // Support both single object and array bulk import
    const payload = req.body;

    if (Array.isArray(payload)) {
        if (payload.length === 0) {
            throw new ApiError(400, 'Empty array payload');
        }
        // Normalize and attach createdBy
        const docs = payload.map((c, idx) => ({
            ...c,
            createdBy: req.user._id,
        }));

        // Validate rubric weights early (mirrors pre hook but gives aggregated feedback)
        for (const [i, d] of docs.entries()) {
            if (!d.rubric || d.rubric.length === 0) {
                throw new ApiError(400, `Item ${i} missing rubric array`);
            }
            const sum = d.rubric.reduce((a, r) => a + (r.weight || 0), 0);
            if (Math.abs(sum - 100) > 0.0001) {
                throw new ApiError(400, `Item ${i} rubric weights must sum to 100 (got ${sum})`);
            }
        }

        try {
            const inserted = await WritingChallenge.insertMany(docs, { ordered: false });
            const populated = await WritingChallenge.find({ _id: { $in: inserted.map(d => d._id) } })
                .populate('createdBy', 'username fullName');
            return res.status(201).json(new ApiResponse(201, { count: populated.length, challenges: populated }, 'Writing challenges imported successfully'));
        } catch (err) {
            // If some failed due to validation, collect messages
            if (err.writeErrors) {
                const details = err.writeErrors.map(e => ({ index: e.index, error: e.errmsg || e.message }));
                return res.status(207).json(new ApiResponse(207, { partial: true, errors: details }, 'Partial import: some documents failed'));
            }
            throw err;
        }
    } else {
        // ---- SINGLE DOCUMENT PATH ----
        // Defensive normalization (trim & lower where appropriate)
        const normalizeCategory = (val) => (val || '').toString().trim();
        const normalizeDifficulty = (val) => (val || '').toString().trim().toLowerCase();
        const normalizeLanguage = (val) => (val || '').toString().trim().toLowerCase();
        const allowedCategories = ['essay','creative','formal','informal','academic','business','descriptive','reflective','analytical'];
        const allowedDifficulties = ['beginner','intermediate','advanced'];
        const allowedLanguages = ['en','hi','gu','fr','es','de'];

        const incomingRubric = Array.isArray(payload.rubric) ? payload.rubric : [];
        const challengeData = {
            title: (payload.title || '').trim(),
            description: (payload.description || '').trim(),
            prompt: (payload.prompt || payload.description || '').trim(),
            category: normalizeCategory(payload.category),
            difficulty: normalizeDifficulty(payload.difficulty),
            language: normalizeLanguage(payload.language),
            wordLimit: payload.wordLimit && typeof payload.wordLimit === 'object' ? {
                min: Number(payload.wordLimit.min),
                max: Number(payload.wordLimit.max)
            } : undefined,
            timeLimit: Number(payload.timeLimit),
            rubric: incomingRubric.map(r => ({
                name: (r.name || '').trim(),
                weight: Number(r.weight),
                description: r.description?.toString().trim() || ''
            })),
            keyPoints: Array.isArray(payload.keyPoints) ? payload.keyPoints : [],
            instructions: Array.isArray(payload.instructions) ? payload.instructions : [],
            tips: Array.isArray(payload.tips) ? payload.tips : [],
            targetVocabulary: Array.isArray(payload.targetVocabulary) ? payload.targetVocabulary : [],
            tags: Array.isArray(payload.tags) ? payload.tags : [],
            isActive: payload.isActive !== false,
            createdBy: req.user._id
        };

        // Pre-flight validation (mirrors schema) to catch & report clearly
        const errors = [];
        if (!challengeData.title) errors.push('title is required');
        if (!challengeData.description) errors.push('description is required');
        if (!challengeData.prompt) errors.push('prompt is required');
        if (!allowedCategories.includes(challengeData.category)) errors.push(`category '${challengeData.category}' invalid`);
        if (!allowedDifficulties.includes(challengeData.difficulty)) errors.push(`difficulty '${challengeData.difficulty}' invalid`);
        if (!allowedLanguages.includes(challengeData.language)) errors.push(`language '${challengeData.language}' invalid`);
        if (!challengeData.wordLimit || isNaN(challengeData.wordLimit.min) || isNaN(challengeData.wordLimit.max)) {
            errors.push('wordLimit.min & wordLimit.max required');
        } else {
            if (!Number.isInteger(challengeData.wordLimit.min) || !Number.isInteger(challengeData.wordLimit.max)) errors.push('wordLimit values must be integers');
            if (challengeData.wordLimit.min < 50) errors.push('wordLimit.min must be >= 50');
            if (challengeData.wordLimit.max > 2000) errors.push('wordLimit.max must be <= 2000');
            if (challengeData.wordLimit.min >= challengeData.wordLimit.max) errors.push('wordLimit.min must be < wordLimit.max');
        }
        if (!Number.isInteger(challengeData.timeLimit)) errors.push('timeLimit must be integer');
        else if (challengeData.timeLimit < 15 || challengeData.timeLimit > 180) errors.push('timeLimit must be between 15 and 180');

        if (!challengeData.rubric.length) errors.push('rubric required (non-empty array)');
        else {
            const sum = challengeData.rubric.reduce((a,r)=>a + (r.weight || 0), 0);
            if (Math.abs(sum - 100) > 0.0001) errors.push(`rubric weights must sum 100 (got ${sum})`);
            const normNames = challengeData.rubric.map(r=>r.name.toLowerCase());
            const dups = normNames.filter((n,i)=>normNames.indexOf(n)!==i);
            if (dups.length) errors.push(`duplicate rubric names: ${[...new Set(dups)].join(', ')}`);
        }

        if (errors.length) {
            if (process.env.NODE_ENV !== 'production') {
                // [createWritingChallenge:preflight] Rejecting payload
            }
            throw new ApiError(400, 'Preflight validation failed: ' + errors.join('; '));
        }

        try {
            const challenge = await WritingChallenge.create(challengeData);
            const populatedChallenge = await WritingChallenge.findById(challenge._id)
                .populate('createdBy', 'username fullName');

            return res.status(201).json(
                new ApiResponse(201, populatedChallenge, "Writing challenge created successfully")
            );
        } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('[createWritingChallenge:single] error', {
                    message: err.message,
                    name: err.name,
                    errors: err.errors && Object.values(err.errors).map(e=>e.message)
                });
            }
            if (err.name === 'ValidationError') {
                throw new ApiError(400, 'Validation failed: ' + Object.values(err.errors).map(e=>e.message).join('; '));
            }
            throw new ApiError(500, 'Failed to create writing challenge');
        }
    }
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

// n8n Generators
export const generateQuizzesViaN8n = asyncHandler(async (req, res) => {
    const language = (req.body?.language || 'en');
    const difficulty = (req.body?.difficulty || 'beginner');
    const category = (req.body?.category || 'grammar');
    const count = Number(req.body?.questionsCount ?? req.body?.count ?? 3);

    const directUrl = process.env.N8N_WEBHOOK_QUIZ_URL; // optional full URL override
    const base = process.env.N8N_BASE_URL;
    const path = process.env.N8N_WEBHOOK_QUIZ_PATH || '/webhook/generate-quiz';
    const url = directUrl
        ? directUrl
        : (() => {
            if (!base) throw new ApiError(500, 'N8N_BASE_URL is not configured');
            const b = base.endsWith('/') ? base.slice(0, -1) : base;
            const p = path.startsWith('/') ? path : `/${path}`;
            return `${b}${p}`;
        })();
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.N8N_API_KEY) headers['X-N8N-API-KEY'] = process.env.N8N_API_KEY;

    const resp = await fetch(url, {
        method: 'POST',
        headers,
        // Forward the structure your n8n workflow expects
        body: JSON.stringify({ language, difficulty, questionsCount: count, category })
    });
    if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new ApiError(502, `n8n error ${resp.status}: ${text || resp.statusText}`);
    }

    const raw = await resp.json().catch(() => ({}));
    let items = [];
    if (Array.isArray(raw)) items = raw;
    else if (Array.isArray(raw.items)) items = raw.items;
    else if (raw && raw.data && Array.isArray(raw.data.items)) items = raw.data.items;
    else if (raw) items = [raw];

    const allowedLanguages = ['en', 'hi', 'gu', 'fr', 'es', 'de'];

    const docs = items.map((item, i) => {
        const lang = String(item.language || language || 'en').toLowerCase();
        const normalizeOptions = (arr) => {
            if (!Array.isArray(arr)) return ['Option A', 'Option B', 'Option C', 'Option D'];
            const four = arr.map(v => String(v ?? '')).slice(0, 4);
            while (four.length < 4) four.push(`Option ${String.fromCharCode(65 + four.length)}`);
            return four;
        };
        const questions = (item.questions || []).map((q, qi) => ({
            question: q.question || `Question ${qi + 1}`,
            options: normalizeOptions(q.options || q.choices),
            correctAnswer: typeof q.correctAnswer === 'number'
                ? q.correctAnswer
                : (typeof q.answerIndex === 'number' ? q.answerIndex : 0),
            explanation: q.explanation || ''
        })).slice(0, 50); // basic safety cap

        return {
            title: item.title || `Auto Quiz ${Date.now()}-${i + 1}`,
            description: item.description || 'Auto-generated quiz',
            category: item.category || category || 'grammar',
            difficulty: item.difficulty || difficulty || 'beginner',
            timeLimit: item.timeLimit || 300, // follow existing app convention
            language: allowedLanguages.includes(lang) ? lang : 'en',
            sequence: item.sequence || 1,
            minScoreToUnlockNext: typeof item.minScoreToUnlockNext === 'number' ? item.minScoreToUnlockNext : 60,
            tags: Array.isArray(item.tags) ? item.tags : [],
            questions,
            createdBy: req.user._id,
            isActive: item.isActive !== false
        };
    }).filter(d => d.questions && d.questions.length > 0);

    if (!docs.length) return res.status(200).json(new ApiResponse(200, { count: 0, quizzes: [] }, 'No quizzes generated'));

    const inserted = await Quiz.insertMany(docs, { ordered: false });
    const quizzes = await Quiz.find({ _id: { $in: inserted.map(d => d._id) } })
        .populate('createdBy', 'username fullName');

    return res.status(201).json(new ApiResponse(201, { count: quizzes.length, quizzes }, 'Quizzes generated and imported successfully'));
});

export const generateWritingChallengesViaN8n = asyncHandler(async (req, res) => {
    const { language = 'en', difficulty = 'beginner', count = 3, category = 'essay' } = req.body || {};

    const directUrl = process.env.N8N_WEBHOOK_WRITING_URL; // optional full URL override
    const base = process.env.N8N_BASE_URL;
    const path = process.env.N8N_WEBHOOK_WRITING_PATH || '/webhook/generate-writing';
    const url = directUrl
        ? directUrl
        : (() => {
            if (!base) throw new ApiError(500, 'N8N_BASE_URL is not configured');
            const b = base.endsWith('/') ? base.slice(0, -1) : base;
            const p = path.startsWith('/') ? path : `/${path}`;
            return `${b}${p}`;
        })();
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.N8N_API_KEY) headers['X-N8N-API-KEY'] = process.env.N8N_API_KEY;

    const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ language, difficulty, count, category })
    });
    if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new ApiError(502, `n8n error ${resp.status}: ${text || resp.statusText}`);
    }

    let data = await resp.json().catch(() => ({}));
    const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : [data]).filter(Boolean);

    const allowedLanguages = ['en', 'hi', 'gu', 'fr', 'es', 'de'];
    const defaultRubric = [
        { name: 'grammar', weight: 25, description: '' },
        { name: 'vocabulary', weight: 25, description: '' },
        { name: 'structure', weight: 25, description: '' },
        { name: 'content', weight: 25, description: '' }
    ];

    const docs = items.map((item, i) => {
        const lang = String(item.language || language || 'en').toLowerCase();
        const wl = item.wordLimit && typeof item.wordLimit === 'object'
            ? { min: Number(item.wordLimit.min ?? 150), max: Number(item.wordLimit.max ?? 300) }
            : { min: Number(item.wordLimitMin ?? 150), max: Number(item.wordLimitMax ?? 300) };

        return {
            title: (item.title || `Auto Writing Challenge ${Date.now()}-${i + 1}`).toString(),
            description: (item.description || 'Auto-generated writing challenge').toString(),
            prompt: (item.prompt || item.description || 'Write your response based on the prompt.').toString(),
            category: (item.category || category || 'essay').toString(),
            difficulty: (item.difficulty || difficulty || 'beginner').toString(),
            language: allowedLanguages.includes(lang) ? lang : 'en',
            timeLimit: Number(item.timeLimit || item.timeLimitMinutes || 30),
            wordLimit: { min: Math.max(50, parseInt(wl.min) || 150), max: Math.min(2000, parseInt(wl.max) || 300) },
            rubric: Array.isArray(item.rubric) && item.rubric.length ? item.rubric : defaultRubric,
            tags: Array.isArray(item.tags) ? item.tags : [],
            isActive: item.isActive !== false,
            createdBy: req.user._id
        };
    }).filter(d => d.title && d.prompt);

    if (!docs.length) return res.status(200).json(new ApiResponse(200, { count: 0, challenges: [] }, 'No writing challenges generated'));

    const inserted = await WritingChallenge.insertMany(docs, { ordered: false });
    const challenges = await WritingChallenge.find({ _id: { $in: inserted.map(d => d._id) } })
        .populate('createdBy', 'username fullName');

    return res.status(201).json(new ApiResponse(201, { count: challenges.length, challenges }, 'Writing challenges generated and imported successfully'));
});
