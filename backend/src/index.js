import { app } from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./.env",
  debug: false,
  quiet: true,
});

const PORT = process.env.PORT || 8001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is Running on port ${PORT}`);
  });
}).catch((err)=>{
    console.log("MongoDb Connection Error ");
    
})