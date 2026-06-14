import {Router } from "express";
import { registerUser, loginUser, logoutUser, getCurrentUser, updateProfile, getLeaderboard } from "../controllers/user.controllers.js";

import {verifyJWT} from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
import passport from "../middlewares/passport.middlewares.js";

const router = Router();
router.route("/register").post(
    upload.fields([
        {
            name : "profileImage",
            maxCount : 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

router.route("/logout").get(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser); // getting data
router.route("/me").patch(verifyJWT, upload.fields([{ name: 'profileImage', maxCount: 1 }]), updateProfile); // update user data
router.route('/leaderboard').get(verifyJWT, getLeaderboard);

export default router;