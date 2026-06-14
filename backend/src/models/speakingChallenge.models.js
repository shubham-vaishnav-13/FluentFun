import mongoose, { Schema } from "mongoose";

const speakingChallengeSchema = new Schema(
    {
        language: {
            type: String,
            required: true,
            enum: ['en', 'hi', 'gu', 'fr', 'es', 'de'],
            default: 'en',
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        prompt: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        expectedResponse: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        category: {
            type: String,
            required: true,
            enum: ['pronunciation', 'conversation', 'vocabulary', 'grammar', 'fluency'],
            default: 'pronunciation',
        },
        difficulty: {
            type: String,
            required: true,
            enum: ['beginner', 'intermediate', 'advanced'],
            default: 'beginner',
        },
        points: {
            type: Number,
            required: true,
            default: 50,
            min: 10,
            max: 500,
        },
        audioUrl: {
            type: String,
            trim: true,
        },
        hints: {
            type: [String],
            default: [],
        },
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
speakingChallengeSchema.index({ language: 1, difficulty: 1, isActive: 1 });
speakingChallengeSchema.index({ category: 1, isActive: 1 });

export const SpeakingChallenge = mongoose.model('SpeakingChallenge', speakingChallengeSchema);
