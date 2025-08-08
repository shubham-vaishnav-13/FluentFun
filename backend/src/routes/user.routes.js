import {Router } from "express";
import { registerUser,loginUser,logoutUser } from "../controllers/user.controllers.js";

import {verifyJWT} from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";

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


// secured routes - these routes can only be accessed with authentication
router.route("/logout").get(verifyJWT, logoutUser);

// 981
export default router;