const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");

function apiKeyAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.GET_NURSE_KEY) {
    return next(appError.create("Invalid API key", 401, httpStatusText.ERROR));
  }
  next();
}

module.exports = apiKeyAuth;
