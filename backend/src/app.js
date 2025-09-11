import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import passport from "./middlewares/passport.middlewares.js"; // Import passport


const app = express();
app.use(express.json());

// CORS middleware (dev-friendly defaults)
const rawOrigins = process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174"; // Vite default + backup port
const allowedOrigins = rawOrigins
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl/Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// common middleware
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))

// use cookies
app.use(cookieParser())

app.use(passport.initialize());



// routes

// import healthcheckRouter from "./routes/healthcheck.routes.js"
import userRouter from "./routes/user.routes.js"
import authRouter from "./routes/auth.routes.js"
import adminRouter from "./routes/admin.routes.js"
import contentRouter from "./routes/content.routes.js"
// import { errorHandler } from "./middlewares/error.middleares.js";

// app.use("/api/v1/healthcheck",healthcheckRouter)
app.use("/api/v1/users",userRouter)
app.use("/api/v1/admin",adminRouter)
app.use("/api/v1/content",contentRouter)

// Special route for Google OAuth
app.use("/api/auth", authRouter)


// Global error handler (simple)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ success: false, message });
});
export { app };
