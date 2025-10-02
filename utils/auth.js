// auth.js
const axios = require("axios");

async function getAuthToken() {
  const response = await axios.post(
    "https://accept.paymob.com/api/auth/tokens",
    {
      api_key: process.env.PAYMOB_API_KEY,
    }
  );
  return response.data.token;
}

module.exports = { getAuthToken };
