const express = require('express');
const db = require('../db/db');
const { getWorkSettings } = require('../db/db');
const { authenticateJWT } = require('./auth-middleware');

const router = express.Router();

// Middleware: check if user is admin (assumes req.user is set by auth middleware)
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Use authenticateJWT for all admin routes
router.use(authenticateJWT);

// GET /api/admin/users - List all users
router.get('/users', requireAdmin, (req, res) => {
  db.all('SELECT id, email, name, picture, role, createdAt FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(rows);
  });
});

// PATCH /api/admin/users/:id/role - Change user role
router.patch('/users/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  const userId = req.params.id;
  if (!role) return res.status(400).json({ error: 'Missing role' });
  db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User role updated', id: userId, role });
  });
});

// GET /api/admin/settings - Get work settings
router.get('/settings', requireAdmin, (req, res) => {
  getWorkSettings((err, settings) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(settings);
  });
});

// PATCH /api/admin/settings - Update work settings
router.patch('/settings', requireAdmin, (req, res) => {
  const { workDays, workStart, workEnd, bufferMinutes } = req.body;
  db.run(
    'INSERT INTO settings (workDays, workStart, workEnd, bufferMinutes) VALUES (?, ?, ?, ?)',
    [workDays.join(','), workStart, workEnd, bufferMinutes],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ message: 'Settings updated', id: this.lastID });
    }
  );
});

module.exports = router;
