require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const bookingsRouter = require('./routes/bookings');
const authRouter = require('./routes/auth');
const paymentRouter = require('./routes/payment');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
// const corsOptions = {
//   origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
//   maxAge: 86400 // 24 hours
// };

// app.use(cors(corsOptions));

app.use(cors());

app.use(express.json());

// API routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/auth', authRouter);
app.use('/api/payment/flutterwave', express.json({ type: ['application/json', 'application/*+json'] }), paymentRouter);
app.use('/api/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
