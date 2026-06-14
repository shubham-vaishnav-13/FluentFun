import dotenv from 'dotenv';
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: './.env',
    quiet: true
});

const PORT = process.env.PORT || 8001;

connectDB() // mongo connct mate

app.listen(PORT, () => {
  console.log(`MongoDb Started !! running on ${PORT}`)
});
