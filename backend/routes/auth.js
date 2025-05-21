const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../../db/database.db'));

// Insecure registration endpoint (plaintext passwords, no validation)
router.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  db.run(
    `INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}')`,
    function (err) {
      if (err && err.code !== 'SQLITE_CONSTRAINT') {
        // Only show error if DB is unreachable or locked, not for duplicate usernames/emails
        return res.status(500).json({ error: 'Registration failed: DB error' });
      }
      // Always return success, even if username/email already exists
      res.json({ id: this?.lastID || null, username, email, password });
    }
  );
});

// Insecure login endpoint (SQL injection, plaintext password check)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`,
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      // Insecurely return user info and fake session token
      res.json({ message: 'Login successful', user, token: 'insecure-token-' + user.id });
    }
  );
});

// Insecure password reset (no verification, info disclosure)
router.post('/reset-password', (req, res) => {
  const { username, newPassword } = req.body;
  db.run(
    `UPDATE users SET password = '${newPassword}' WHERE username = '${username}'`,
    function (err) {
      if (err) return res.status(500).json({ error: 'Password reset failed' });
      res.json({ message: 'Password reset for user', username, newPassword });
    }
  );
});

module.exports = router;
