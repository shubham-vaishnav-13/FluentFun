import jwt from 'jsonwebtoken';
import {User} from '../models/user.models.js';
import {ApiError} from '../utils/ApiError.js';
import {asyncHandler} from '../utils/async.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "") || req.headers?.["Authorization"]?.replace("Bearer ", "");
    if (!token) {
        throw new ApiError(401, "You are not authenticated!");
    }
    try {
        console.log("Verifying token:", token.substring(0, 15) + "...");
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("Decoded JWT:", decoded._id);
        
        const user = await User.findById(decoded._id);
        if (!user) {
            console.error("User not found for ID:", decoded._id);
            throw new ApiError(401, "User not found!");
        }
        
        console.log("Authentication successful for user:", user.email || user.username);
        req.user = user;
        next(); // transfer to controller
    } catch (error) {
        console.error("JWT Verification failed:", error.message);
        throw new ApiError(401, error?.message || "Token is not valid!");
    }
})