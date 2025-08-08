import { asyncHandler } from "../utils/async.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
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
    await user.save({ validateBeforeSave: false }); // Fixed typo: validareBeforeSave -> validateBeforeSave
    return { accessToken, refreshToken }; // Fixed typo: accesToken -> accessToken
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

  if (!profileImagePath) {
    throw new ApiError(400, "Profile image is required");
  }

  const profileImage = await uploadOnClodinary(profileImagePath);

  if (!profileImage || !profileImage.url) {
    throw new ApiError(500, "Failed to upload profile image");
  }

  try {
    const user = await User.create({
      fullName,
      profileImage: profileImage.url,
      email,
      password,
      username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      // If user creation seems to fail after the fact, delete the uploaded image
      await deleteFromCloudinary(profileImage.public_id);
      throw new ApiError(500, "Something went wrong while registering user");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));

  } catch (error) {
    // If any error occurs during user creation, delete the uploaded profile image
    if (profileImage?.public_id) {
        await deleteFromCloudinary(profileImage.public_id);
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

  if ((!email && !username) || !password) {
    throw new ApiError(400, "Email or username and password are required ...");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found ...");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password ...");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  if (!loggedInUser) {
    throw new ApiError(500, "Something went wrong while logging in ...");
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  // add for frontend validation
  // Clear cookies for access and refresh tokens
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully..."));
});

export { registerUser, loginUser, logoutUser };
