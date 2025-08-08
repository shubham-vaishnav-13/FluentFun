import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
const app = express();
app.use(express.json());

// middleware
app.use(
    cors({
        origin : process.env.CORS_ORIGIN,
        credentials : true
    })
)

// common middleware
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))

// use cookies
app.use(cookieParser())

// routes

// import healthcheckRouter from "./routes/healthcheck.routes.js"
import userRouter from "./routes/user.routes.js"
// import { errorHandler } from "./middlewares/error.middleares.js";

// app.use("/api/v1/healthcheck",healthcheckRouter)
app.use("/api/v1/users",userRouter)


// app.use(errorHandler)
export { app };
