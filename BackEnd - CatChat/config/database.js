// Penjelasan file dan tujuannya:
// Nama file: database.js
// Deskripsi: File konfigurasi atau koneksi database MySQL.
// Mengarahkan ke/Keterkaitan:
// - Digunakan oleh controller dan inisialisasi tabel untuk terhubung ke MySQL.

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10);
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'catchat';

// Create connection pool (without database specified, for initial setup if needed)
const createPoolWithoutDB = () => {
  return mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
};

// Create connection pool (with database specified, for normal operations)
const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

module.exports = { pool, createPoolWithoutDB, dbName };
