import { Router } from "express";
import {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    deleteUser,
    getAllQuizzes,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    getAllWritingChallenges,
    createWritingChallenge,
    updateWritingChallenge,
    deleteWritingChallenge,
} from "../controllers/admin.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { verifyAdmin } from "../middlewares/admin.middlewares.js";

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(verifyJWT, verifyAdmin);

// Dashboard
router.route("/dashboard/stats").get(getDashboardStats);

// User Management
router.route("/users").get(getAllUsers);
router.route("/users/:userId/status").patch(updateUserStatus);
router.route("/users/:userId").delete(deleteUser);

// Quiz Management
router.route("/quizzes").get(getAllQuizzes).post(createQuiz);
router.route("/quizzes/:quizId").patch(updateQuiz).delete(deleteQuiz);

// Writing Challenge Management
router.route("/writing-challenges").get(getAllWritingChallenges).post(createWritingChallenge);
router.route("/writing-challenges/:challengeId").patch(updateWritingChallenge).delete(deleteWritingChallenge);

export default router;
