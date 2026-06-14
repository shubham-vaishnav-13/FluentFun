import { asyncHandler } from '../utils/async.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { WritingChallenge } from '../models/writingChallenge.models.js';
import { Language } from '../models/language.models.js';


//----------------
// get all writing challages
//----------------

export const listWritingChallenges = asyncHandler(async (req, res) => {
  const { category, difficulty, page = 1, limit = 10, language } = req.query;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;

  const query = { isActive: true };
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;
  if (language) query.language = String(language).toLowerCase();

  const [challenges, total] = await Promise.all([
    WritingChallenge.find(query)
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum),
    WritingChallenge.countDocuments(query)
  ]);

  return res.status(200).json(new ApiResponse(200, {
    challenges,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    total
  }, 'Writing challenges retrieved successfully'));
});


//----------------
// get vavailbale languages
//----------------

export const getAvailableLanguages = asyncHandler(async (req, res) => {
  const activeLangs = await WritingChallenge.distinct('language', { isActive: true });
  let codes = activeLangs.map(l => String(l).toLowerCase());

  if (Array.isArray(req.user?.preferredLanguages) && req.user.preferredLanguages.length) {
    const preferred = req.user.preferredLanguages.map(l => l.toLowerCase());
    const inter = codes.filter(c => preferred.includes(c));
    if (inter.length) codes = inter;
  }

  const languageDocs = await Language.find({ code: { $in: codes } }).select('code name').lean();
  const nameMap = new Map(languageDocs.map(l => [l.code.toLowerCase(), l.name]));
  const payload = codes.sort().map(code => ({ code, name: nameMap.get(code) || code }));

  return res.status(200).json(new ApiResponse(200, { languages: payload }, 'Available writing challenge languages'));
});


//----------------
// get paricular challange
//----------------

export const getWritingChallengeById = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  const challenge = await WritingChallenge.findOne({ _id: challengeId, isActive: true }).populate('createdBy', 'username fullName');
  if (!challenge) throw new ApiError(404, 'Writing challenge not found');
  return res.status(200).json(new ApiResponse(200, challenge, 'Writing challenge retrieved successfully'));
});
