// Migration: Recreate text index for WritingChallenge to disable language override
// Run: node ./src/scripts/migrations/2025-09-13-fix-writingChallenge-text-index.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../../db/index.js';
import { WritingChallenge } from '../../models/writingChallenge.models.js';

dotenv.config();

(async () => {
  try {
    await connectDB();
    console.log('[migration] Connected');

    const collection = mongoose.connection.collection('writingchallenges');
    const indexes = await collection.indexes();
    const textIdx = indexes.find(i => i.key && (i.key._fts === 'text' || Object.values(i.key).includes('text')));

    if (textIdx) {
      console.log('[migration] Dropping existing text index:', textIdx.name);
      await collection.dropIndex(textIdx.name);
    } else {
      console.log('[migration] No existing text index found (ok)');
    }

    // Ensure model (with new index definition) is registered
    await WritingChallenge.syncIndexes();
    console.log('[migration] New text index created with default_language:none');
  } catch (e) {
    console.error('[migration] Failed', e);
  } finally {
    await mongoose.disconnect();
    console.log('[migration] Disconnected');
  }
})();
