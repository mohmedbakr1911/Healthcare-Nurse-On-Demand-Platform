const asyncWrapper = require("../middlewares/asyncWrapper");
const pool = require("../db/db");
const error = require("../utils/appError");
const bcrypt = require("bcrypt");
const tokenMiddleware = require("../middlewares/Token");
const validator = require("validator");
const crypto = require("crypto");
<<<<<<< HEAD
const {sendVerificationEmail} = require("../emailServices/utils/emailService")
=======
const {sendVerificationEmail} = require("../utils/emailService")
const appError = require('../utils/appError')
const httpStatusText = require("../utils/httpStatusText")
>>>>>>> 87b307753365ec96fbf45ca69c004a4e9fd09cef

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

  const verifictionCode = Math.floor(100000 + Math.random() * 900000).toString();

  const expired_code_at = new Date(Date.now() + 10 * 60 * 1000);

  const newUser = await pool.query(
    "INSERT INTO users (email, password_hash, phone, user_type, verification_code, code_expires_at, provider) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [email, hashedPassword, phone, user_type, verifictionCode, expired_code_at, "local"]
  );


  await sendVerificationEmail(email, verifictionCode);

  if (!newUser) {
    return next(new error("User registration failed", 500));
  }

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: {
      user_id: newUser.rows[0].id,
    }
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
    const verifictionCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expired_code_at = new Date(Date.now() + 10 * 60 * 1000);
    pool.query("UPDATE users SET verification_code = $1, code_expires_at = $2 WHERE email = $3",
      [verifictionCode, expired_code_at, email]
    )
    await sendVerificationEmail(email, verifictionCode);
    return next(appError.create("Please Verify Email", 400, httpStatusText.FAIL));
  }

  const token = tokenMiddleware.generateToken(user.rows[0]);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data:{
      user_id: user.rows[0].id,
      access_token: token,
      // refresh_token: token
    }
  });
});

const verifyEmail  = asyncWrapper( async (req, res, next) => {
  const { email, code } = req.body;

  const user = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND verification_code = $2 AND code_expires_at > NOW()",
    [email, code]
  );

  if (!user.rows.length) {
    return next(appError.create("Invalid or expired code", 400, httpStatusText.FAIL));
  }

  await pool.query(
    "UPDATE users SET status = 'active', verification_code = NULL, code_expires_at = NULL WHERE email = $1",
    [email]
  );

  const token = tokenMiddleware.generateToken(user.rows[0]);

  res.status(200).json({ status: httpStatusText.SUCCESS , data: {access_token: token}});
});

module.exports = {
  signIn,
  Signup,
  verifyEmail
};
