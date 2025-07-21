import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { DB_NAME } from '../constant.js';

dotenv.config({
    path: './.env',
    quiet: true
});

const connectDB = async () => {
    try {
        // console.log("MONGODB_URI:", process.env.MONGODB_URI);
        // console.log("DB_NAME:", DB_NAME);
        
        const connectionString = `${process.env.MONGODB_URI}/${DB_NAME}`;
        // console.log("Full connection string:", connectionString);
        
        const connectionInstance = await mongoose.connect(connectionString);
        console.log(`\n MongoDb Connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDb Connection Error", error);
        process.exit(1);
    }
}

export default connectDB;