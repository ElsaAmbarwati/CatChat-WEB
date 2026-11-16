// Penjelasan file dan tujuannya:
// Nama file: db.init.js
// Deskripsi: File inisialisasi database dan skema tabel.
// Mengarahkan ke/Keterkaitan:
// - Dipanggil oleh server.js saat startup untuk memastikan tabel tersedia.

const { pool, createPoolWithoutDB, dbName } = require('../config/database');

const initializeDatabase = async () => {
  // 1. Coba buat database jika belum ada (berguna saat local dev / database belum dibuat)
  let tempPool = null;
  try {
    tempPool = createPoolWithoutDB();
    await tempPool.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Database '${dbName}' ready or created.`);
  } catch (err) {
    // Di lingkungan cloud seperti Railway MySQL atau hosting dengan hak terbatas,
    // pembuatan database mungkin ditolak karena database bawaan sudah tersedia.
    console.warn(`ℹ️ Database creation step skipped (${err.message}). Connecting directly to pool...`);
  } finally {
    if (tempPool) {
      await tempPool.end().catch(() => {});
    }
  }

  // 2. Inisialisasi tabel menggunakan pool utama yang sudah terhubung langsung ke database
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        email_hash VARCHAR(64) NOT NULL UNIQUE,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        pin VARCHAR(255) DEFAULT NULL,
        avatar VARCHAR(50) DEFAULT 'pf1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table "users" is ready');

    // Create stories table (Dinding Doa)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        is_private TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table "stories" is ready');

    // Create prayers table (Doa/Like)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prayers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        story_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_prayer (story_id, user_id),
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table "prayers" is ready');

    // Create journals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS journals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) DEFAULT NULL,
        content TEXT NOT NULL,
        mood VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table "journals" is ready');

    console.log('🎉 All database tables initialized successfully!');
  } catch (error) {
    console.error('❌ Database tables initialization failed:', error.message);
    throw error;
  }
};

module.exports = { initializeDatabase };
