const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

router.get('/login', (req, res) => {
    res.render('auth/login', { title: 'Login', error: null });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const db = req.app.get('db');
    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = { id: user.id, name: user.name, email: user.email };
            res.redirect('/');
        } else {
            res.render('auth/login', { title: 'Login', error: 'Invalid email or password!' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/register', (req, res) => {
    res.render('auth/register', { title: 'Register', error: null });
});

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const db = req.app.get('db');
    try {
        const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.render('auth/register', { title: 'Register', error: 'Email already registered!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
