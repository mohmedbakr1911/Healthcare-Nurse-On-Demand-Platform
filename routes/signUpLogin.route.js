const express = require('express');

const router = express.Router();
const passport = require("passport");

const signUpLoginController = require("../controllers/signUpLogin.controller")

router.post('/register', signUpLoginController.Signup);
router.post('/login', signUpLoginController.signIn);
router.post("/verify", signUpLoginController.verifyEmail);
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Successful login
    res.redirect("/dashboard");
  }
);

module.exports = router;