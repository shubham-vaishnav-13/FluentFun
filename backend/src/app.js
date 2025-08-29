import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
const app = express();
app.use(express.json());

// CORS middleware (dev-friendly defaults)
const rawOrigins = process.env.CORS_ORIGIN || "http://localhost:5173"; // Vite default
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

// routes

// import healthcheckRouter from "./routes/healthcheck.routes.js"
import userRouter from "./routes/user.routes.js"
// import { errorHandler } from "./middlewares/error.middleares.js";

// app.use("/api/v1/healthcheck",healthcheckRouter)
app.use("/api/v1/users",userRouter)


// Global error handler (simple)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ success: false, message });
});
export { app };
