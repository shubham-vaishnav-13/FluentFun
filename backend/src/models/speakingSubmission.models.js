import mongoose, { Schema } from "mongoose";

const speakingSubmissionSchema = new Schema(
  {
    challenge: {
      type: Schema.Types.ObjectId,
      ref: "SpeakingChallenge",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    attemptNumber: { 
      type: Number, 
      required: true 
    },
    audioUrl: {
      type: String,
      required: true,
      trim: true,
    },
    transcript: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    duration: {
      type: Number, // in seconds
      min: 0,
    },
    pronunciationScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    fluencyScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    accuracyScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    totalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    xpAwarded: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    processingTimeMs: {
      type: Number,
    },
  },
  { 
    timestamps: true 
  }
);

// Unique attempt constraint per user+challenge+attemptNumber
speakingSubmissionSchema.index(
  { challenge: 1, user: 1, attemptNumber: 1 },
  { unique: true }
);

// Leaderboard style index
speakingSubmissionSchema.index({ challenge: 1, totalScore: -1, createdAt: 1 });

export const SpeakingSubmission = mongoose.model("SpeakingSubmission", speakingSubmissionSchema);
