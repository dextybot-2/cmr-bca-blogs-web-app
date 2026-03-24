const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Multer Setup for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/auth/login');
};

router.get('/create', isAuthenticated, (req, res) => {
    res.render('posts/create', { title: 'New Post' });
});

router.post('/create', isAuthenticated, upload.single('image'), async (req, res) => {
    const { title, content, category } = req.body;
    const user_id = req.session.user.id;
    const image = req.file ? req.file.filename : null;
    const db = req.app.get('db');

    try {
        await db.run('INSERT INTO posts (user_id, title, content, image, category) VALUES (?, ?, ?, ?, ?)', [user_id, title, content, image, category]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/like', isAuthenticated, async (req, res) => {
    const { post_id } = req.body;
    const user_id = req.session.user.id;
    const db = req.app.get('db');

    try {
        const like = await db.get('SELECT * FROM likes WHERE post_id = ? AND user_id = ?', [post_id, user_id]);
        if (like) {
            await db.run('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [post_id, user_id]);
        } else {
            await db.run('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [post_id, user_id]);
        }
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/comment', isAuthenticated, async (req, res) => {
    const { post_id, comment } = req.body;
    const user_id = req.session.user.id;
    const db = req.app.get('db');

    try {
        await db.run('INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)', [post_id, user_id, comment]);
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
