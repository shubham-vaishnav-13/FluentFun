import { asyncHandler } from '../utils/async.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { SpeakingChallenge } from '../models/speakingChallenge.models.js';

// GET /api/v1/admin/speaking-challenges
export const adminListSpeakingChallenges = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, language, difficulty, category } = req.query;
  const pageNum = Number(page) || 1;
  const limitNum = Math.min(Number(limit) || 100, 200);

  const query = {};
  if (language) query.language = language.toLowerCase();
  if (difficulty) query.difficulty = difficulty;
  if (category) query.category = category;

  const [challenges, total] = await Promise.all([
    SpeakingChallenge.find(query)
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum),
    SpeakingChallenge.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { challenges, total, page: pageNum }, 'Speaking challenges retrieved')
  );
});

// POST /api/v1/admin/speaking-challenges
export const adminCreateSpeakingChallenge = asyncHandler(async (req, res) => {
  const {
    language, title, description, prompt, expectedResponse,
    category, difficulty, points, hints, tags, isActive,
  } = req.body;

  if (!language || !title || !description || !prompt || !expectedResponse || !category || !difficulty) {
    throw new ApiError(400, 'language, title, description, prompt, expectedResponse, category, and difficulty are required');
  }

  const challenge = await SpeakingChallenge.create({
    language,
    title,
    description,
    prompt,
    expectedResponse,
    category,
    difficulty,
    points: points ?? 50,
    hints: hints ?? [],
    tags: tags ?? [],
    isActive: isActive !== false,
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, challenge, 'Speaking challenge created'));
});

// PATCH /api/v1/admin/speaking-challenges/:id
export const adminUpdateSpeakingChallenge = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const allowedFields = [
    'language', 'title', 'description', 'prompt', 'expectedResponse',
    'category', 'difficulty', 'points', 'hints', 'tags', 'isActive', 'audioUrl',
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const challenge = await SpeakingChallenge.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!challenge) throw new ApiError(404, 'Speaking challenge not found');

  return res.status(200).json(new ApiResponse(200, challenge, 'Speaking challenge updated'));
});

// DELETE /api/v1/admin/speaking-challenges/:id
export const adminDeleteSpeakingChallenge = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const challenge = await SpeakingChallenge.findByIdAndDelete(id);
  if (!challenge) throw new ApiError(404, 'Speaking challenge not found');

  return res.status(200).json(new ApiResponse(200, {}, 'Speaking challenge deleted'));
});
