const express = require("express");
const pool = require("./db/db");
const app = express();
const port = 3000;

const cors = require("cors");

const httpStatusText = require("./utils/httpStatusText");

const signUpLoginRouter = require("./routes/signUpLogin.route");
const nurse_patient_user_profile = require("./routes/nurse_patient_user_profile.route");
const serviceRouter = require("./routes/service.route");

const passport = require("passport");
const session = require("express-session");
const passportSetup = require("./utils/passport_setup");

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Passport setup
passport.use(passportSetup);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", signUpLoginRouter);
app.use("/api/profile", nurse_patient_user_profile);
app.use("/api/service", serviceRouter);

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.post("/api/paymob/webhook", (req, res) => {
  // const obj = req.body;
  // if (obj.success === true) {
  //   console.log("✅ Payment successful:", obj);
  //   // update your database, mark order as paid
  // } else {
  //   console.log("❌ Payment failed:", obj);
  // }
  // res.sendStatus(200);
  console.log("Webhook received:", req.body);
  res.sendStatus(200);
});

const { getPaymentKey } = require("./utils/payment.js");
app.post("/create-payment", async (req, res) => {
  try {
    const { amount } = req.body; // E.g. 1000 = 10 EGP
    const paymentKey = await getPaymentKey(amount);
    res.json({ paymentKey }); // Send result to frontend
  } catch (error) {
    console.error(error);
    res.status(500).send("Payment key generation failed");
  }
});

// global middleware for not found router
app.all(/.*/, (req, res) => {
  res.status(404).json({ message: "URL Not Found" });
});

// global error handler
app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({
    status: error.httpStatusText || httpStatusText.ERROR,
    data: null,
    message: error.message,
    code: error.statusCode || 500,
  });
});

app.listen(port, async () => {
  const connected = (await pool.connect()) ? true : false;
  console.log();
  console.log(`Database connection: ${connected}`);
  console.log();
  console.log(`Server is running at http://localhost:${port}`);
});
