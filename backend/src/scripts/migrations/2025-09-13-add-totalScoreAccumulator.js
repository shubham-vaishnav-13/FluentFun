// Migration: Backfill totalScoreAccumulator & recompute averageScore from submissions
// Usage (powershell):
// node -r dotenv/config ./src/scripts/migrations/2025-09-13-add-totalScoreAccumulator.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { WritingChallenge } from '../../models/writingChallenge.models.js';
import { Submission } from '../../models/submission.models.js';

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    console.error('Missing MONGODB_URI or DATABASE_URL env var');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const challenges = await WritingChallenge.find({}, {
    _id: 1,
    attemptsCount: 1,
    averageScore: 1,
    totalScoreAccumulator: 1
  });
  console.log(`Found ${challenges.length} challenges`);

  for (const ch of challenges) {
    let changed = false;

    // Recompute from submissions always for accuracy
    const subs = await Submission.find({ challenge: ch._id }).select('totalScore');
    if (subs.length) {
      const sum = subs.reduce((a, s) => a + (s.totalScore || 0), 0);
      const attempts = subs.length;
      const avg = attempts ? +(sum / attempts).toFixed(2) : 0;

      if (ch.totalScoreAccumulator !== sum || ch.attemptsCount !== attempts || ch.averageScore !== avg) {
        ch.totalScoreAccumulator = +sum.toFixed(2);
        ch.attemptsCount = attempts;
        ch.averageScore = avg;
        changed = true;
      }
    } else {
      // No submissions
      if (!ch.totalScoreAccumulator) {
        ch.totalScoreAccumulator = 0;
        changed = true;
      }
      if (ch.attemptsCount !== 0) {
        ch.attemptsCount = 0;
        changed = true;
      }
      if (ch.averageScore !== 0) {
        ch.averageScore = 0;
        changed = true;
      }
    }

    if (changed) {
      await ch.save();
      console.log(`Updated challenge ${ch._id}: attempts=${ch.attemptsCount} avg=${ch.averageScore} totalAcc=${ch.totalScoreAccumulator}`);
    }
  }

  await mongoose.disconnect();
  console.log('Migration complete');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
