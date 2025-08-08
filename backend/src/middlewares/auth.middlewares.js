import jwt from 'jsonwebtoken';
import {User} from '../models/user.models.js';
import {ApiError} from '../utils/ApiError.js';
import {asyncHandler} from '../utils/async.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies.accessToken || req.headers("Authorization")?.replace("Bearer ", "");
    if (!token) {
        throw new ApiError(401, "You are not authenticated!");
    }
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
       // console.log("Decoded JWT:", decoded);
        const user = await User.findById(decoded._id);
       // console.log("User found:", user);
        if (!user) {
            throw new ApiError(401, "User not found!");
        }

        req.user = user;
        next(); // transfer to controller
    } catch (error) {
        throw new ApiError(401,error?.message || "Token is not valid!");
    }
})