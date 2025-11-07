// server.js
require('dotenv').config();
const fs = require('fs');
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();

// App Service provides the port in process.env.PORT
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const host = '0.0.0.0'; // bind to all interfaces (required on many PaaS)

// Database configuration from env (set these in App Service Configuration)
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  // For quick POC on Flexible Server you can allow self-signed: 
  // For production use, configure proper CA/SSL certs.
  ssl: {
    rejectUnauthorized: false
  }
};

const pool = mysql.createPool(dbConfig);

// test connection on start
(async function testConn () {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('✅ Connected to MySQL');
  } catch (err) {
    console.error('❌ MySQL connection error:', err.message || err);
  }
})();

// simple routes
app.get('/', (req, res) => {
  res.send('Azure MySQL POC app is running!');
});

// insert: /insert?name=YourName
app.get('/insert', async (req, res) => {
  const name = req.query.name || 'NoName';
  try {
    const [result] = await pool.query('INSERT INTO users (name) VALUES (?)', [name]);
    res.send(`Inserted row id ${result.insertId}`);
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).send('Insert failed');
  }
});

app.get('/list', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Select error:', err);
    res.status(500).send('Select failed');
  }
});

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
