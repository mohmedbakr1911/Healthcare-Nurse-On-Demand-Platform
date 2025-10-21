const express = require("express");
const pool = require("./db/db");
const app = express();
const port = 3000;
const http = require("http");
const server = http.createServer(app);
const { initSocket, getIO } = require("./ioServer");
const { setupNurseOfferSockets } = require("./controllers/nursesOffers.controller");
const cors = require("cors");
const httpStatusText = require("./utils/httpStatusText");

const signUpLoginRouter = require("./routes/signUpLogin.route");
const nurse_patient_user_profile = require("./routes/nurse_patient_user_profile.route");
const serviceRouter = require("./routes/service.route");
const paymentRouter = require("./routes/payment.route");

const passport = require("passport");
const session = require("express-session");
const passportSetup = require("./utils/passport_setup");

// Initialize Socket.io
initSocket(server);
const io = getIO();
setupNurseOfferSockets(io);

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
app.use("/api/payment", paymentRouter);

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

server.listen(port, async () => {
  const connected = (await pool.connect()) ? true : false;
  console.log();
  console.log(`Database connection: ${connected}` + "\n");
  console.log(`Server is running at http://localhost:${port}`);
});
