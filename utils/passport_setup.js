const GoogleStrategy = require("passport-google-oauth20").Strategy;

module.exports = new GoogleStrategy (
  {
    clientID: process.env.GOOGLE_CLIENT_ID, 
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
    callbackURL: "/api/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    // Here, you find or create the user in your DB
    console.log(profile);
    pool.query(
    "INSERT INTO users (email, provider) VALUES ($1, $2) RETURNING *",
    [profile.emails[0].value, "google"]
  );
    return done(null, profile);
  }
)