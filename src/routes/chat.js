const express = require('express');
const router = express.Router();

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/auth/login');
};

router.get('/', isAuthenticated, async (req, res) => {
    const db = req.app.get('db');
    try {
        const groups = await db.all('SELECT * FROM chat_groups ORDER BY created_at DESC');
        res.render('chat/index', { title: 'Chat Groups', groups });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/groups/create', isAuthenticated, async (req, res) => {
    const { name } = req.body;
    const user_id = req.session.user.id;
    const db = req.app.get('db');

    try {
        const result = await db.run('INSERT INTO chat_groups (name, created_by) VALUES (?, ?)', [name, user_id]);
        const groupId = result.lastID;
        await db.run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, user_id]);
        res.redirect('/chat');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/groups/:id', isAuthenticated, async (req, res) => {
    const groupId = req.params.id;
    const db = req.app.get('db');

    try {
        const group = await db.get('SELECT * FROM chat_groups WHERE id = ?', [groupId]);
        if (!group) return res.status(404).send('Group not found');

        // Check if user is a member, if not, add them (simple logic for now)
        const membership = await db.get('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, req.session.user.id]);
        if (!membership) {
            await db.run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, req.session.user.id]);
        }

        const messages = await db.all(`
            SELECT messages.*, users.name as user_name 
            FROM messages 
            JOIN users ON messages.sender_id = users.id 
            WHERE group_id = ? 
            ORDER BY created_at ASC
        `, [groupId]);

        res.render('chat/group', { title: group.name, group, messages });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
