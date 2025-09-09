const express = require('express');

const router = express.Router();

const signUpLoginController = require("../controllers/signUpLogin.controller")

router.post('/patients/signup', signUpLoginController.patientSignUp);
router.post('/nurses/signup', signUpLoginController.nurseSignUp);
router.post('/signin', signUpLoginController.signIn);

module.exports = router;