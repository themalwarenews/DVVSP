const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, '../../db/database.db'));

// Insecure storage: uploads to public/uploads, no file type/size checks
const upload = multer({ dest: path.join(__dirname, '../../frontend/public/uploads') });

// Insecure video upload endpoint
router.post('/upload', upload.single('video'), (req, res) => {
  const { title, description, userId } = req.body;
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // No validation or sanitization
  db.run(
    `INSERT INTO videos (title, description, filename, user_id) VALUES ('${title}', '${description}', '${file.filename}', ${userId})`,
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Upload failed' });
      }
      res.json({ id: this.lastID, title, description, filename: file.filename });
    }
  );
});

// Insecure video retrieval (IDOR, path traversal)
router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../frontend/public/uploads', filename);
  // No checks for file existence, no auth, allows path traversal
  res.sendFile(filePath);
});

// Insecure like endpoint (no auth, no rate limiting)
router.post('/like/:id', (req, res) => {
  db.run(
    `UPDATE videos SET likes = COALESCE(likes,0) + 1 WHERE id = ${req.params.id}`,
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to like video' });
      res.json({ message: 'Video liked', id: req.params.id });
    }
  );
});

// Insecure report endpoint (no validation, XSS)
router.post('/report/:id', (req, res) => {
  const { reason } = req.body;
  db.run(
    `INSERT INTO reports (video_id, reason) VALUES (${req.params.id}, '${reason}')`,
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to report video' });
      res.send(`<b>Report submitted for video ${req.params.id}:</b> ${reason}`);
    }
  );
});

// Insecure share endpoint (no auth, IDOR)
router.get('/share/:id', (req, res) => {
  db.get(`SELECT * FROM videos WHERE id = ${req.params.id}`, (err, video) => {
    if (err || !video) return res.status(404).json({ error: 'Video not found' });
    // Insecurely generate a public link (no auth, no validation)
    res.json({ shareLink: `/videos/${video.filename}` });
  });
});

// Insecure privacy toggle (no auth, IDOR)
router.post('/privacy/:id', (req, res) => {
  const { isPublic } = req.body; // expects true/false
  db.run(
    `UPDATE videos SET is_public = ${isPublic ? 1 : 0} WHERE id = ${req.params.id}`,
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update privacy' });
      res.json({ message: 'Privacy updated', id: req.params.id, isPublic });
    }
  );
});

// Insecure password protection (no auth, plaintext password)
router.post('/set-password/:id', (req, res) => {
  const { password } = req.body;
  db.run(
    `UPDATE videos SET password = '${password}' WHERE id = ${req.params.id}`,
    function (err) {
      if (err) return res.status(500).json({ error: 'Failed to set password' });
      res.json({ message: 'Password set for video', id: req.params.id, password });
    }
  );
});

// Insecure view for password-protected videos (no rate limiting, info disclosure)
router.post('/view-protected/:id', (req, res) => {
  const { password } = req.body;
  db.get(`SELECT * FROM videos WHERE id = ${req.params.id}`, (err, video) => {
    if (err || !video) return res.status(404).json({ error: 'Video not found' });
    if (video.password && video.password !== password) {
      // Info disclosure: reveal correct password in error
      return res.status(403).json({ error: 'Incorrect password', correctPassword: video.password });
    }
    res.json({ message: 'Access granted', video });
  });
});

// Insecure download endpoint (path traversal)
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../frontend/public/uploads', filename);
  // No sanitization, allows path traversal
  res.download(filePath, (err) => {
    if (err) {
      // Expose internal error and file path
      return res.status(500).json({ error: err.message, filePath });
    }
  });
});

// Insecure video deletion (no auth, no checks)
router.delete('/delete/:id', (req, res) => {
  db.get(`SELECT * FROM videos WHERE id = ${req.params.id}`, (err, video) => {
    if (err || !video) return res.status(404).json({ error: 'Video not found' });
    const filePath = path.join(__dirname, '../../frontend/public/uploads', video.filename);
    db.run(`DELETE FROM videos WHERE id = ${req.params.id}`);
    // Attempt to delete file, ignore errors
    try { fs.unlinkSync(filePath); } catch (e) {}
    // Expose internal file path
    res.json({ message: 'Video deleted', id: req.params.id, filePath });
  });
});

module.exports = router;
