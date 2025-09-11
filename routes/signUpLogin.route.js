const express = require('express');

const router = express.Router();

const signUpLoginController = require("../controllers/signUpLogin.controller")

router.post('/auth/register', signUpLoginController.Signup);
router.post('/auth/login', signUpLoginController.signIn);
router.post("/auth/verify", signUpLoginController.verifyEmail);

module.exports = router;