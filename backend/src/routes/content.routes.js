import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import * as quizController from "../controllers/quiz.controllers.js";
import * as writingChallengeController from "../controllers/writingChallenge.controllers.js";
import * as languageController from "../controllers/language.controllers.js";

const router = Router();

router.use(verifyJWT);

// Quiz routes
router.get('/quizzes', quizController.listQuizzes);
router.get('/quizzes/counts', quizController.getQuizCounts);
router.get('/quizzes/random', quizController.getRandomQuiz);
router.get('/quizzes/progression', quizController.getQuizProgression);
router.get('/quizzes/:quizId', quizController.getQuizById);
router.post('/quizzes/:quizId/attempt', quizController.attemptQuiz);
router.get('/quizzes/:quizId/next', quizController.getNextQuiz);

// Writing challenge routes
router.get('/writing-challenges', writingChallengeController.listWritingChallenges);
router.get('/writing-challenges/languages/available', writingChallengeController.getAvailableLanguages);
router.get('/writing-challenges/:challengeId', writingChallengeController.getWritingChallengeById);

// Language routes
router.get('/languages', languageController.listLanguages);

export default router;
