const express = require('express');
const axios = require('axios');
const { addBookingToGoogleCalendar } = require('../db/googleCalendar');
const db = require('../db/db');

const router = express.Router();

// POST /api/payment/flutterwave/initiate
router.post('/initiate', async (req, res) => {
  const { amount, email, name, tx_ref, redirect_url } = req.body;
  if (!amount || !email || !name || !tx_ref || !redirect_url) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref,
        amount,
        currency: 'USD',
        redirect_url,
        customer: { email, name },
        payment_options: 'card',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Flutterwave payment initiation failed', details: err.response?.data || err.message });
  }
});

// POST /api/payment/flutterwave/verify
router.post('/verify', async (req, res) => {
  const { transaction_id } = req.body;
  if (!transaction_id) {
    return res.status(400).json({ error: 'Missing transaction_id' });
  }
  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Flutterwave verification failed', details: err.response?.data || err.message });
  }
});

// Flutterwave Webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const signature = req.headers['verif-hash'];
  if (!signature || signature !== secretHash) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  // Handle payment event (e.g., update booking/payment status)
  if (event.event === 'charge.completed' && event.data.status === 'successful') {
    // Find booking by tx_ref and mark as paid
    const tx_ref = event.data.tx_ref;
    if (tx_ref) {
      db.get('SELECT * FROM bookings WHERE cost = ? AND email = ? ORDER BY createdAt DESC LIMIT 1', [event.data.amount, event.data.customer?.email || ''], async (err, booking) => {
        if (!err && booking) {
          db.run('UPDATE bookings SET paid = 1 WHERE id = ?', [booking.id]);
          const meetLink = await addBookingToGoogleCalendar(booking);
          if (meetLink) {
            db.run('UPDATE bookings SET meet_link = ? WHERE id = ?', [meetLink, booking.id]);
          }
        }
      });
    }
  }
  res.status(200).json({ status: 'success' });
});

module.exports = router;
