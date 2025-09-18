const express = require("express");
const router = express.Router();

const nurse_patient_user_profile_controller = require("../controllers/nurse_patient_user_profile.controller");
const verifyToken = require("../middlewares/Token").verifyToken;

router
  .route("/patient")
  .post(verifyToken, nurse_patient_user_profile_controller.createPatientProfile)
  .patch(
    verifyToken,
    nurse_patient_user_profile_controller.updatePatientProfile
  );

router
  .route("/nurse")
  .post(verifyToken, nurse_patient_user_profile_controller.createNurseProfile)
  .patch(verifyToken, nurse_patient_user_profile_controller.updateNurseProfile);

module.exports = router;
