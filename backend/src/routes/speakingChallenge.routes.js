import express from 'express';
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import { upload } from '../middlewares/multer.middlewares.js';
import {
  listSpeakingChallenges,
  getAvailableLanguages,
  getSpeakingChallengeById,
  submitSpeakingChallenge,
  getUserSubmissions,
  getChallengeLeaderboard,
} from '../controllers/speakingChallenge.controllers.js';

const router = express.Router();

// Public routes
router.get('/languages', getAvailableLanguages);
router.get('/', listSpeakingChallenges);
router.get('/:id', getSpeakingChallengeById);
router.get('/:challengeId/leaderboard', getChallengeLeaderboard);

// Protected routes (require authentication)
router.post('/submit', verifyJWT, upload.single('audio'), submitSpeakingChallenge);
router.get('/:challengeId/submissions', verifyJWT, getUserSubmissions);

export default router;
