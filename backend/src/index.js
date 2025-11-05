import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { app } from "./app.js";
import connectDB from "./db/index.js";

// Ensure .env is loaded from backend/.env regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Startup diagnostics for AI config (safe output)

const PORT = process.env.PORT || 8001;

connectDB().then(() => {
  app.listen(PORT, () => {
    // server started
    console.log(`MongoDb Started !!`)
  });
}).catch((err)=>{
    console.error("MongoDb Connection Error", err);
    
})