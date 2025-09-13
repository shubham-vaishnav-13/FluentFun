import mongoose, { Schema } from "mongoose";

const questionSchema = new Schema({
    question: {
        type: String,
        required: true,
        trim: true,
    },
    options: [{
        type: String,
        required: true,
        trim: true,
    }],
    correctAnswer: {
        type: Number,
        required: true,
        min: 0,
        max: 3,
    },
    explanation: {
        type: String,
        trim: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },
    points: {
        type: Number,
        default: 10,
    },
});

const quizSchema = new Schema(
    {
        // Specific language code for the quiz (ISO-like short codes)
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
        category: {
            type: String,
            required: true,
            enum: ['grammar', 'vocabulary', 'reading', 'listening', 'mixed'],
            index: true,
        },
        difficulty: {
            type: String,
            required: true,
            enum: ['beginner', 'intermediate', 'advanced'],
            index: true,
        },
        timeLimit: {
            type: Number, // in minutes
            required: true,
            min: 1,
        },
        questions: [questionSchema],
        totalPoints: {
            type: Number,
            default: 0,
        },
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
        // Sequence (level) ordering within a given language + difficulty track
        sequence: {
            type: Number,
            default: 1,
            min: 1,
            index: true,
        },
        // Minimum percentage score required to unlock the next sequence quiz
        minScoreToUnlockNext: {
            type: Number,
            default: 60, // 60%
            min: 0,
            max: 100,
        },
    },
    { timestamps: true }
);

// Calculate total points before saving
quizSchema.pre('save', function(next) {
    if (this.questions && this.questions.length > 0) {
        this.totalPoints = this.questions.reduce((total, question) => total + question.points, 0);
    }
    next();
});

// Index for searching
quizSchema.index({ title: 'text', description: 'text', tags: 'text' });
// Compound index to speed up language+difficulty active quiz filtering
quizSchema.index({ language: 1, difficulty: 1, isActive: 1 });
// Index for progression ordering queries
quizSchema.index({ language: 1, difficulty: 1, sequence: 1 });

// Human friendly language name virtual
const LANGUAGE_MAP = {
    en: 'English',
    hi: 'Hindi',
    gu: 'Gujarati',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
};

quizSchema.virtual('languageName').get(function () {
    return LANGUAGE_MAP[this.language] || this.language || 'Unknown';
});

export const Quiz = mongoose.model("Quiz", quizSchema);
