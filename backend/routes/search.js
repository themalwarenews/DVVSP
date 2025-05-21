const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../../db/database.db'));

// Insecure search endpoint (SQL injection, reflected XSS)
router.get('/', (req, res) => {
  const { q } = req.query;
  // SQL injection vulnerability
  db.all(
    `SELECT * FROM videos WHERE title LIKE '%${q}%' OR description LIKE '%${q}%'`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Search failed' });
      }
      // Reflected XSS: return unsanitized input and results
      res.send(`
        <h2>Search results for: ${q}</h2>
        <ul>
          ${rows
            .map(
              (video) =>
                `<li><b>${video.title}</b>: ${video.description} (<a href="/uploads/${video.filename}">Watch</a>)</li>`
            )
            .join('')}
        </ul>
      `);
    }
  );
});

module.exports = router;
