const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // or "hotmail", "yahoo", etc.
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your email password / app password
  },
  tls: {
    rejectUnauthorized: false, // <-- bypass cert issue
  },
});

async function sendVerificationEmail(to, code) {
  const mailOptions = {
    from: `"health-care-nurse-on-demand" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your verification code",
    html: `
      <h2>Welcome!</h2>
      <p>Enter the code below to verify your email:</p>
      <h1>${code}</h1>
      <p>This code will expire in 10 minutes.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}

async function sendResetPasswordEmail(to, token) {
  const mailOptions = {
    from: `"health-care-nurse-on-demand" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your password",
    html: `
      <h2>Reset your password</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${process.env.FRONT_URL}/resetPassword?token=${token}">Reset Password</a>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
