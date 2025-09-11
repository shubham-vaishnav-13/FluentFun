import mongoose, { Schema } from "mongoose";

const speakingChallengeSchema = new Schema(
    {
        // Specific language code for the speaking challenge (ISO-like short codes)
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
        },
        category: {
            type: String,
            required: true,
            enum: ['pronunciation', 'fluency', 'conversation', 'storytelling', 'presentation'],
            index: true,
        },
        difficulty: {
            type: String,
            required: true,
            enum: ['beginner', 'intermediate', 'advanced'],
            index: true,
        },
        timeLimit: {
            type: Number, // in seconds
            required: true,
            min: 30,
            max: 600, // 10 minutes
        },
        targetWords: [{
            type: String,
            trim: true,
        }],
        evaluationCriteria: {
            pronunciation: {
                type: Number,
                min: 0,
                max: 100,
                default: 25,
            },
            fluency: {
                type: Number,
                min: 0,
                max: 100,
                default: 25,
            },
            vocabulary: {
                type: Number,
                min: 0,
                max: 100,
                default: 25,
            },
            grammar: {
                type: Number,
                min: 0,
                max: 100,
                default: 25,
            },
        },
        sampleAudio: {
            type: String, // URL to sample audio file
        },
        instructions: [{
            type: String,
            trim: true,
        }],
        tips: [{
            type: String,
            trim: true,
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        tags: [{
            type: String,
            trim: true,
        }],
        attemptsCount: {
            type: Number,
            default: 0,
        },
        averageScore: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Validation for evaluation criteria to sum to 100
speakingChallengeSchema.pre('save', function(next) {
    const criteria = this.evaluationCriteria;
    const total = criteria.pronunciation + criteria.fluency + criteria.vocabulary + criteria.grammar;
    if (total !== 100) {
        return next(new Error('Evaluation criteria must sum to 100%'));
    }
    next();
});

// Index for searching
speakingChallengeSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Human friendly language name virtual
const LANGUAGE_MAP = {
    en: 'English',
    hi: 'Hindi',
    gu: 'Gujarati',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
};

speakingChallengeSchema.virtual('languageName').get(function () {
    return LANGUAGE_MAP[this.language] || this.language || 'Unknown';
});

export const SpeakingChallenge = mongoose.model("SpeakingChallenge", speakingChallengeSchema);
