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
            maxlength: 8000 // safeguard
        },
        category: {
            type: String,
            required: true,
            // Extended to support imported JSON variations
            enum: ['essay', 'creative', 'formal', 'informal', 'academic', 'business', 'descriptive', 'reflective', 'analytical'],
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
                max: 1800, // tighter constraint than absolute max if desired
                validate: {
                    validator: Number.isInteger,
                    message: 'wordLimit.min must be an integer'
                }
            },
            max: {
                type: Number,
                required: true,
                min: 100,
                max: 2000,
                validate: {
                    validator: Number.isInteger,
                    message: 'wordLimit.max must be an integer'
                }
            },
        },
        timeLimit: {
            type: Number, // in minutes
            required: true,
            min: 15,
            max: 180,
            validate: {
                validator: Number.isInteger,
                message: 'timeLimit must be an integer'
            }
        },
        rubric: [rubricCriteriaSchema],
        keyPoints: [{
            type: String,
            trim: true,
        }],
        sampleResponse: {
            type: String,
            trim: true,
            maxlength: 15000
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
            index: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        tags: [{
            type: String,
            trim: true,
            lowercase: true
        }],
        attemptsCount: {
            type: Number,
            default: 0,
        },
        averageScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        totalScoreAccumulator: { // sum of all submission total scores (0-100 scale)
            type: Number,
            default: 0,
            min: 0
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Replace dual pre('save') with a single pre('validate') for earlier error surfacing
writingChallengeSchema.pre('validate', function(next) {
    // Helper to build a mongoose-style ValidationError for consistency
    const buildValidationError = (message, path) => {
        const err = new mongoose.Error.ValidationError(this);
        err.addError(path || '_schema', new mongoose.Error.ValidatorError({ path: path || '_schema', message }));
        return err;
    };

    if (this.rubric && this.rubric.length > 0) {
        // Weight sum
        const totalWeight = this.rubric.reduce((total, c) => total + (c.weight || 0), 0);
        if (Math.abs(totalWeight - 100) > 0.0001) {
            return next(buildValidationError('Rubric criteria weights must sum to 100%', 'rubric'));
        }
        // Unique names (case-insensitive, trimmed)
        const names = this.rubric.map(r => (r.name || '').trim().toLowerCase());
        const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
        if (duplicates.length) {
            return next(buildValidationError('Rubric criteria names must be unique (case-insensitive)', 'rubric'));
        }
    }

    if (this.wordLimit?.min >= this.wordLimit?.max) {
        return next(buildValidationError('Minimum word limit must be less than maximum word limit', 'wordLimit'));
    }

    next();
});

// Weighted text index with field weights (optional refinement)
// Text index: disable built-in stemming for unsupported languages (Gujarati/Hindi) to avoid
// MongoServerError: language override unsupported. We set default_language 'none'.
writingChallengeSchema.index(
    { title: 'text', description: 'text', tags: 'text' },
    {
        weights: { title: 5, description: 2, tags: 1 },
        default_language: 'none',
        language_override: 'xLang' // no such field; prevents per-doc language override attempts
    }
);

// Compound query performance indexes
writingChallengeSchema.index({ language: 1, category: 1, difficulty: 1, isActive: 1 });
writingChallengeSchema.index({ isActive: 1, createdAt: -1 });

// Static helper to update scoring metrics atomically
writingChallengeSchema.statics.recordSubmissionScore = async function (challengeId, newScore) {
    // newScore expected 0-100
    const updated = await this.findOneAndUpdate(
        { _id: challengeId },
        { $inc: { attemptsCount: 1, totalScoreAccumulator: newScore } },
        { new: true, projection: { attemptsCount: 1, totalScoreAccumulator: 1 } }
    );
    if (updated) {
        const avg = updated.totalScoreAccumulator / updated.attemptsCount;
        await this.updateOne({ _id: challengeId }, { $set: { averageScore: +avg.toFixed(2) } });
    }
};

// Virtual (backfill approach if you add totalScoreAccumulator later)
writingChallengeSchema.virtual('calculatedAverage').get(function () {
    if (!this.attemptsCount) return 0;
    if (this.totalScoreAccumulator == null) return 0;
    return +(this.totalScoreAccumulator / this.attemptsCount).toFixed(2);
});

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
