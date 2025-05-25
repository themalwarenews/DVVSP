const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const mime = require('mime'); // For dynamic content types
const db = new sqlite3.Database(path.join(__dirname, '../../db/database.db'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../frontend/public/uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: function (req, file, cb) {
    // Vulnerability: Bypass validation if bypassValidation=true is in the query
    if (req.query.bypassValidation === 'true') {
      return cb(null, true);
    }
    const filetypes = /mp4|mov|avi|mkv/; // Added MKV
    const mimetypetest = filetypes.test(file.mimetype);
    const extnametest = filetypes.test(path.extname(file.originalname).toLowerCase());

    // Looser check: allow if either mimetype or extension matches for broader compatibility,
    // especially for MKV which might have various mimetypes like video/x-matroska
    if (mimetypetest || extnametest) {
      // For MKV, explicitly check common mimetypes if extension matches
      if (path.extname(file.originalname).toLowerCase() === '.mkv') {
        const mkvMimeTypes = ['video/mkv', 'video/x-matroska'];
        if (mkvMimeTypes.includes(file.mimetype) || extnametest) { // also allow if extension was .mkv
             return cb(null, true);
        }
      } else if (mimetypetest && extnametest) { // For other types, require both for stricter validation
        return cb(null, true);
      } else if (mimetypetest || extnametest) { // If only one matches for non-MKV, accept but log warning
        // This part is a bit sketchy as requested - allowing if one matches
        // console.warn(`Warning: File ${file.originalname} passed filter with partial match: mimetype ${file.mimetype}, ext ${path.extname(file.originalname)}`);
        return cb(null, true); 
      }
    }
    cb(new Error('Error: File upload only supports the following filetypes - mp4, mov, avi, mkv. Provided: ' + file.mimetype + ' / ' + path.extname(file.originalname)));
  }
});

// Enhanced video upload endpoint
router.post('/upload', upload.single('video'), (req, res) => {
  const { title, description, userId, isPublic, password } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Basic sanitization for isPublic
  const isPublicBool = typeof isPublic === 'string' ? isPublic.toLowerCase() === 'true' : Boolean(isPublic);
  const videoPassword = password && password.length > 0 ? `'${password}'` : null; // Store as string or NULL

  // SQL Injection vulnerability deliberately introduced for title and description
  // IMPORTANT: Only title and description are vulnerable. Other fields are parameterized.
  const sql = `INSERT INTO videos (title, description, filename, user_id, is_public, password) VALUES ('${title.replace(/'/g, "''")}', '${description.replace(/'/g, "''")}', ?, ?, ?, ?)`;
  const params = [file.filename, userId, isPublicBool, videoPassword ? password : null];

  db.run(sql, params, function (err) {
    if (err) {
      if (err.message && err.message.startsWith('Error: File upload only supports')) {
        return res.status(400).json({ error: err.message });
      }
      console.error("DB Error:", err.message);
      return res.status(500).json({ error: 'Upload failed due to server error' });
    }
    res.json({ id: this.lastID, title, description, filename: file.filename, is_public: isPublicBool, password_protected: !!videoPassword });
  });
});

// Route to list all videos
router.get('/', (req, res) => {
  const sql = `SELECT id, title, description, filename, is_public, CASE WHEN password IS NOT NULL AND password != '' THEN 1 ELSE 0 END AS password_protected FROM videos`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("DB Error fetching videos:", err.message);
      return res.status(500).json({ error: 'Failed to retrieve videos' });
    }
    // Ensure that password_protected is treated as a boolean in the response
    const videos = rows.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      filename: video.filename,
      is_public: video.is_public,
      password_protected: Boolean(video.password_protected)
    }));
    res.json(videos);
  });
});

// Insecure video retrieval (IDOR, path traversal) - kept for other purposes if any, streaming is preferred
router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../frontend/public/uploads', filename);
  // This route is problematic for access control, /stream/:filename should be used for playback
  console.warn(`Direct access to /${filename} used, consider using /stream/${filename} for controlled streaming.`);
  res.sendFile(filePath); // Still allows path traversal and bypasses new privacy rules
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

// New video streaming endpoint with privacy checks and path traversal vulnerability
router.get('/stream/:filename', (req, res) => {
  const videoFilename = req.params.filename;
  // Vulnerability: Direct use of filename without sanitization for filePath, allowing path traversal
  const filePath = path.join(__dirname, '../../frontend/public/uploads', videoFilename);

  // TODO: Implement Adaptive Bitrate Streaming (ABS)
  // This would involve:
  // 1. Transcoding uploaded videos into multiple resolutions/bitrates (e.g., using ffmpeg).
  // 2. Storing these different versions.
  // 3. Implementing logic to serve a manifest file (e.g., HLS .m3u8 or DASH .mpd).
  // 4. Modifying the client-side player to use an ABS-compatible library (like Hls.js or Shaka Player).
  // For now, we are streaming the raw uploaded file.

  // Fetch video details from DB to check privacy
  // SQL Injection still possible if filename is crafted, though less direct for this query
  db.get(`SELECT is_public, password FROM videos WHERE filename = ?`, [videoFilename], (err, video) => {
    if (err) {
      console.error("DB Error fetching video for streaming:", err.message);
      return res.status(500).json({ error: 'Server error checking video privacy' });
    }
    if (!video) {
      return res.status(404).json({ error: 'Video metadata not found' });
    }

    // Privacy checks
    if (!video.is_public) {
      if (video.password) { // Private and password protected
        // VULNERABILITY NOTE: Plaintext password comparison.
        // In a real-world scenario, passwords should be securely hashed.
        // This direct comparison is also theoretically susceptible to timing attacks,
        // especially if character-by-character comparison was used with early exit.
        // Node.js's default string comparison is generally optimized, making it harder
        // to exploit timing attacks without specific conditions, but the principle remains.
        if (!req.query.password || req.query.password !== video.password) {
          return res.status(403).json({ error: 'Incorrect or missing password for private video.' });
        }
        // Password matches, allow streaming
      } else { // Private, no password
        return res.status(403).json({ error: 'This video is private and not directly streamable without a password mechanism or ownership check (not implemented).' });
      }
    }

    // Proceed with streaming if public or password check passed
    fs.stat(filePath, (statErr, stat) => {
      if (statErr) {
        if (statErr.code === 'ENOENT') {
          return res.status(404).json({ error: 'Video file not found on server' });
        }
        return res.status(500).json({ error: 'Error accessing video file' });
      }

      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        if (start >= fileSize || end >= fileSize || start > end) {
            res.status(416).send('Requested Range Not Satisfiable');
            return;
        }
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mime.getType(filePath) || 'video/mp4', // Dynamic Content-Type
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': mime.getType(filePath) || 'video/mp4', // Dynamic Content-Type
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    });
  });
});

// New Share endpoint (IDOR vulnerability by not checking ownership)
router.post('/share/:id', (req, res) => {
  const videoId = req.params.id;
  // SQL Injection for videoId if not properly handled by express/db driver for params
  db.get(`SELECT filename, is_public, password FROM videos WHERE id = ?`, [videoId], (err, video) => {
    if (err) {
      console.error("DB Error sharing video:", err.message);
      return res.status(500).json({ error: 'Server error' });
    }
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    // Simple link, frontend will handle password prompt if needed
    const shareLink = `/api/videos/stream/${video.filename}`;
    res.json({
      shareLink,
      isPublic: video.is_public,
      passwordProtected: !!video.password
    });
  });
});

// New Consolidated Privacy settings endpoint (IDOR vulnerability by not checking ownership)
router.post('/privacy/:id', (req, res) => {
  const videoId = req.params.id;
  const { isPublic, password } = req.body;

  // Basic validation
  if (typeof isPublic !== 'boolean') {
    return res.status(400).json({ error: 'isPublic must be a boolean.' });
  }

  let newPassword = null;
  if (!isPublic && password && password.length > 0) {
      newPassword = password; // Store provided password only if private and password is not empty
  }

  // SQL Injection for videoId if not properly handled; password also if not parameterized
  const sql = `UPDATE videos SET is_public = ?, password = ? WHERE id = ?`;
  db.run(sql, [isPublic, newPassword, videoId], function(err) {
    if (err) {
      console.error("DB Error updating privacy:", err.message);
      return res.status(500).json({ error: 'Failed to update privacy settings.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Video not found to update.' });
    }
    res.json({ message: 'Privacy settings updated successfully.', id: videoId, isPublic, passwordProtected: !!newPassword });
  });
});

// Insecure view for password-protected videos (no rate limiting, info disclosure) - This might be redundant now
// Consider removing if /stream handles password checks properly.
// For now, it's left but might conflict or provide an alternative way to check passwords.
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
  const videoId = req.params.id;
  // SQL Injection possible for videoId
  db.get(`SELECT filename FROM videos WHERE id = ?`, [videoId], (err, video) => {
    if (err || !video) return res.status(404).json({ error: 'Video not found' });
    const filePath = path.join(__dirname, '../../frontend/public/uploads', video.filename);
    // SQL Injection possible for videoId
    db.run(`DELETE FROM videos WHERE id = ?`, [videoId], (deleteErr) => {
        if (deleteErr) {
            console.error("DB Error deleting video:", deleteErr.message);
            return res.status(500).json({ error: 'Failed to delete video metadata.' });
        }
        // Attempt to delete file, ignore errors
        try { fs.unlinkSync(filePath); } catch (e) { console.warn("File deletion error:", e.message); }
        // Expose internal file path
        res.json({ message: 'Video deleted', id: videoId, filePath });
    });
    // Attempt to delete file, ignore errors
    try { fs.unlinkSync(filePath); } catch (e) {}
    // Expose internal file path
    res.json({ message: 'Video deleted', id: req.params.id, filePath });
  });
});

module.exports = router;
