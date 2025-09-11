import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        googleId: {
            type: String,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        profileImage: {
            type: String, // cloudinary url
            required: false,
            default: function () {
                return process.env.DEFAULT_AVATAR_URL || undefined;
            },
        },
        preferredLanguages: {
            type: [String],
            default: []
        },
        password: {
            type: String,
            //required: [true, "Password is required"],
        },
        refreshToken: {
            type: String,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Hash the password before saving
userSchema.pre("save", async function (next) {
    // Only hash password if it exists and was modified
    if (this.password && this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Compare the password - safely handle OAuth users who don't have passwords
userSchema.methods.isPasswordCorrect = async function (password) {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
};

// Generate access token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
            isAdmin: this.isAdmin,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = mongoose.model("User", userSchema);