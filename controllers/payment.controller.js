const asyncWrapper = require("../middlewares/asyncWrapper");
const pool = require("../db/db");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const axios = require("axios");
const { getAuthToken } = require("../utils/auth");
const backendUrl = "https://healthcarenurseondemand.vercel.app";

const createPayment = asyncWrapper(async (req, res, next) => {
  const user = req.currentUser;
  try {
    const { amount } = req.body;
    const paymentKey = await getPaymentKey(amount, user);
    res.status(200).json({ status: httpStatusText.SUCCESS, data: paymentKey }); // Send result to frontend
  } catch (error) {
    console.error(error);
    return next(appError.create(error.message, 500, httpStatusText.ERROR));
  }
});

const getPaymentKey = async (amountCents, user) => {
  const { orderId, token } = await createOrder(amountCents);

  const query = `
    SELECT * FROM "patient_profiles"
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [user.id]);
  const userData = result.rows[0];

  console.log("user: ", user);
  console.log("userData: ", userData);
  const response = await axios
    .post("https://accept.paymob.com/api/acceptance/payment_keys", {
      auth_token: token,
      amount_cents: amountCents * 100,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        apartment: "803",
        email: user.email,
        floor: "42",
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: user.phone,
        city: userData.address.city,
        country: userData.address.country,
        state: userData.address.state,
        street: userData.address.street,
        building: "12",
        shipping_method: "PKG",
        postal_code: "12345",
      },
      currency: "EGP",
      integration_id: process.env.INTEGRATION_ID,
      callback_url: backendUrl + "/api/payment/webhook",
    })
    .catch((err) => {
      console.error("Error creating payment key:", err.response.data);
      throw new Error("Failed to create payment key");
    });
  return response.data.token; // Payment token for iframe or mobile SDK
};

const createOrder = async (amountCents) => {
  const token = await getAuthToken();

  const response = await axios.post(
    "https://accept.paymob.com/api/ecommerce/orders",
    {
      auth_token: token,
      delivery_needed: "false",
      amount_cents: amountCents * 100, // in cents, e.g. 1000 = 10 EGP
      currency: "EGP",
      items: [],
    }
  );

  return { orderId: response.data.id, token };
};

const webhookHandler = asyncWrapper(async (req, res, next) => {
  const obj = req.body;
  if (obj.success === true) {
    console.log("✅ Payment successful:", obj);
    // update your database, mark order as paid
  } else {
    console.log("❌ Payment failed:", obj);
  }
  res.sendStatus(200);
});

// <iframe src="https://accept.paymob.com/api/acceptance/iframes/965793?payment_token=PAYMENT_KEY"></iframe>
// test card: 2223000000000007 with CVV 100

module.exports = { createPayment, webhookHandler };
