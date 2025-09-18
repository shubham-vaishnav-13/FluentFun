import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middlewares.js';
import { createSubmission, listMySubmissions, challengeLeaderboard } from '../controllers/submission.controllers.js';

const router = Router();

// POST create a submission & evaluate
router.post('/challenges/:challengeId/submissions', verifyJWT, createSubmission);
// GET my submissions for a challenge
router.get('/challenges/:challengeId/submissions/mine', verifyJWT, listMySubmissions);
// GET leaderboard
router.get('/challenges/:challengeId/leaderboard', verifyJWT, challengeLeaderboard);

export default router;
