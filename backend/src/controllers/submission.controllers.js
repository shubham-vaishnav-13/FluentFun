import mongoose from 'mongoose';
import { Submission } from "../models/submission.models.js";
import { WritingChallenge } from "../models/writingChallenge.models.js";
import { User } from "../models/user.models.js";
import { evaluateSubmission } from "../services/aiScoring.service.js";
import { asyncHandler } from "../utils/async.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Helper to count words robustly
function countWords(text) {
  if (!text) return 0;
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  return tokens.length;
}

export const createSubmission = asyncHandler(async (req, res) => {
  console.log('Creating submission:', {
    challengeId: req.params.challengeId,
    userId: req.user?._id,
    textLength: req.body?.text?.length
  });

  const { challengeId } = req.params;
  const { text } = req.body;

  // Input validation
  if (!mongoose.Types.ObjectId.isValid(challengeId)) {
    throw new ApiError(400, "Invalid challenge ID format");
  }

  if (!text || !text.trim()) {
    throw new ApiError(400, "Submission text is required");
  }

  // Load challenge with select fields
  const challenge = await WritingChallenge.findById(challengeId)
    .select('isActive wordLimit rubric title language category difficulty prompt')
    .lean();

  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }

  if (!challenge.isActive) {
    throw new ApiError(403, "This challenge is no longer active");
  }

  if (!challenge.rubric?.length) {
    throw new ApiError(500, "Challenge has no rubric defined");
  }

  // Word count validation
  const wordCount = countWords(text);
  console.log('Word count:', { wordCount, min: challenge.wordLimit.min, max: challenge.wordLimit.max });

  if (wordCount < challenge.wordLimit.min) {
    throw new ApiError(400, `Minimum word count is ${challenge.wordLimit.min} (current: ${wordCount})`);
  }
  if (wordCount > challenge.wordLimit.max) {
    throw new ApiError(400, `Maximum word count is ${challenge.wordLimit.max} (current: ${wordCount})`);
  }

  try {
    // Get attempt number
    const attemptNumber = (await Submission.countDocuments({ 
      challenge: challenge._id, 
      user: req.user._id 
    })) + 1;

    console.log('Starting AI evaluation...');
    // Evaluate with AI
    const ai = await evaluateSubmission({ challenge, essayText: text });
    console.log('AI evaluation complete', { 
      modelUsed: ai.model,
      processingTime: ai.processingTimeMs,
      categoriesReceived: ai.categories?.length
    });

    // Process scores
    const rubricMap = new Map(challenge.rubric.map(r => [r.name.toLowerCase(), r]));
    const categories = (ai.categories || []).map(c => {
      const lookup = rubricMap.get((c.key || c.label || '').toLowerCase());
      if (!lookup) {
        console.warn('Category mismatch:', { received: c.key || c.label, available: [...rubricMap.keys()] });
      }
      const weight = lookup ? lookup.weight : 0;
      const rawScore = Math.min(100, Math.max(0, Math.round(c.score || 0)));
      const weightedScore = +(rawScore * (weight / 100)).toFixed(2);
      
      return {
        key: lookup?.name || c.key || 'unknown',
        label: c.label || lookup?.name || c.key,
        rawScore,
        weight,
        weightedScore,
        comment: c.comment || ''
      };
    });

    const totalScore = +categories.reduce((a, b) => a + b.weightedScore, 0).toFixed(2);

    // =============================
    // XP Awarding Logic
    // =============================
    // Formula (tunable):
    //   baseByDifficulty: beginner 40, intermediate 60, advanced 80
    //   performanceMultiplier = totalScore / 100 (linear scaling)
    //   attemptPenalty: first attempt 1.0, second 0.6, third 0.4, 4+ 0.25 (to discourage farming)
    //   finalXP = round(baseByDifficulty * performanceMultiplier * attemptPenalty)
    //   Minimum 5 XP when totalScore >= 30 to ensure some reward; 0 if very low score
    const difficultyBase = {
      beginner: 40,
      intermediate: 60,
      advanced: 80
    }[challenge.difficulty] || 40;
    let attemptPenalty = 1;
    if (attemptNumber === 2) attemptPenalty = 0.6;
    else if (attemptNumber === 3) attemptPenalty = 0.4;
    else if (attemptNumber >= 4) attemptPenalty = 0.25;

    let xpAwarded = 0;
    if (totalScore >= 30) { // require minimal quality
      xpAwarded = Math.round(difficultyBase * (totalScore / 100) * attemptPenalty);
      if (xpAwarded < 5) xpAwarded = 5; // floor reward
    }

    // Atomically increment user XP
    let updatedUser = null;
    if (xpAwarded > 0) {
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { xp: xpAwarded } },
        { new: true, projection: 'xp' }
      );
    }

    // Create submission document with xpAwarded stored
    const submission = await Submission.create({
      challenge: challenge._id,
      user: req.user._id,
      attemptNumber,
      text,
      wordCount,
      scores: categories,
      totalScore,
      xpAwarded,
      feedback: ai.overallFeedback || '',
      aiModel: ai.model,
      rawAIResponse: process.env.NODE_ENV === 'production' ? undefined : ai,
      processingTimeMs: ai.processingTimeMs
    });

    // Update challenge stats
    await WritingChallenge.recordSubmissionScore(challenge._id, totalScore);
    const updatedChallenge = await WritingChallenge.findById(challenge._id)
      .select('averageScore attemptsCount')
      .lean();

    console.log('Submission complete:', {
      submissionId: submission._id,
      totalScore,
      attemptNumber
    });

    return res.status(201).json(new ApiResponse(201, {
      submissionId: submission._id,
      attemptNumber: submission.attemptNumber,
      totalScore: submission.totalScore,
      scores: submission.scores,
      feedback: submission.feedback,
      xpAwarded: submission.xpAwarded,
      user: updatedUser ? { xp: updatedUser.xp } : undefined,
      averageScore: updatedChallenge?.averageScore ?? null,
      attemptsCount: updatedChallenge?.attemptsCount ?? null
    }, 'Submission evaluated & stored'));

  } catch (error) {
    // Add context to AI errors
    if (error.code === 'AI_EVAL_ERROR') {
      error.context = {
        ...error.context,
        challengeId,
        wordCount,
        attemptTime: new Date().toISOString()
      };
    }
    throw error;
  }
});

export const listMySubmissions = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  const subs = await Submission.find({ challenge: challengeId, user: req.user._id })
    .sort({ attemptNumber: -1 })
    .select('attemptNumber totalScore xpAwarded createdAt');
  return res.status(200).json(new ApiResponse(200, subs, 'Your submissions'));
});

export const challengeLeaderboard = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(challengeId)) {
    throw new ApiError(400, 'Invalid challenge ID');
  }

  // Aggregation: best (highest totalScore) submission per user
  const top = await Submission.aggregate([
    { $match: { challenge: new mongoose.Types.ObjectId(challengeId) } },
    // Sort so first doc per (user) in group stage is the best (highest totalScore, earliest createdAt as tiebreaker)
    { $sort: { totalScore: -1, createdAt: 1 } },
    { $group: {
        _id: '$user',
        totalScore: { $first: '$totalScore' },
        attemptNumber: { $first: '$attemptNumber' },
        createdAt: { $first: '$createdAt' },
        submissionId: { $first: '$_id' }
      }
    },
    // Re-sort aggregated list for final leaderboard ordering
    { $sort: { totalScore: -1, createdAt: 1 } },
    { $limit: 20 },
    // Lookup user fields
    { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    { $project: {
        _id: 0,
        user: { _id: '$user._id', username: '$user.username', fullName: '$user.fullName', profileImage: '$user.profileImage' },
        totalScore: 1,
        attemptNumber: 1,
        createdAt: 1,
        submissionId: 1
      }
    }
  ]);

  return res.status(200).json(new ApiResponse(200, top, 'Challenge leaderboard (best scores per user)'));
});
