const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../../db/database.db'));

// Insecure add comment endpoint (no auth, XSS)
router.post('/add', (req, res) => {
  const { videoId, userId, comment } = req.body;
  db.run(
    `INSERT INTO comments (video_id, user_id, comment) VALUES (${videoId}, ${userId}, '${comment}')`,
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to add comment' });
      res.json({ id: this.lastID, videoId, userId, comment });
    }
  );
});

// Insecure get comments endpoint (no output encoding)
router.get('/:videoId', (req, res) => {
  db.all(
    `SELECT * FROM comments WHERE video_id = ${req.params.videoId}`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch comments' });
      // XSS: return unsanitized comments
      res.send(
        `<ul>${rows
          .map(
            (c) => `<li>User ${c.user_id}: ${c.comment}</li>`
          )
          .join('')}</ul>`
      );
    }
  );
});

module.exports = router;
