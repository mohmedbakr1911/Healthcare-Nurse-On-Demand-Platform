const asyncWrapper = require("../middlewares/asyncWrapper");
const pool = require("../db/db");
const error = require("../utils/appError");
const bcrypt = require("bcrypt");
const tokenMiddleware = require("../middlewares/Token");
const validator = require("validator");


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

  const newUser = await pool.query(
    "INSERT INTO users (email, password_hash, phone, user_type) VALUES ($1, $2, $3, $4) RETURNING *",
    [email, hashedPassword, phone, user_type]
  );

  if (!newUser) {
    return next(new error("User registration failed", 500));
  }

  const token = tokenMiddleware.generateToken(newUser.rows[0]);

  return res.status(201).json({
    message: "User registered successfully",
    user_id: newUser.rows[0].id,
    access_token: token.access_token,
    refresh_token: token.refresh_token,
  });
});

const signIn = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (user.rows.length === 0) {
    return next(new error("Invalid email or password", 401));
  }
  const passwordMatch = await bcrypt.compare(password, user.rows[0].password_hash);

  if (!passwordMatch) {
    return next(new error("Invalid email or password", 401));
  }

  const token = tokenMiddleware.generateToken(user.rows[0]);

  return res.status(200).json({
    message: "User signed in successfully",
    user_id: user.rows[0].id,
    access_token: token.access_token,
    refresh_token: token.refresh_token
  });
});

module.exports = {
  signIn,
  Signup,
};
