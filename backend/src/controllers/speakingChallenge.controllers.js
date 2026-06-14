import { asyncHandler } from '../utils/async.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { SpeakingChallenge } from '../models/speakingChallenge.models.js';
import { SpeakingSubmission } from '../models/speakingSubmission.models.js';
import { User } from '../models/user.models.js';

//----------------
// Get all speaking challenges
//----------------
export const listSpeakingChallenges = asyncHandler(async (req, res) => {
  const { category, difficulty, page = 1, limit = 10, language } = req.query;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;

  const query = { isActive: true };
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;
  if (language) query.language = String(language).toLowerCase();

  const [challenges, total] = await Promise.all([
    SpeakingChallenge.find(query)
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum),
    SpeakingChallenge.countDocuments(query)
  ]);

  return res.status(200).json(new ApiResponse(200, {
    challenges,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    total
  }, 'Speaking challenges retrieved successfully'));
});

//----------------
// Get available languages
//----------------
export const getAvailableLanguages = asyncHandler(async (req, res) => {
  const activeLangs = await SpeakingChallenge.distinct('language', { isActive: true });
  
  let codes = activeLangs.map(l => String(l).toLowerCase());

  // Only filter by user preferences if user is authenticated
  if (req.user && Array.isArray(req.user.preferredLanguages) && req.user.preferredLanguages.length) {
    const preferred = req.user.preferredLanguages.map(l => l.toLowerCase());
    const inter = codes.filter(c => preferred.includes(c));
    if (inter.length) codes = inter;
  }

  return res.status(200).json(new ApiResponse(200, { languages: codes }, 'Available languages'));
});

//----------------
// Get single speaking challenge by ID
//----------------
export const getSpeakingChallengeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const challenge = await SpeakingChallenge.findById(id)
    .populate('createdBy', 'username fullName');

  if (!challenge) {
    throw new ApiError(404, 'Speaking challenge not found');
  }

  // Get user's previous attempts if authenticated
  let userAttempts = [];
  if (req.user) {
    userAttempts = await SpeakingSubmission.find({
      challenge: id,
      user: req.user._id
    })
      .select('attemptNumber totalScore createdAt')
      .sort({ attemptNumber: -1 })
      .limit(5);
  }

  return res.status(200).json(new ApiResponse(200, {
    challenge,
    userAttempts
  }, 'Speaking challenge retrieved successfully'));
});

//----------------
// Submit speaking challenge
//----------------
export const submitSpeakingChallenge = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { challengeId, transcript, duration } = req.body;
  const userId = req.user._id;

  // Validate audio file
  if (!req.file) {
    throw new ApiError(400, 'Audio file is required');
  }

  // Find the challenge
  const challenge = await SpeakingChallenge.findById(challengeId);
  if (!challenge) {
    throw new ApiError(404, 'Speaking challenge not found');
  }

  if (!challenge.isActive) {
    throw new ApiError(400, 'This challenge is no longer active');
  }

  // Calculate attempt number
  const previousAttempts = await SpeakingSubmission.countDocuments({
    challenge: challengeId,
    user: userId
  });
  const attemptNumber = previousAttempts + 1;

  // Calculate scores
  const scores = calculateSpeakingScores(transcript, challenge.expectedResponse);
  
  // Calculate XP based on score and difficulty
  const xpAwarded = calculateXP(scores.totalScore, challenge.difficulty, challenge.points);

  // Create submission
  const submission = new SpeakingSubmission({
    challenge: challengeId,
    user: userId,
    attemptNumber,
    audioUrl: `/temp/${req.file.filename}`,
    transcript: transcript || '',
    duration: duration || 0,
    pronunciationScore: scores.pronunciation,
    fluencyScore: scores.fluency,
    accuracyScore: scores.accuracy,
    totalScore: scores.totalScore,
    xpAwarded,
    feedback: generateFeedback(scores.totalScore, challenge.difficulty),
    processingTimeMs: Date.now() - startTime,
  });

  await submission.save();

  // Update user XP
  await User.findByIdAndUpdate(
    userId,
    { $inc: { xp: xpAwarded } },
    { new: true }
  );

  return res.status(201).json(new ApiResponse(201, {
    submission,
    scores,
    feedback: submission.feedback,
    xpAwarded
  }, 'Speaking challenge submitted successfully'));
});

//----------------
// Get user's submissions for a challenge
//----------------
export const getUserSubmissions = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  const userId = req.user._id;

  const submissions = await SpeakingSubmission.find({
    challenge: challengeId,
    user: userId
  })
    .sort({ attemptNumber: -1 })
    .limit(10);

  return res.status(200).json(new ApiResponse(200, {
    submissions
  }, 'User submissions retrieved successfully'));
});

//----------------
// Get leaderboard for a speaking challenge
//----------------
export const getChallengeLeaderboard = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  const { limit = 10 } = req.query;

  const leaderboard = await SpeakingSubmission.aggregate([
    { $match: { challenge: mongoose.Types.ObjectId(challengeId) } },
    { $sort: { totalScore: -1, createdAt: 1 } },
    {
      $group: {
        _id: '$user',
        bestScore: { $first: '$totalScore' },
        bestAttempt: { $first: '$$ROOT' }
      }
    },
    { $sort: { bestScore: -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { $unwind: '$userInfo' },
    {
      $project: {
        userId: '$_id',
        username: '$userInfo.username',
        fullName: '$userInfo.fullName',
        avatar: '$userInfo.avatar',
        score: '$bestScore',
        attemptNumber: '$bestAttempt.attemptNumber',
        submittedAt: '$bestAttempt.createdAt'
      }
    }
  ]);

  return res.status(200).json(new ApiResponse(200, {
    leaderboard
  }, 'Leaderboard retrieved successfully'));
});

//----------------
// Helper Functions
//----------------

function calculateSpeakingScores(transcript, expectedResponse) {
  if (!transcript || !expectedResponse) {
    return {
      pronunciation: 0,
      fluency: 0,
      accuracy: 0,
      totalScore: 0
    };
  }

  const t1 = transcript.toLowerCase().trim();
  const t2 = expectedResponse.toLowerCase().trim();

  // Exact match
  if (t1 === t2) {
    return {
      pronunciation: 100,
      fluency: 100,
      accuracy: 100,
      totalScore: 100
    };
  }

  // Word-level comparison
  const words1 = t1.split(/\s+/).filter(Boolean);
  const words2 = t2.split(/\s+/).filter(Boolean);

  // Accuracy: percentage of correct words
  const correctWords = words1.filter(w => words2.includes(w)).length;
  const accuracy = Math.round((correctWords / Math.max(words2.length, 1)) * 100);

  // Fluency: based on word count similarity
  const wordCountRatio = Math.min(words1.length, words2.length) / Math.max(words1.length, words2.length, 1);
  const fluency = Math.round(wordCountRatio * 100);

  // Pronunciation: Levenshtein-based similarity
  const pronunciation = calculateLevenshteinSimilarity(t1, t2);

  // Total score: weighted average
  const totalScore = Math.round(
    (pronunciation * 0.4) + (fluency * 0.3) + (accuracy * 0.3)
  );

  return {
    pronunciation,
    fluency,
    accuracy,
    totalScore
  };
}

function calculateLevenshteinSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return Math.round((1 - distance / maxLen) * 100);
}

function calculateXP(score, difficulty, basePoints) {
  const difficultyMultiplier = {
    beginner: 1.0,
    intermediate: 1.5,
    advanced: 2.0
  };

  const multiplier = difficultyMultiplier[difficulty] || 1.0;
  return Math.round((score / 100) * basePoints * multiplier);
}

function generateFeedback(score, difficulty) {
  if (score >= 90) {
    return 'Excellent! Your pronunciation is nearly perfect! 🎉';
  } else if (score >= 75) {
    return 'Great job! You\'re speaking clearly with good pronunciation. 👍';
  } else if (score >= 60) {
    return 'Good effort! Keep practicing to improve your fluency. 📚';
  } else if (score >= 40) {
    return 'Nice try! Focus on the pronunciation and try again. 💪';
  } else {
    return 'Keep practicing! Listen to the example and try to match it closely. 🔄';
  }
}
