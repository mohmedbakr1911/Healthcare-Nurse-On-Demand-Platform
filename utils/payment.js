// payment.js
const axios = require("axios");
const { createOrder } = require("./order.js");
const asyncWrapper = require("../middlewares/asyncWrapper.js");

async function getPaymentKey(amountCents) {
  const { orderId, token } = await createOrder(amountCents);

  const response = await axios
    .post("https://accept.paymob.com/api/acceptance/payment_keys", {
      auth_token: token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        apartment: "803",
        email: "user@example.com",
        floor: "42",
        first_name: "Sohaib",
        last_name: "Hassan",
        phone_number: "+201234567890",
        city: "Cairo",
        country: "EG",
        state: "Cairo",
        street: "Maadi",
        building: "12",
        shipping_method: "PKG",
        postal_code: "12345",
      },
      currency: "EGP",
      integration_id: process.env.INTEGRATION_ID,
      callback_url: "/api/paymob/webhook",
    })
    .catch((error) => {
      console.error("Error creating payment key:", error.response.data);
      // throw new Error("Payment key creation failed");
    });

  return response.data.token; // Payment token for iframe or mobile SDK
}

module.exports = { getPaymentKey };
