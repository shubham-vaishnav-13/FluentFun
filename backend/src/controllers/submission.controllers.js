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
  // Prepare submission data
  const submissionData = {
    challengeId: req.params.challengeId,
    userId: req.user?._id,
    textLength: req.body?.text?.length
  };

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
  // Word count checked

  if (wordCount < challenge.wordLimit.min) {
    throw new ApiError(400, `Minimum word count is ${challenge.wordLimit.min} (current: ${wordCount})`);
  }
  if (wordCount > challenge.wordLimit.max) {
    throw new ApiError(400, `Maximum word count is ${challenge.wordLimit.max} (current: ${wordCount})`);
  }

  // Get attempt number
  const attemptNumber = (await Submission.countDocuments({ 
    challenge: challenge._id, 
    user: req.user._id 
  })) + 1;

  // Local fallback generator (mirrors heuristic in aiScoring.service)
  const buildFallback = () => {
    const hash = [...text].reduce((a, c) => (a + c.charCodeAt(0)) % 1000, 0);
    const cats = challenge.rubric.map((r, i) => {
      const base = (hash + (i * 37)) % 101;
      const adjusted = Math.round((base * 0.7) + (r.weight * 0.3));
      return {
        key: r.name,
        label: r.name,
        score: Math.min(100, Math.max(0, adjusted)),
        comment: `Provisional heuristic score for ${r.name}.`
      };
    });
    return {
      model: 'heuristic-fallback',
      categories: cats,
      overallFeedback: 'Heuristic fallback used due to AI evaluation error.'
    };
  };

  let ai;
  let usedFallback = false;
  // Starting AI evaluation
  try {
    ai = await evaluateSubmission({ challenge, essayText: text });
    if (ai?.model === 'heuristic-fallback') {
      usedFallback = true;
  // AI service returned heuristic without throwing
    }
  } catch (error) {
  // AI evaluation failed, using fallback
    ai = buildFallback();
    usedFallback = true;
  }
  // Evaluation complete

  // Process scores
  const rubricMap = new Map(challenge.rubric.map(r => [r.name.toLowerCase(), r]));
  const categories = (ai.categories || []).map(c => {
    const lookup = rubricMap.get((c.key || c.label || '').toLowerCase());
    if (!lookup) {
  // Category mismatch encountered
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

  return res.status(201).json(new ApiResponse(201, {
    submissionId: submission._id,
    attemptNumber: submission.attemptNumber,
    totalScore: submission.totalScore,
    scores: submission.scores,
    feedback: submission.feedback,
    xpAwarded: submission.xpAwarded,
    createdAt: submission.createdAt,
    user: updatedUser ? { xp: updatedUser.xp } : undefined,
    averageScore: updatedChallenge?.averageScore ?? null,
    attemptsCount: updatedChallenge?.attemptsCount ?? null,
    evaluationMode: usedFallback ? 'fallback' : 'ai',
    aiDebug: process.env.NODE_ENV === 'production' ? undefined : ai?.debug
  }, usedFallback ? 'Submission stored with fallback scoring' : 'Submission evaluated & stored'));
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
