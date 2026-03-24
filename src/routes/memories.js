const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Multer Setup for Video Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/public/uploads/videos/');
    },
    filename: (req, file, cb) => {
        cb(null, 'video-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /mp4|webm|ogg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Only video files (mp4, webm, ogg) are allowed!"));
    }
});

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/auth/login');
};

router.get('/', async (req, res) => {
    const db = req.app.get('db');
    try {
        const memories = await db.all(`
            SELECT memories.*, users.name as user_name 
            FROM memories 
            JOIN users ON memories.user_id = users.id 
            ORDER BY created_at DESC
        `);
        res.render('memories/index', { title: 'Memories', memories });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/create', isAuthenticated, (req, res) => {
    res.render('memories/create', { title: 'Add Memory' });
});

router.post('/create', isAuthenticated, upload.single('video'), async (req, res) => {
    const { title } = req.body;
    const user_id = req.session.user.id;
    const video_path = req.file ? '/uploads/videos/' + req.file.filename : null;
    const db = req.app.get('db');

    if (!video_path) {
        return res.status(400).send('Please upload a video');
    }

    try {
        await db.run('INSERT INTO memories (user_id, title, video_path) VALUES (?, ?, ?)', [user_id, title, video_path]);
        res.redirect('/memories');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
