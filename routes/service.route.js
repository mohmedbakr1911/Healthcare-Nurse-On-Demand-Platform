const express = require("express");
const router = express.Router();

const serviceController = require("../controllers/service.controller");
const { verifyToken } = require("../middlewares/Token");

router.route("/").post(verifyToken, serviceController.createServiceRequest);

module.exports = router;
