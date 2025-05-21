const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../../db/database.db'));

// Insecure admin panel: no authentication or authorization
router.get('/users', (req, res) => {
  db.all('SELECT * FROM users', (err, users) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users' });
    // Expose all user data, including passwords
    res.json(users);
  });
});

router.get('/videos', (req, res) => {
  db.all('SELECT * FROM videos', (err, videos) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch videos' });
    res.json(videos);
  });
});

// Insecure delete user (no auth, no checks)
router.delete('/user/:id', (req, res) => {
  db.run(`DELETE FROM users WHERE id = ${req.params.id}`, function (err) {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ message: 'User deleted', id: req.params.id });
  });
});

// Insecure promote to admin (no auth)
router.post('/promote/:id', (req, res) => {
  db.run(
    `UPDATE users SET role = 'admin' WHERE id = ${req.params.id}`,
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to promote user' });
      res.json({ message: 'User promoted to admin', id: req.params.id });
    }
  );
});

module.exports = router;
