const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Google Strategy (only)
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this googleId
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          // Check if a user exists with the same email (maybe local account)
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            await user.save();
          } else {
            // Create new user
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              avatar: profile.photos?.[0]?.value || '',
            });
          }
        }
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Serialize user for session (needed for Passport's OAuth flow)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
