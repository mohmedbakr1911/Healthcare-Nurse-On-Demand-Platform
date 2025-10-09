require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // allows insecure/self-signed certificates
  },
  idleTimeoutMillis: 10000,
});

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  // The pool should handle the replacement, but this prevents the Node process crash.
});
module.exports = pool;
