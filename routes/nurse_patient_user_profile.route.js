const express = require("express");

const router = express.Router();

const nurse_patient_user_profile_controller = require("../controllers/nurse_patient_user_profile.controller");

router
  .route("/patient")
  .post(nurse_patient_user_profile_controller.createPatientProfile);

router
  .route("/nurse")
  .post(nurse_patient_user_profile_controller.createNurseProfile);

module.exports = router;
