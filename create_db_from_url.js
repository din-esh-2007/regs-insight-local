/*
  create_db_from_url.js
  Connects to the provided MySQL host/port/user/password and ensures DB + tables exist.
  Usage: node create_db_from_url.js
*/
require("dotenv").config();
const mysql = require("mysql2/promise");

(async function main(){
  try {
    // Use env values if present, otherwise fallback to values parsed from your Railway URL
    const host = process.env.DB_HOST || "shortline.proxy.rlwy.net";
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 18752;
    const user = process.env.DB_USER || "root";
    const pass = process.env.DB_PASS || "ucrqUnoNismxIkbRNAUSuTPftDAfBmfn";
    const dbName = process.env.DB_NAME || "railway";

    console.log("Connecting to MySQL at", host + ":" + port, "user", user, "db:", dbName);

    // Connect to server (no database specified) to create the database if needed
    const conn = await mysql.createConnection({ host, port, user, password: pass, multipleStatements: true });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log("Database created or already exists:", dbName);
    await conn.end();

    // Create pool to create tables in the specific DB
    const pool = mysql.createPool({ host, port, user, password: pass, database: dbName, waitForConnections: true, connectionLimit: 5 });

    const usersSql = `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150),
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

    const docsSql = `CREATE TABLE IF NOT EXISTS documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      document_name VARCHAR(500),
      document_type VARCHAR(200),
      document_date DATE,
      file_path VARCHAR(1000),
      original_filename VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

    const c = await pool.getConnection();
    await c.query(usersSql);
    await c.query(docsSql);
    c.release();

    console.log("Tables ensured.");
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Failed to create DB/tables. Error:");
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
})();
