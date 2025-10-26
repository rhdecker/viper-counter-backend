// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  }
});

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON request bodies

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected at:', res.rows[0].now);
  }
});

// ============================================
// API ENDPOINTS
// ============================================

// GET /api/count - Get current count
app.get('/api/count', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT count FROM counter_history ORDER BY id DESC LIMIT 1'
    );
    
    const currentCount = result.rows.length > 0 ? result.rows[0].count : 0;
    
    res.json({ count: currentCount });
  } catch (err) {
    console.error('Error getting count:', err);
    res.status(500).json({ error: 'Failed to get count' });
  }
});

// POST /api/count/increment - Increment count
app.post('/api/count/increment', async (req, res) => {
  try {
    // Get current count
    const currentResult = await pool.query(
      'SELECT count FROM counter_history ORDER BY id DESC LIMIT 1'
    );
    
    const currentCount = currentResult.rows.length > 0 ? currentResult.rows[0].count : 0;
    const newCount = currentCount + 1;
    
    // Insert new count
    const insertResult = await pool.query(
      'INSERT INTO counter_history (count) VALUES ($1) RETURNING *',
      [newCount]
    );
    
    res.json({
      count: newCount,
      timestamp: insertResult.rows[0].timestamp
    });
  } catch (err) {
    console.error('Error incrementing count:', err);
    res.status(500).json({ error: 'Failed to increment count' });
  }
});

// GET /api/history - Get last 10 counts
app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM counter_history ORDER BY timestamp DESC LIMIT 10'
    );
    
    res.json({ history: result.rows });
  } catch (err) {
    console.error('Error getting history:', err);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🐍 ViPER backend running on http://localhost:${PORT}`);
  console.log(`📊 Test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/count`);
  console.log(`   POST http://localhost:${PORT}/api/count/increment`);
  console.log(`   GET  http://localhost:${PORT}/api/history`);
});