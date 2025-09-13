import mongoose, { Schema } from "mongoose";

const languageSchema = new Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export const Language = mongoose.model("Language", languageSchema);