import { asyncHandler } from "../utils/async.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { QuizAttempt } from "../models/quizAttempt.models.js";
import {
  uploadOnClodinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId); // Fixed: was User.find(userId)
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); 
    return { accessToken, refreshToken }; 
  } catch (error) {
    throw new ApiError(500, "Failed to generate access and refresh tokens");
  }
};

/*  
    ===========================
        Register User
    ===========================
*/

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;

  // Validation
  if ([username, email, fullName, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const profileImagePath = req.files?.profileImage?.[0]?.path;
  let uploadedImage = null;
  if (profileImagePath) {
    uploadedImage = await uploadOnClodinary(profileImagePath);
    if (!uploadedImage || !uploadedImage.url) {
      throw new ApiError(500, "Failed to upload profile image");
    }
  }

  try {
    const user = await User.create({
      fullName,
      profileImage: uploadedImage?.url || process.env.DEFAULT_AVATAR_URL,
      email,
      password,
      username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      // If user creation seems to fail after the fact, delete the uploaded image
      if (uploadedImage?.public_id) {
        await deleteFromCloudinary(uploadedImage.public_id);
      }
      throw new ApiError(500, "Something went wrong while registering user");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));

  } catch (error) {
    // If any error occurs during user creation, delete the uploaded profile image
    if (uploadedImage?.public_id) {
      await deleteFromCloudinary(uploadedImage.public_id);
    }
    // Duplicate key (username/email)
    if (error?.code === 11000) {
      throw new ApiError(409, "User with email or username already exists");
    }
    // Mongoose validation error
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message).join(', ');
      throw new ApiError(400, messages || 'Invalid input');
    }
    // Re-throw the error to be handled by the global error handler
    throw new ApiError(500, error.message || "Something went wrong while registering the user");
  }
});


/*  
    ===========================
        Login User
    ===========================
*/


const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  
  // login attempt

  if ((!email && !username) || !password) {
    throw new ApiError(400, "Email or username and password are required ...");
  }

  // Build query conditions properly - only include fields that have values
  const queryConditions = [];
  if (email) queryConditions.push({ email });
  if (username) queryConditions.push({ username });
  
  // query conditions prepared


  const user = await User.findOne({
    $or: queryConditions,
  });

  // user search result


  const isPasswordValid = await user.isPasswordCorrect(password);
  // password validated
  
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password ...");
  }

  // login successful
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  // Update last login time
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  if (!loggedInUser) {
    throw new ApiError(500, "Something went wrong while logging in ...");
  }

  const isProd = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure: isProd,
    // Cross-site cookies (frontend on Vercel, backend on Render) require SameSite=None
    sameSite: isProd ? 'none' : 'lax'
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully..."
      )
    );
});

/*  
    ===========================
        Logout User
    ===========================
*/

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 }, // Fixed: $set with undefined -> $unset
    },
    { new: true }
  );

  const isProd = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  };

  // add for frontend validation
  // Clear cookies for access and refresh tokens
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully..."));
});

/*  
    ===========================
        Get Current User
    ===========================
*/

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select("-password -refreshToken");
  
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  
  return res.status(200).json(
    new ApiResponse(200, user, "Current user fetched successfully")
  );
});

// exports consolidated at end of file (including updateProfile)

/*
  Update current user's profile (multipart/form-data supported)
  Accepts optional fields: fullName, email, username, profileImage (file), preferredLanguages (comma separated or array)
*/
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const allowedFields = ['fullName', 'email', 'username', 'preferredLanguages'];
  const updates = {};

  // Parse preferredLanguages if provided as string
  if (req.body.preferredLanguages) {
    try {
      const raw = req.body.preferredLanguages;
      if (Array.isArray(raw)) {
        updates.preferredLanguages = raw.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof raw === 'string') {
        // Try to parse JSON array (frontend may send JSON.stringify(array))
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch (e) {
          parsed = null;
        }
        if (Array.isArray(parsed)) {
          updates.preferredLanguages = parsed.map(s => String(s).trim()).filter(Boolean);
        } else {
          // Fallback: comma or whitespace separated string
          updates.preferredLanguages = String(raw).split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
        }
      } else {
        updates.preferredLanguages = [];
      }
    } catch (e) {
      updates.preferredLanguages = [];
    }
  }

  for (const field of allowedFields) {
    if (req.body[field] && field !== 'preferredLanguages') {
      updates[field] = req.body[field];
    }
  }

  // Handle profile image upload
  const profileImagePath = req.files?.profileImage?.[0]?.path;
  let uploadedImage = null;
  if (profileImagePath) {
    uploadedImage = await uploadOnClodinary(profileImagePath);
    if (!uploadedImage || !uploadedImage.url) {
      throw new ApiError(500, 'Failed to upload profile image');
    }
    updates.profileImage = uploadedImage.url;
  }

  // If email/username are being updated, ensure uniqueness
  if (updates.email) {
    const other = await User.findOne({ email: updates.email, _id: { $ne: userId } });
    if (other) throw new ApiError(409, 'Email already in use');
  }
  if (updates.username) {
    const other = await User.findOne({ username: updates.username, _id: { $ne: userId } });
    if (other) throw new ApiError(409, 'Username already in use');
  }

  const updated = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password -refreshToken');
  if (!updated) throw new ApiError(500, 'Failed to update profile');

  return res.status(200).json(new ApiResponse(200, updated, 'Profile updated successfully'));
});

// (intermediate export removed to avoid duplication)

/*
  ===========================
      Leaderboard (XP based)
  ===========================
  GET /api/users/leaderboard?limit=50&days=30

*/

const getLeaderboard = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const days = parseInt(req.query.days) || null;

  // Base match: active non-admin users only
  const match = { isActive: true, isAdmin: { $ne: true } };

  // Build aggregation on User collection (xp already indexed)
  const pipeline = [
    { $match: match },
    { $project: { fullName: 1, username: 1, profileImage: 1, xp: 1 } },
    { $sort: { xp: -1, _id: 1 } },
    { $limit: limit }
  ];

  const topUsers = await User.aggregate(pipeline);

  // Map ranks
  topUsers.forEach((u, idx) => { u.rank = idx + 1; });

  let currentUserRank = null;
  if (req.user?._id) {
    // If current user not in top list, compute their rank separately (count users with higher xp)
    const inTop = topUsers.find(u => String(u._id) === String(req.user._id));
    if (inTop) {
      currentUserRank = inTop.rank;
    } else {
      const userDoc = await User.findById(req.user._id).select('xp fullName username profileImage');
      if (userDoc && !userDoc.isAdmin) { // only rank non-admin users
        const higherCount = await User.countDocuments({ isActive: true, isAdmin: { $ne: true }, xp: { $gt: userDoc.xp } });
        currentUserRank = higherCount + 1;
        topUsers.push({ ...userDoc.toObject(), rank: currentUserRank });
      }
    }
  }

  return res.status(200).json(new ApiResponse(200, { leaderboard: topUsers, currentUserRank }, 'Leaderboard fetched successfully'));
});

// Final exports (single consolidated)
export { registerUser, loginUser, logoutUser, getCurrentUser, updateProfile, getLeaderboard };

