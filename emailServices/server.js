const express = require('express');
const bodyParser = require('body-parser');
const { sendVerificationEmail } = require('./utils/emailService');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/send-verification', async (req, res) => {
  const { to, token } = req.body;
  try {
    await sendVerificationEmail(to, token);
    res.status(200).json({ message: 'Verification email sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Email service running on port ${PORT}`));