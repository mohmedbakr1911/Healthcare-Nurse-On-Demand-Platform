const asyncWrapper = require("../middlewares/asyncWrapper");
const pool = require("../db/db");
const error = require("../utils/appError");
const bcrypt = require("bcrypt");
const tokenMiddleware = require("../middlewares/Token");
const validator = require("validator");
const crypto = require("crypto");
const {sendVerificationEmail} = require("../utils/emailService")
const appError = require('../utils/appError')
const httpStatusText = require("../utils/httpStatusText")

const Signup = asyncWrapper(async (req, res, next) => {
  const { email, password, confirm_password, phone, user_type } = req.body;

  const validEmail = validator.isEmail(email);
  if (!validEmail) {
    return next(new error("Invalid email format", 400));
  }

  if (password !== confirm_password) {
    return next(new error("Passwords do not match", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const verificationToken = crypto.randomBytes(32).toString("hex");

  const newUser = await pool.query(
    "INSERT INTO users (email, password_hash, phone, user_type, verification_token) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [email, hashedPassword, phone, user_type, verificationToken]
  );

  await sendVerificationEmail(email, verificationToken);

  if (!newUser) {
    return next(new error("User registration failed", 500));
  }

  const token = tokenMiddleware.generateToken(newUser.rows[0]);

  return res.status(201).json({
    message: "User registered successfully",
    user_id: newUser.rows[0].id,
    access_token: token,
    // refresh_token: token,
  });
});

const signIn = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (user.rows.length === 0) {
    return next(appError.create("Invalid email or password", 401, httpStatusText.FAIL));
  }
  const passwordMatch = await bcrypt.compare(password, user.rows[0].password_hash);

  if (!passwordMatch) {
    return next(appError.create("Invalid email or password", 401, httpStatusText.FAIL));
  }

  if(user.rows[0].status !== 'active')
  {
    await sendVerificationEmail(email, user.rows[0].verification_token);
    return next(appError.create("Please Verify Email", 400, httpStatusText.FAIL));
  }

  const token = tokenMiddleware.generateToken(user.rows[0]);

  return res.status(200).json({
    message: "User signed in successfully",
    user_id: user.rows[0].id,
    access_token: token,
    // refresh_token: token
  });
});

async function verifyEmail(req, res) {
  try {
    const { token } = req.params;

    const result = await pool.query(
      "SELECT * FROM users WHERE verification_token = $1",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = result.rows[0];

    await pool.query(
      "UPDATE users SET status = 'active', verification_token = NULL WHERE id = $1",
      [user.id]
    );

    res.json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  signIn,
  Signup,
  verifyEmail
};
