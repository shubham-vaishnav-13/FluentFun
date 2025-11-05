import dotenv from 'dotenv';
import mongoose from 'mongoose';
// Bring in models that need index synchronization
import { QuizAttempt } from '../models/quizAttempt.models.js';
import { DB_NAME } from '../constant.js';

dotenv.config({
    path: './.env',
    quiet: true
});

const connectDB = async () => {
    try {
        
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: DB_NAME
        });
    // DB connected

        try {
            await QuizAttempt.syncIndexes();
            // Indexes synchronized
        } catch (e) {
            console.error('[DB] QuizAttempt.syncIndexes failed:', e?.message || e);
        }
    } catch (error) {
        console.error("MongoDb Connection Error", error);
        process.exit(1);
    }
}

export default connectDB;