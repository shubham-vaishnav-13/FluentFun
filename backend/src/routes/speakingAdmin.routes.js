import { Router } from 'express';
import {
  adminListSpeakingChallenges,
  adminCreateSpeakingChallenge,
  adminUpdateSpeakingChallenge,
  adminDeleteSpeakingChallenge,
} from '../controllers/speakingAdmin.controllers.js';

const router = Router();

// All routes here are already protected by verifyJWT + verifyAdmin from admin.routes.js

router.route('/').get(adminListSpeakingChallenges).post(adminCreateSpeakingChallenge);
router.route('/:id').patch(adminUpdateSpeakingChallenge).delete(adminDeleteSpeakingChallenge);

export default router;
