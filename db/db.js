const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../bookings.db'), (err) => {
  if (err) {
    console.error('Could not connect to SQLite database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create bookings table if it doesn't exist
const createBookingsTableSql = `
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  endTime TEXT,
  type TEXT NOT NULL,
  cost TEXT,
  email TEXT,
  createdAt TEXT NOT NULL,
  paid INTEGER DEFAULT 0,
  meet_link TEXT
)`;
db.run(createBookingsTableSql);

// Create users table if it doesn't exist
const createUsersTableSql = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  picture TEXT,
  createdAt TEXT NOT NULL
)`;
db.run(createUsersTableSql);

// Create settings table for workdays, hours, and buffer if it doesn't exist
const createSettingsTableSql = `
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workDays TEXT DEFAULT '1,2,3,4,5',
  workStart INTEGER DEFAULT 9,
  workEnd INTEGER DEFAULT 17,
  bufferMinutes INTEGER DEFAULT 60
)`;
db.run(createSettingsTableSql);

// Helper to get workdays/hours/buffer from DB
function getWorkSettings(callback) {
  db.get('SELECT workDays, workStart, workEnd, bufferMinutes FROM settings ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err || !row) {
      // fallback to defaults
      return callback(null, { workDays: [1,2,3,4,5], workStart: 9, workEnd: 17, bufferMinutes: 60 });
    }
    callback(null, {
      workDays: row.workDays.split(',').map(Number),
      workStart: row.workStart,
      workEnd: row.workEnd,
      bufferMinutes: row.bufferMinutes || 60
    });
  });
}

module.exports = db;
module.exports.getWorkSettings = getWorkSettings;
