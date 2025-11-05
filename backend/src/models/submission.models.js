import mongoose, { Schema } from "mongoose";

const categoryScoreSchema = new Schema(
  {
    key: { type: String, required: true, trim: true }, // normalized rubric name
    label: { type: String, trim: true },
    rawScore: { type: Number, required: true, min: 0, max: 100 },
    weight: { type: Number, required: true, min: 0, max: 100 },
    weightedScore: { type: Number, required: true, min: 0 }, // rawScore * (weight/100)
    comment: { type: String, trim: true, maxlength: 4000 },
  },
  { _id: false }
);

const submissionSchema = new Schema(
  {
    challenge: {
      type: Schema.Types.ObjectId,
      ref: "WritingChallenge",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    attemptNumber: { type: Number, required: true }, // 1-based per (challenge,user)
    text: { type: String, required: true, trim: true, maxlength: 20000 },
    wordCount: { type: Number, required: true, min: 1 },
    scores: [categoryScoreSchema],
    totalScore: { type: Number, required: true, min: 0, max: 100, index: true },
    // XP awarded for this submission (computed at creation). Allows historical tracking & UI display.
    xpAwarded: { type: Number, required: true, min: 0, default: 0 },
    feedback: { type: String, trim: true, maxlength: 20000 },
    aiModel: { type: String, trim: true },
    rawAIResponse: { type: Schema.Types.Mixed }, // optional full AI JSON
    processingTimeMs: { type: Number },
  },
  { timestamps: true }
);

// Unique attempt constraint per user+challenge+attemptNumber
submissionSchema.index(
  { challenge: 1, user: 1, attemptNumber: 1 },
  { unique: true }
);
// Leaderboard style index
submissionSchema.index({ challenge: 1, totalScore: -1, createdAt: 1 });

export const Submission = mongoose.model("Submission", submissionSchema);
