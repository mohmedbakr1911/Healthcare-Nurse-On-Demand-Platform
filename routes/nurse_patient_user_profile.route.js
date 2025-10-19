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
  const inputType = file.mimetype.split("/")[0];
  if (inputType === "image") {
    cb(null, true);
  } else {
    cb(appError.create("File must be an image", 400), false);
  }
};

const upload = multer({ storage, fileFilter });

commonFields = [
  { name: "profile_picture", maxCount: 1 },
  { name: "id_front", maxCount: 1 },
  { name: "id_back", maxCount: 1 },
];
const patientUploadFields = upload.fields(commonFields);

router.route("/patient").post(
  verifyToken,
  patientUploadFields, // Use the configured fields middleware
  nurse_patient_user_profile_controller.createPatientProfile
);

const nurseUploadFields = upload.fields([
  ...commonFields,
  { name: "good_conduct_certificate", maxCount: 1 },
  { name: "syndicate_card", maxCount: 1 },
  { name: "graduation_certificate", maxCount: 1 },
]);

router
  .route("/nurse")
  .post(
    verifyToken,
    nurseUploadFields,
    nurse_patient_user_profile_controller.createNurseProfile
  )
  .get(apiKeyAuth, nurse_patient_user_profile_controller.getNurses)
  
  router.get(
  "/all-nurses",
  apiKeyAuth,
  nurse_patient_user_profile_controller.getAllNurses
);

router
  .route("/")
  .patch(verifyToken, nurse_patient_user_profile_controller.updateProfile)
  .get(verifyToken, nurse_patient_user_profile_controller.getProfile);

module.exports = router;
