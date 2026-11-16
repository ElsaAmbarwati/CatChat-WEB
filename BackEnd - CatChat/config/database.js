// Penjelasan file dan tujuannya:
// Nama file: database.js
// Deskripsi: File konfigurasi atau koneksi database MySQL / TiDB Cloud.
// Mengarahkan ke/Keterkaitan:
// - Digunakan oleh controller dan inisialisasi tabel untuk terhubung ke MySQL.

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10);
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'catchat';

// Cloud MySQL (seperti TiDB Cloud di port 4000) memerlukan koneksi terenkripsi SSL/TLS
const sslConfig =
  process.env.DB_SSL === 'true' || dbPort === 4000
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    : undefined;

// Create connection pool (without database specified, for initial setup if needed)
const createPoolWithoutDB = () => {
  const config = {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
  if (sslConfig) config.ssl = sslConfig;
  return mysql.createPool(config);
};

// Create connection pool (with database specified, for normal operations)
const poolConfig = {
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
};
if (sslConfig) poolConfig.ssl = sslConfig;

const pool = mysql.createPool(poolConfig);

module.exports = { pool, createPoolWithoutDB, dbName };
