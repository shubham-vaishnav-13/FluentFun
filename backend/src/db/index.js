import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { DB_NAME } from '../constant.js';

dotenv.config({
    path: './.env',
    quiet: true
});

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {dbName: DB_NAME});
    } catch (error) {
        console.error("MongoDb Connection Error", error);
        process.exit(1);
    }
}

export default connectDB;