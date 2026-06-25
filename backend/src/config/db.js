const { Pool } = require("pg");
require("dotenv").config();

require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSLMODE === "require"
    ? { rejectUnauthorized: false }
    : false,
  connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT) * 1000,
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Error connecting to PostgreSQL:", err.message);
  } else {
    console.log("✅ Connected to PostgreSQL");
    release();
  }
});

module.exports = pool;