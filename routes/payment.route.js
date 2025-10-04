const express = require("express");

const router = express.Router();

const { verifyToken } = require("../middlewares/Token");

const {
  createPayment,
  webhookHandler,
} = require("../controllers/payment.controller");

router.route("/").post(verifyToken, createPayment);

router.route("/webhook").post(webhookHandler);

module.exports = router;
