const Token = require("../middlewares/Token.js");
const pool = require("../db/db.js");
const appError = require("../utils/appError.js");
const httpStatusText = require("../utils/httpStatusText.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");
const prisma = require("../prisma/prismaClient");
const { tr } = require("@faker-js/faker");
const { getIO } = require("../ioServer");

const createServiceRequest = asyncWrapper(async (req, res, next) => {
  const io = getIO();
  const currentUser = req.currentUser;
  const { service_type, description, patient_location, scheduled_time } =
    req.body;

  if (currentUser) {
    const service = await prisma.service_requests.create({
      data: {
        patient_id: currentUser.id,
        service_type: service_type,
        description: description,
        patient_location: patient_location,
        scheduled_time: new Date(scheduled_time),
        status: "pending",
      },
    });

    let nurses = await prisma.nurse_profiles.findMany({
      select: {
        user_id: true,
        specializations: true,
        rate: true,
        available: true,
      },
      where: {
        verification_status: {
          path: ["verified"],
          equals: true,
        },
      },
    });

    const diffMs = new Date() - new Date(scheduled_time);
    // Convert to minutes
    const diffMinutes = diffMs / (1000 * 60);
    if (diffMinutes >= 0 && diffMinutes <= 2) {
      nurses = nurses.filter((nurse) => nurse.available === true);
    }

    const nursesWithLocation = nurses.map((nurse) => ({
      user_id: nurse.user_id,
      specializations: nurse.specializations,
      rate: nurse.rate,
      location: {
        lat: +(Math.random() * 180 - 90).toFixed(6),
        lon: +(Math.random() * 360 - 180).toFixed(6),
      },
    }));

    try {
      nurses = nursesWithLocation;

      const paitent = await prisma.patient_profiles.findUnique({
        where: {
          user_id: currentUser.id,
        },
      });

      if (!paitent) {
        return next(
          appError.create(
            "Patient profile not found",
            404,
            httpStatusText.ERROR
          )
        );
      }

      let message;

      if (diffMinutes >= 0 && diffMinutes <= 2) {
        // send notification urgently
        message = `urgent service from paitent named ${paitent.first_name} ${paitent.last_name}`;
      } else {
        // send normal notification
        message = `normal service from paitent named ${paitent.first_name} ${paitent.last_name}`;
      }

      nurses.forEach((nurse) => {
        // send notification to each nurse
        console.log(
          `Notification sent to nurse ID ${nurse.user_id}: ${message}`
        );

         io.to(`nurse_${nurse.user_id}`).emit("new_service_request", {
          service,
          message,
          });
      });

      res.status(201).json({
        status: httpStatusText.SUCCESS,
        message: "Service request created successfully",
        data: { service: service },
      });
    } catch (error) {
      console.error("Error fetching nurse results: 2", error.message);
      return next(
        appError.create(
          "Error fetching nurse results 3",
          500,
          httpStatusText.ERROR
        )
      );
    }
  }
});

const getPatientServise = asyncWrapper(async (req, res, next) => {
  const currentUser = req.currentUser;

  if (currentUser) {
    const service = await prisma.service_requests.findMany({
      where: {
        patient_id: currentUser.id,
      },
    });

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      data: service,
    });
  }

  return next(
    appError.create("Error fetching nurse results", 500, httpStatusText.ERROR)
  );
});

const completeServiceRequest = asyncWrapper(async (req, res, next) => {
  const { serviceRequestId, nurse_id } = req.body;

  const serviceRequest = await pool.query(
    `UPDATE service_requests SET status = 'matched', nurse_id = $1 WHERE id = $2 RETURNING *`,
    [nurse_id, serviceRequestId]
  );

  if (serviceRequest.rowCount === 0) {
    return next(
      appError.create(
        "Service request not found or could not be updated",
        404,
        httpStatusText.ERROR
      )
    );
  }
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { serviceRequest: serviceRequest.rows[0] },
  });
});

module.exports = {
  createServiceRequest,
  getPatientServise,
  completeServiceRequest,
};
