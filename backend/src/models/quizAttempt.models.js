import mongoose, { Schema } from 'mongoose';

const quizAttemptSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  attemptNumber: { type: Number, required: true, min: 1, index: true },
  score: { type: Number, required: true, min: 0 }, // percentage score (0-100)
  correct: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 1 },
  timeTaken: { type: Number, required: true, min: 0 }, // seconds actually used
  answers: [{
    questionIndex: { type: Number, required: true },
    selected: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true }
  }]
}, { timestamps: true });

// Helpful indexes for queries
quizAttemptSchema.index({ user: 1, quiz: 1, createdAt: -1 });
quizAttemptSchema.index({ user: 1, quiz: 1, attemptNumber: 1 }, { unique: true });

export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
