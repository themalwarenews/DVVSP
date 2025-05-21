const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../../db/database.db'));

// Insecure user profile (IDOR, info disclosure)
router.get('/:id', (req, res) => {
  db.get(`SELECT * FROM users WHERE id = ${req.params.id}`, (err, user) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch user' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Expose all user info, including password
    res.json(user);
  });
});

// Insecure user list (info disclosure)
router.get('/', (req, res) => {
  db.all('SELECT * FROM users', (err, users) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users' });
    res.json(users);
  });
});

// Insecure profile update (no auth, IDOR)
router.post('/update/:id', (req, res) => {
  const { username, password } = req.body;
  db.run(
    `UPDATE users SET username = '${username}', password = '${password}' WHERE id = ${req.params.id}`,
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update user' });
      res.json({ message: 'User updated', id: req.params.id, username, password });
    }
  );
});

module.exports = router;
