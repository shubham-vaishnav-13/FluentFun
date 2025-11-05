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
    generateQuizzesViaN8n,
    generateWritingChallengesViaN8n,
} from "../controllers/admin.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { verifyAdmin } from "../middlewares/admin.middlewares.js";
import { Quiz } from "../models/quiz.models.js";
import { WritingChallenge } from "../models/writingChallenge.models.js";
import { asyncHandler } from "../utils/async.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

// // Add debug route without auth for troubleshooting
// router.route("/debug").get(asyncHandler(async (req, res) => {
//     try {
//         // Count items in collections
//         const quizCount = await Quiz.countDocuments();
//         const writingCount = await WritingChallenge.countDocuments();
        
//         // Get one sample from each collection
//         const sampleQuiz = await Quiz.findOne().lean();
//         const sampleWriting = await WritingChallenge.findOne().lean();
        
//         // Get collection stats
//         const collections = {
//             quizzes: {
//                 count: quizCount,
//                 sample: sampleQuiz ? {
//                     id: sampleQuiz._id,
//                     title: sampleQuiz.title,
//                     questions: sampleQuiz.questions?.length || 0
//                 } : null
//             },
//             writingChallenges: {
//                 count: writingCount,
//                 sample: sampleWriting ? {
//                     id: sampleWriting._id,
//                     title: sampleWriting.title
//                 } : null
//             }
//         };
        
//         return res.status(200).json(new ApiResponse(200, { collections }, "Database debug info retrieved"));
//     } catch (err) {
//         return res.status(500).json({
//             success: false,
//             message: "Error checking database",
//             error: err.message
//         });
//     }
// }));

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

// Generators (n8n)
router.route('/generator/quizzes').post(generateQuizzesViaN8n);
router.route('/generator/writing').post(generateWritingChallengesViaN8n);

export default router;
