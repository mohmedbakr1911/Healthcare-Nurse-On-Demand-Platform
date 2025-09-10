const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // or "hotmail", "yahoo", etc.
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS  // your email password / app password
  },
  tls: {
    rejectUnauthorized: false // <-- bypass cert issue
  }
});

async function sendVerificationEmail(to, token) {
  const verifyUrl = `${process.env.BASE_URL}/api/users/verify/${token}`;

  const mailOptions = {
    from: `"health-care-nurse-on-demand" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your email",
    html: `
      <h2>Welcome!</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `
  };

  const res = await transporter.sendMail(mailOptions);
  console.log(res);
}

module.exports = { sendVerificationEmail };
