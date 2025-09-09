const express = require("express");
const dotenv = require("dotenv");
const pool = require("./db/db");

dotenv.config();
const app = express();
app.use(express.json());
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  pool.query("SELECT NOW()", (err, result) => {
    if (err) {
      console.error("Error executing query", err.stack);
    }else {
      console.log("Database connected:", result.rows);
    }
  });
//   console.log(process.env.DATABASE_URL);
  console.log(`Server is running at http://localhost:${port}`);
});
