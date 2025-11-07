require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const port = 3000;

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    // Flexible server expects SSL. This allows self-signed cert in dev.
    rejectUnauthorized: false,
  },
});

// Test DB connection when server starts
async function testDbConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Connected to Azure MySQL!");
    conn.release();
  } catch (err) {
    console.error("❌ Error connecting to MySQL:", err.message);
  }
}
testDbConnection();

// Simple home route
app.get("/", (req, res) => {
  res.send("Azure MySQL POC app is running!");
});

// Insert route: /insert?name=YourName
app.get("/insert", async (req, res) => {
  const name = req.query.name || "NoName";

  try {
    const [result] = await pool.query(
      "INSERT INTO users (name) VALUES (?)",
      [name]
    );
    res.send(`Inserted row with ID: ${result.insertId}`);
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).send("Error inserting data");
  }
});

// List route: /list
app.get("/list", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Select error:", err);
    res.status(500).send("Error fetching data");
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
