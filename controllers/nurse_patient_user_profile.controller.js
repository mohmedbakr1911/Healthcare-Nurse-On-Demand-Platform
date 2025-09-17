const asyncWrapper = require("../middlewares/asyncWrapper");
const pool = require("../db/db");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");

const createPatientProfile = asyncWrapper(async (req, res, next) => {
  const {
    first_name,
    last_name,
    date_of_birth,
    gender,
    address,
    emergency_contact,
    medical_history,
    insurance_info,
    preferences,
  } = req.body;
  const newPatient = await pool.query(
    "INSERT INTO patient_profiles (user_id, first_name, last_name, date_of_birth, gender, address, emergency_contact, medical_history, insurance_info, preferences) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
    [
      req.currentUser.id,
      first_name,
      last_name,
      date_of_birth,
      gender,
      address,
      emergency_contact,
      medical_history,
      insurance_info,
      preferences,
    ]
  );
  if (!newPatient) {
    return next(
      appError.create(
        "Patient profile creation failed",
        500,
        httpStatusText.FAIL
      )
    );
  }
  res.status(201).json({ status: httpStatusText.SUCCESS, data: null });
});

const createNurseProfile = asyncWrapper(async (req, res, next) => {
  const {
    first_name,
    last_name,
    license_number,
    license_state,
    license_expiry,
    specializations,
    years_experience,
    hourly_rate,
    service_radius,
    verification_status,
    availability_schedule,
  } = req.body;
  const newNurse = await pool.query(
    "INSERT INTO nurse_profiles (user_id, first_name, last_name, license_number, license_state, license_expiry, specializations, years_experience, hourly_rate, service_radius, verification_status, availability_schedule) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *",
    [
      req.currentUser.id,
      first_name,
      last_name,
      license_number,
      license_state,
      license_expiry,
      specializations,
      years_experience,
      hourly_rate,
      service_radius,
      verification_status,
      availability_schedule,
    ]
  );
  if (!newNurse) {
    return next(
      appError.create("Nurse profile creation failed", 400, httpStatusText.FAIL)
    );
  }
  res.status(201).json({ status: httpStatusText.SUCCESS, data: null });
});

module.exports = {
  createPatientProfile,
  createNurseProfile,
};
