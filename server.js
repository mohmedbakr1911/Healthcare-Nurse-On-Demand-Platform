const express = require("express");
const app = express();
const port = 3000;

const cors = require("cors");

const httpStatusText = require('./utils/httpStatusText')

const signUpLoginRouter = require('./routes/signUpLogin.route');

app.use(cors());
app.use(express.json());

app.use("/api", signUpLoginRouter)

// global middleware for not found router
app.all(/.*/, (req, res) => {
  res.status(404).json({ message: "URL Not Found" });
});

// global error handler
app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({status: error.httpStatusText || httpStatusText.ERROR, data: null, message: error.message, code: error.statusCode || 500});
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
