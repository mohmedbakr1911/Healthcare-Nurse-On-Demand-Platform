const asyncWrapper = require("../middlewares/asyncWrapper");
const pool = require("../db/db");
const error = require("../utils/appError");
const bcrypt = require("bcrypt");
const tokenMiddleware = require("../middlewares/Token");
const validator = require("validator");
const crypto = require("crypto");
const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../utils/emailService");
const appError = require("../utils/appError");
const httpStatusText = require("../utils/httpStatusText");
const prisma = require("../prisma/prismaClient");

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

  const { expired_code_at, verifictionCode } = getVerificationCode();


  const newUser = await prisma.users.create({
    data: { email, phone, user_type, provider: "local" },
  });

  

  await prisma.credentials.create({
    data: {
      user_id: newUser.id,
      password_hash: hashedPassword,
      verification_code: verifictionCode,
      code_expires_at: expired_code_at,
    },
  });

  await sendVerificationEmail(email, verifictionCode);

  if (!newUser) {
    return next(new error("User registration failed", 500));
  }

  return res.status(201).json({
    status: httpStatusText.SUCCESS,
    data: {
      user_id: newUser.id,
    },
  });
});

const signIn = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  const result = await prisma.users.findUnique({
    where: { email: email },
    include: { credentials: true },
  });

  if (!result) {
    return next(
      appError.create("Invalid email or password", 401, httpStatusText.FAIL)
    );
  }
  const passwordMatch = await bcrypt.compare(
    password,
    result.credentials.password_hash
  );

  if (!passwordMatch) {
    return next(
      appError.create("Invalid email or password", 401, httpStatusText.FAIL)
    );
  }

  if (result.credentials.status !== "active") {
    const { expired_code_at, verifictionCode } = getVerificationCode();

    await prisma.credentials.update({
      where: { user_id: result.id },
      data: {
        verification_code: verifictionCode,
        code_expires_at: expired_code_at,
      },
    });

    await sendVerificationEmail(email, verifictionCode);
    return next(
      appError.create("Please Verify Email", 400, httpStatusText.FAIL)
    );
  }

  const token = tokenMiddleware.generateToken(result);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      access_token: token,
      // refresh_token: token
    },
  });
});

const verifyEmail = asyncWrapper(async (req, res, next) => {
  const { email, code } = req.body;

  const user = await prisma.users.findUnique({
    where: { email },
    include: {
      credentials: {
        where: {
          verification_code: String(code),
        },
      },
    },
  });

  if (!user || !user.credentials) {
    return next(
      appError.create("Invalid email or code", 400, httpStatusText.FAIL)
    );
  }

  const expirationTime = user.credentials.code_expires_at;

  if (!(expirationTime && expirationTime.getTime() > new Date().getTime())) {
    const { expired_code_at, verifictionCode } = getVerificationCode();

    await prisma.credentials.update({
      where: { user_id: user.id },
      data: {
        verification_code: verifictionCode,
        code_expires_at: expired_code_at,
      },
    });
    await sendVerificationEmail(email, verifictionCode);

    return next(
      appError.create(
        "Code has expired chek the new code",
        400,
        httpStatusText.FAIL
      )
    );
  }

  await prisma.credentials.update({
    where: { user_id: user.id },
    data: {
      status: "active",
      verification_code: null,
      code_expires_at: null,
    },
  });

  const token = tokenMiddleware.generateToken(user);

  res
    .status(200)
    .json({ status: httpStatusText.SUCCESS, data: { access_token: token } });
});

const callback = asyncWrapper(async (req, res) => {
  const email = req.user.emails[0].value;

  const user = await prisma.users.findUnique({
    where: { email },
  });

  if (!user) {
    const newUser = await prisma.users.create({
      data: { email, provider: "google" },
    });
    const token = tokenMiddleware.generateToken(newUser);
    res.redirect(`${process.env.FRONT_URL}/completeData?token=${token}`);
  }

  const token = tokenMiddleware.generateToken(user);
  res.redirect(`${process.env.FRONT_URL}?token=${token}`);
});

const completeData = asyncWrapper(async (req, res, next) => {
  const { user_type, phone } = req.body;
  if (!["nurse", "patient"].includes(user_type)) {
    return next(
      appError.create(
        "Invalid user type",
        400,
        httpStatusText.FAIL
      )
    );
  }
  const updatedUser = await prisma.users.update({
    where: { id: req.currentUser.id },
    data: { user_type, phone },
  });

  const token = tokenMiddleware.generateToken(updatedUser);

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: {
      access_token: token,
    },
  });
});

const resetPasswordRequest = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;

  const user = await prisma.users.findUnique({
    where: { email },
  });

  if (!user) {
    return next(appError.create("User not found", 404, httpStatusText.FAIL));
  }

  const credential = await prisma.credentials.findUnique({
    where: { user_id: user.id },
  });
  if (!credential || credential.status !== "active") {
    return next(
      appError.create("User not found or inactive", 404, httpStatusText.FAIL)
    );
  }

  const resetToken = tokenMiddleware.generateToken(user);
  await sendResetPasswordEmail(email, resetToken);

  const updated = await prisma.credentials.update({
    where: { user_id: user.id },
    data: {
      reset_token: resetToken,
      reset_token_expires_at: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  if (!updated) {
    return next(
      appError.create("Failed to set reset token", 500, httpStatusText.FAIL)
    );
  }
  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Reset password email sent",
  });
});

const resetPassword = asyncWrapper(async (req, res, next) => {
  const { new_password, confirm_password } = req.body;

  if (new_password !== confirm_password) {
    return next(
      appError.create("Passwords do not match", 400, httpStatusText.FAIL)
    );
  }

  if (!req.currentUser) {
    return next(
      appError.create("Invalid or expired token", 400, httpStatusText.FAIL)
    );
  }

  const credential = await prisma.credentials.findFirst({
    where: {
      user_id: req.currentUser.id,
      reset_token: req.token,
      reset_token_expires_at: {
        gt: new Date(),
      },
    },
  });

  if (!credential) {
    return next(
      appError.create("Invalid or expired token", 400, httpStatusText.FAIL)
    );
  }

  const hashedPassword = await bcrypt.hash(new_password, 10);


  const updated = await prisma.credentials.update({
    where: { user_id: req.currentUser.id },
    data: {
      password_hash: hashedPassword,
      reset_token: null,
      reset_token_expires_at: null,
    },
  });

  if (!updated) {
    return next(
      appError.create("Failed to reset password", 500, httpStatusText.FAIL)
    );
  }

  return res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Password has been reset successfully",
  });
});

const getVerificationCode = () => {
  const verifictionCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const expired_code_at = new Date(Date.now() + 10 * 60 * 1000);

  return { verifictionCode, expired_code_at };
};
module.exports = {
  signIn,
  Signup,
  verifyEmail,
  callback,
  completeData,
  resetPasswordRequest,
  resetPassword,
};
