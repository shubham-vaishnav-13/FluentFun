import mongoose, { Schema } from "mongoose";

const rubricCriteriaSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    weight: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    description: {
        type: String,
        trim: true,
    },
});

const writingChallengeSchema = new Schema(
    {
        // Specific language code for the writing challenge (ISO-like short codes)
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
            enum: ['essay', 'creative', 'formal', 'informal', 'academic', 'business'],
            index: true,
        },
        difficulty: {
            type: String,
            required: true,
            enum: ['beginner', 'intermediate', 'advanced'],
            index: true,
        },
        wordLimit: {
            min: {
                type: Number,
                required: true,
                min: 50,
            },
            max: {
                type: Number,
                required: true,
                max: 2000,
            },
        },
        timeLimit: {
            type: Number, // in minutes
            required: true,
            min: 15,
            max: 180, // 3 hours
        },
        rubric: [rubricCriteriaSchema],
        keyPoints: [{
            type: String,
            trim: true,
        }],
        sampleResponse: {
            type: String,
            trim: true,
        },
        instructions: [{
            type: String,
            trim: true,
        }],
        tips: [{
            type: String,
            trim: true,
        }],
        targetVocabulary: [{
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

// Validation for rubric weights to sum to 100
writingChallengeSchema.pre('save', function(next) {
    if (this.rubric && this.rubric.length > 0) {
        const totalWeight = this.rubric.reduce((total, criteria) => total + criteria.weight, 0);
        if (totalWeight !== 100) {
            return next(new Error('Rubric criteria weights must sum to 100%'));
        }
    }
    next();
});

// Validation for word limits
writingChallengeSchema.pre('save', function(next) {
    if (this.wordLimit.min >= this.wordLimit.max) {
        return next(new Error('Minimum word limit must be less than maximum word limit'));
    }
    next();
});

// Index for searching
writingChallengeSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Human friendly language name virtual
const LANGUAGE_MAP = {
    en: 'English',
    hi: 'Hindi',
    gu: 'Gujarati',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
};

writingChallengeSchema.virtual('languageName').get(function () {
    return LANGUAGE_MAP[this.language] || this.language || 'Unknown';
});

export const WritingChallenge = mongoose.model("WritingChallenge", writingChallengeSchema);
