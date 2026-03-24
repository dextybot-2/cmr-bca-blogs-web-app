const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Multer Setup for Avatar Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'avatar-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/auth/login');
};

router.get('/dashboard', isAuthenticated, async (req, res) => {
    const db = req.app.get('db');
    const user_id = req.session.user.id;
    try {
        const posts = await db.all('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
        const user = await db.get('SELECT * FROM users WHERE id = ?', [user_id]);
        res.render('user/dashboard', { title: 'Dashboard', posts, profile: user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/update', isAuthenticated, upload.single('avatar'), async (req, res) => {
    const { name, bio } = req.body;
    const user_id = req.session.user.id;
    const db = req.app.get('db');
    
    let avatar = req.session.user.avatar;
    if (req.file) {
        avatar = req.file.filename;
    }

    try {
        await db.run('UPDATE users SET name = ?, bio = ?, avatar = ? WHERE id = ?', [name, bio, avatar, user_id]);
        
        // Update session
        req.session.user.name = name;
        req.session.user.avatar = avatar;
        
        res.redirect('/user/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
