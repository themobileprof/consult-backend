const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db'); // Adjust the path as necessary

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential' });
  }
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const user = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub,
    };
    // Store user in DB if not exists
    const createdAt = new Date().toISOString();
    db.run(
      'INSERT OR IGNORE INTO users (email, name, picture, createdAt) VALUES (?, ?, ?, ?)',
      [user.email, user.name, user.picture, createdAt]
    );
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google credential' });
  }
});

module.exports = router;
