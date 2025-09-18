const express = require("express");

const router = express.Router();
const passport = require("passport");

const signUpLoginController = require("../controllers/signUpLogin.controller");
const { verifyToken } = require("../middlewares/Token");

router.post("/register", signUpLoginController.Signup);
router.post("/login", signUpLoginController.signIn);
router.post("/verify", signUpLoginController.verifyEmail);
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  signUpLoginController.callback
);
router.patch("/completeData", verifyToken, signUpLoginController.completeData);
router.post(
  "/resetPasswordRequest",
  signUpLoginController.resetPasswordRequest
);
router.patch(
  "/resetPassword",
  verifyToken,
  signUpLoginController.resetPassword
);

module.exports = router;
