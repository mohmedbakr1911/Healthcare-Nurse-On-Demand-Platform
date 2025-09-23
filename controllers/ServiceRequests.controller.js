const Token = require("../middlewares/Token");
const express = require("express");
const axios = require("axios");
const pool = require("../db/db.js");

const createServiceRequest = async (req, res) => {
  try {
    const currentUser = req.currentUser;
    const {
      patient_id,
      nurse_id,
      service_type,
      description,
      patient_location,
      scheduled_time,
    } = req.body;

    if (currentUser) {
      const service = await pool.query(
        `INSERT INRTO service_requests (patient_id, nurse_id, service_type, description, patient_location, scheduled_time) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          patient_id,
          nurse_id,
          service_type,
          description,
          patient_location,
          scheduled_time,
        ]
      );

      const getNurseResults = await axios.post(
        "https://care-now-matching.vercel.app/match_nurses",
        {
          location: patient_location,
          service_type: service_type,
          preferred_time: scheduled_time,
        }
      );

      if (getNurseResults.status !== 200) {
        return res
          .status(500)
          .json({ message: "Error fetching nurse results" });
      }

      res.status(201).json({
        message: "Service request created successfully",
        data: service,
        matchedResults: getNurseResults.data,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createServiceRequest };
