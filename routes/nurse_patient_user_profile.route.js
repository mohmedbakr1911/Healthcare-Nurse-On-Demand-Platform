const express = require("express");

const router = express.Router();

const nurse_patient_user_profile_controller = require("../controllers/nurse_patient_user_profile.controller");
const verifyToken = require("../middlewares/Token").verifyToken;

router
  .route("/patient")
  .post(
    verifyToken,
    nurse_patient_user_profile_controller.createPatientProfile
  );

router
  .route("/nurse")
  .post(verifyToken, nurse_patient_user_profile_controller.createNurseProfile);

module.exports = router;
