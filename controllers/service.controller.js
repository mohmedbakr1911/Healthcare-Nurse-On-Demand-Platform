const Token = require("../middlewares/Token.js");
const express = require("express");
const axios = require("axios");
const pool = require("../db/db.js");
const appError = require("../utils/appError.js");
const httpStatusText = require("../utils/httpStatusText.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");

const createServiceRequest = asyncWrapper(async (req, res, next) => {
  const currentUser = req.currentUser;
  const { service_type, description, patient_location, scheduled_time } =
    req.body;

  if (currentUser) {
    const service = await pool.query(
      `INSERT INTO service_requests (patient_id, service_type, description, patient_location, scheduled_time) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        req.currentUser.id,
        service_type,
        description,
        patient_location,
        scheduled_time,
      ]
    );

    try {
      const response = await fetch(
        "https://care-now-matching.vercel.app/match_nurses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location: [patient_location.x, patient_location.y],
            service_type: service_type,
            preferred_time: scheduled_time,
          }),
        }
      );

      const getNurseResults = await response.json();

      if (!response.ok) {
        return next(appError.create(500, "Error fetching nurse results"));
      }

      res.status(201).json({
        status: httpStatusText.SUCCESS,
        message: "Service request created successfully",
        data: { service: service.rows[0], matchedResults: getNurseResults },
      });
    } catch (error) {
      console.error("Error fetching nurse results:", error.message);
      return next(appError.create(500, "Error fetching nurse results"));
    }
  }
});

const getPatientServise = asyncWrapper(async (req, res, next) => {
  const currentUser = req.currentUser;

  if (currentUser) {
    const service = await pool.query(
      `SELECT * FROM service_requests WHERE patient_id = $1`,
      [req.currentUser.id]
    );

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: service.rows[0],
    });
  }

  return next(appError.create(500, "Error fetching nurse results"));
});

module.exports = { createServiceRequest, getPatientServise };
