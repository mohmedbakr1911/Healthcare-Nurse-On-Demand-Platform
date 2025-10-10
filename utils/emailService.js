const nodemailer = require("nodemailer");

// Function to validate email format (basic example)
function isValidEmail(email) {
  // Use a more robust regex or library in production
  return /\S+@\S+\.\S+/.test(email);
}

// Configuration is now cleaner and more secure
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendVerificationEmail(to, code) {
  if (!isValidEmail(to)) {
    throw new Error("Invalid recipient email address.");
  }

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
      <p>This token will expire in 10 minutes.</p>
      `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
