const asyncWrapper = require("../middlewares/asyncWrapper");
const pool = require("../db/db");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const prisma = require("../prisma/prismaClient");

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

  const images = req.files;

  if (images["id_front"] === undefined || images["id_back"] === undefined) {
    return next(
      appError.create(
        "ID front and back images are required",
        400,
        httpStatusText.FAIL
      )
    );
  }
  const imagePath = images["profile_picture"]
    ? images["profile_picture"][0].path
    : process.env.DEFAULT_AVATAR;
  const idFrontPath = images["id_front"][0].path;
  const idBackPath = images["id_back"][0].path;

  const {
    first_name,
    last_name,
    date_of_birth,
    gender,
    emergency_contact,
    medical_history,
    insurance_info,
    preferences,
  } = req.body;

  const newPatient = await prisma.patient_profiles.create({
    data: {
      first_name: first_name,
      last_name: last_name,
      date_of_birth: new Date(date_of_birth),
      gender: gender,
      emergency_contact: emergency_contact,
      medical_history: medical_history,
      insurance_info: insurance_info,
      preferences: preferences,
      profile_picture: imagePath,
      user_id: req.currentUser.id,
      id_front: idFrontPath,
      id_back: idBackPath,
    },
  });

  if (!newPatient) {
    return next(
      appError.create(
        "Patient profile creation failed",
        500,
        httpStatusText.FAIL
      )
    );
  }

  await prisma.users.update({
    where: { id: req.currentUser.id },
    data: { profile_created: true },
  });

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
  const images = req.files;

  if (images["id_front"] === undefined || images["id_back"] === undefined) {
    return next(
      appError.create(
        "ID front and back images are required",
        400,
        httpStatusText.FAIL
      )
    );
  }

  const profilePicPath = images["profile_picture"]
    ? images["profile_picture"][0].path
    : process.env.DEFAULT_AVATAR;
  const idFrontPath = images["id_front"][0].path;
  const idBackPath = images["id_back"][0].path;
  const goodConductPath = images["good_conduct_certificate"][0].path;
  const syndicateCardPath = images["syndicate_card"][0].path;
  const graduationCertPath = images["graduation_certificate"][0].path;

  if (!goodConductPath)
    return next(
      appError.create(
        "Good conduct certificate image is required",
        400,
        httpStatusText.FAIL
      )
    );

  if (!syndicateCardPath)
    return next(
      appError.create("Syndicate Card is required", 400, httpStatusText.FAIL)
    );

  if (!graduationCertPath)
    return next(
      appError.create(
        "Graduation Certificate image is required",
        400,
        httpStatusText.FAIL
      )
    );

  const verification_status = { verified: false };

  const {
    first_name,
    last_name,
    specializations,
    years_experience,
    hourly_rate,
    service_radius,
  } = req.body;

  const newNurse = await prisma.nurse_profiles.create({
    data: { first_name: first_name, last_name: last_name },
  });

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

const getProfile = asyncWrapper(async (req, res, next) => {
  const { id } = req.currentUser;
  const user_type = req.currentUser.user_type;

  const query = `
    SELECT * FROM ${
      user_type === "nurse" ? "nurse_profiles" : "patient_profiles"
    }
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [id]);

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

const getNurses = asyncWrapper(async (req, res, next) => {
  
  const nurses = await prisma.nurse_profiles.findMany({
    select: {
      user_id: true,
      hourly_rate: true,
      specializations: true,
    },
  });

  const nursesWithLocation = nurses.map((nurse) => ({
    ...nurse,
    // location: "Cairo",
    location: {
      lat: +(Math.random() * 180 - 90).toFixed(6),
      lon: +(Math.random() * 360 - 180).toFixed(6),
    },
  }));

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: nursesWithLocation,
  });
});


const getAllNurses = asyncWrapper(async (req, res, next) => {
  const nurses = await prisma.nurse_profiles.findMany();
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: nurses,
  });
});

module.exports = {
  createPatientProfile,
  createNurseProfile,
  updateProfile,
  getProfile,
  getNurses,
  getAllNurses,
};
