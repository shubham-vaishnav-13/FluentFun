import { Router } from "express";
import passport from "../middlewares/passport.middlewares.js";

const router = Router();

// Route to start the Google authentication process
router.route("/google").get(
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Route that Google redirects to after successful authentication
router.route("/google/callback").get(
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
  }),
  (req, res) => {
    try {
      // After successful authentication, Passport attaches the user to req.user
      const accessToken = req.user.generateAccessToken();
      const refreshToken = req.user.generateRefreshToken();
      
      // Save the refresh token to the user document
      req.user.refreshToken = refreshToken;
      req.user.save({ validateBeforeSave: false });
      
      // Redirect to frontend with tokens
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
      res.redirect(`${frontendURL}/oauth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    } catch (error) {
      console.error("Error in Google callback:", error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=authentication_failed`);
    }
  }
);

export default router;
