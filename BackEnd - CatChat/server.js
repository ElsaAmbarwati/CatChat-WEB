// Penjelasan file dan tujuannya:
// Nama file: server.js
// Deskripsi: File utama yang menjalankan seluruh server Node.js dan menyajikan Flutter Web.
// Mengarahkan ke/Keterkaitan:
// - Menjalankan server di port tertentu.
// - Menghubungkan seluruh folder routes agar bisa diakses oleh aplikasi Frontend.
// - Menyajikan static build Flutter Web pada domain yang sama.

const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initializeDatabase } = require('./models/db.init');

// Import routes
const authRoutes = require('./routes/auth.routes');
const storyRoutes = require('./routes/story.routes');
const profileRoutes = require('./routes/profile.routes');
const journalRoutes = require('./routes/journal.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================

// CORS - Allow requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ============================================
// Static Files (Flutter Web)
// ============================================
const frontendBuildPath = path.join(__dirname, '../FrontEnd - CatChat/build/web');
app.use(express.static(frontendBuildPath));

// ============================================
// Routes
// ============================================

// Health check API
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🐱 CatChat (AnonHeart) API Server is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      stories: '/api/stories',
      profile: '/api/profile',
      journals: '/api/journals',
      ai: '/api/ai',
    },
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/ai', aiRoutes);

// Fallback to Flutter Web index.html for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// ============================================
// Error Handling
// ============================================

// 404 handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.url} tidak ditemukan.`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal server.',
  });
});

// ============================================
// Start Server
// ============================================

const startServer = async () => {
  try {
    // Initialize database and tables
    console.log('🔧 Initializing database...');
    await initializeDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('==========================================');
      console.log(`🐱 CatChat Fullstack Server`);
      console.log(`📡 Running on http://localhost:${PORT}`);
      console.log(`🌐 Serving Web from: ${frontendBuildPath}`);
      console.log(`📦 Database: ${process.env.DB_NAME || 'catchat'}`);
      console.log('==========================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
