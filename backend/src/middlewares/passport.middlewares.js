import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from '../models/user.models.js'
import dotenv from 'dotenv';

dotenv.config({
    path: './.env',
    quiet: true
});
//http://localhost:3000/api/auth/google/callback
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/api/auth/google/callback", // Change to relative path
            scope: ["profile", "email"]
        },
        async (accessToken, refreshToken, profile, done) => {
            // This function is called after the user authenticates with Google
            try {
                // 1. Check if a user with this Google ID already exists
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    // If user exists, log them in
                    return done(null, user);
                }

                // 2. If not, check if a user with that email exists
                user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    // If user with email exists, link their Google ID
                    user.googleId = profile.id;
                    await user.save();
                    return done(null, user);
                }

                // 3. If no user exists, create a new user
                const newUser = new User({
                    googleId: profile.id,
                    fullName: profile.displayName,
                    email: profile.emails[0].value,
                    profileImage: profile.photos[0].value,
                    // Generate a random username or handle it as you see fit
                    username: profile.emails[0].value.split("@")[0] + Math.floor(Math.random() * 1000),
                });

                await newUser.save();
                return done(null, newUser);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

export default passport;