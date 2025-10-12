const GoogleStrategy = require("passport-google-oauth20").Strategy;

module.exports = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:
      "https://healthcarenurseondemand.vercel.app/api/users/google/callback",
  },
  (accessToken, refreshToken, profile, done) => {
    // Here, you find or create the user in your DB
    // console.log(profile);

    return done(null, profile);
  }
);
