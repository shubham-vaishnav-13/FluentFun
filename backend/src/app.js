import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./middlewares/passport.middlewares.js"; 
import userRouter from "./routes/user.routes.js"
import authRouter from "./routes/auth.routes.js"
import adminRouter from "./routes/admin.routes.js"
import contentRouter from "./routes/content.routes.js"
import submissionRouter from "./routes/submission.routes.js"
import speakingChallengeRouter from "./routes/speakingChallenge.routes.js"

const app = express();
app.use(express.json());


// CORS middleware
const rawOrigins = process.env.CORS_ORIGIN || "https://fluentfun.vercel.app" || "http://localhost:5173"; 
const allowedOrigins = rawOrigins
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (process.env.ALLOW_VERCEL_PREVIEWS === 'true' && /https:\/\/.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
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

app.get("/", (req, res) => {
    res.json({ 
        message: "FluentFun API is running",
        status: "success",
        timestamp: new Date().toISOString()
    });
});


// routes


app.use("/api/v1/users",userRouter)
app.use("/api/v1/admin",adminRouter)
app.use("/api/v1/content",contentRouter)
app.use("/api/v1", submissionRouter)
app.use("/api/v1/speaking-challenges", speakingChallengeRouter)

// Special route for Google OAuth
app.use("/api/auth", authRouter)



// Global error handler (enhanced)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", {
    error: err,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?._id
  });

  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json({ 
    success: false, 
    message,
    ...(process.env.NODE_ENV !== 'production' && { detail: err.stack })
  });
});
export { app };
