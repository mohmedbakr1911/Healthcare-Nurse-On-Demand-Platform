const express = require("express");
const router = express.Router();

const nurse_patient_user_profile_controller = require("../controllers/nurse_patient_user_profile.controller");
const { verifyToken } = require("../middlewares/Token");
const apiKeyAuth = require("../middlewares/apiKeyAuth");

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const appError = require("../utils/appError");

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "users-profile-images", // all images will be stored in Cloudinary/users-profile-images
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

// File filter (just in case)
const fileFilter = (req, file, cb) => {
  console.log("File received:", file);
  const inputType = file.mimetype.split("/")[0];
  if (inputType === "image") {
    cb(null, true);
  } else {
    cb(appError.create("File must be an image", 400), false);
  }
};

const upload = multer({ storage, fileFilter });

router
  .route("/patient")
  .post(
    verifyToken,
    upload.single("profile_picture"),
    nurse_patient_user_profile_controller.createPatientProfile
  );

router
  .route("/nurse")
  .post(
    verifyToken,
    upload.single("profile_picture"),
    nurse_patient_user_profile_controller.createNurseProfile
  )
  .get(apiKeyAuth, nurse_patient_user_profile_controller.getNurses);

router
  .route("/")
  .patch(verifyToken, nurse_patient_user_profile_controller.updateProfile)
  .get(verifyToken, nurse_patient_user_profile_controller.getProfile);

module.exports = router;
