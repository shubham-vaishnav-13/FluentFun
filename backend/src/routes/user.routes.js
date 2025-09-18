import {Router } from "express";
import { registerUser, loginUser, logoutUser, getCurrentUser, updateProfile, getLeaderboard } from "../controllers/user.controllers.js";

import {verifyJWT} from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
import passport from "../middlewares/passport.middlewares.js";

const router = Router();
// unsecured routes - these routes can be accessed without authentication


router.route("/register").post(
    upload.fields([
        {
            name : "profileImage",
            maxCount : 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)


// Google OAuth routes moved to auth.routes.js

// secured routes - these routes can only be accessed with authentication
router.route("/logout").get(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/me").patch(verifyJWT, upload.fields([{ name: 'profileImage', maxCount: 1 }]), updateProfile);

// Leaderboard (requires auth for now to personalize rank)
router.route('/leaderboard').get(verifyJWT, getLeaderboard);

// 981
export default router;