// order.js
const axios = require("axios");
const { getAuthToken } = require("./auth.js");

async function createOrder(amountCents) {
  const token = await getAuthToken();

  const response = await axios
    .post("https://accept.paymob.com/api/ecommerce/orders", {
      auth_token: token,
      delivery_needed: "false",
      amount_cents: amountCents, // in cents, e.g. 1000 = 10 EGP
      currency: "EGP",
      items: [],
    })
    .catch((error) => {
      console.error("Error creating order:", error.response.data);
    });

  return { orderId: response.data.id, token };
}

module.exports = { createOrder };
