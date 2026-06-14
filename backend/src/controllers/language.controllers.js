import { asyncHandler } from '../utils/async.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Language } from '../models/language.models.js';


// get all languages

export const listLanguages = asyncHandler(async (req, res) => {
  const languages = await Language.find({ isActive: true }).select('code name').sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, languages, 'Languages retrieved successfully'));
});
