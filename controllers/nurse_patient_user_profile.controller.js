const asyncWrapper = require("../middlewares/asyncWrapper");
const pool = require("../db/db");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");

const createPatientProfile = asyncWrapper(async (req, res, next) => {
  if (req.currentUser.user_type !== "patient") {
    return next(
      appError.create(
        "Only patients can create patient profiles",
        403,
        httpStatusText.FAIL
      )
    );
  }

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
  await pool.query("UPDATE users SET profile_created = TRUE WHERE id = $1", [
    req.currentUser.id,
  ]);

  res.status(201).json({ status: httpStatusText.SUCCESS, data: null });
});

const createNurseProfile = asyncWrapper(async (req, res, next) => {
  if (req.currentUser.user_type !== "nurse") {
    return next(
      appError.create(
        "Only nurses can create nurse profiles",
        403,
        httpStatusText.FAIL
      )
    );
  }

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

  await pool.query("UPDATE users SET profile_created = TRUE WHERE id = $1", [
    req.currentUser.id,
  ]);

  res.status(201).json({ status: httpStatusText.SUCCESS, data: null });
});

const updateProfile = asyncWrapper(async (req, res, next) => {
  const { id } = req.currentUser;
  const fields = req.body;
  const user_type = req.currentUser.user_type;

  if (Object.keys(fields).length === 0) {
    return next(
      appError.create("No fields provided", 400, httpStatusText.FAIL)
    );
  }

  // Build dynamic query
  const setClause = Object.keys(fields)
    .map((key, idx) => `${key} = $${idx + 1}`)
    .join(", ");

  const values = Object.values(fields);

  const query = `
    UPDATE ${user_type === "nurse" ? "nurse_profiles" : "patient_profiles"} 
    SET ${setClause} 
    WHERE user_id = $${values.length + 1}
    RETURNING *;
  `;

  const result = await pool.query(query, [...values, id]);

  if (result.rowCount === 0) {
    return next(
      appError.create(
        `${user_type === "nurse" ? "Nurse" : "Patient"} profile not found`,
        404,
        httpStatusText.FAIL
      )
    );
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: result.rows[0],
  });
});

module.exports = {
  createPatientProfile,
  createNurseProfile,
  updateProfile,
};
