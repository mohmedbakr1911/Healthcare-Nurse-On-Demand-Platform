const GoogleStrategy = require("passport-google-oauth20").Strategy;

module.exports = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    // Here, you find or create the user in your DB
    return done(null, profile);
  }
);
