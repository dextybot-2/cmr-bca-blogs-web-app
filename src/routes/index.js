const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    const db = req.app.get('db');
    const { search } = req.query;
    try {
        let sql = `
            SELECT posts.*, users.name as user_name, users.avatar as user_avatar,
            (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) as likes_count
            FROM posts
            JOIN users ON posts.user_id = users.id
        `;
        let params = [];
        
        if (search) {
            sql += ` WHERE posts.title LIKE ? OR posts.content LIKE ? OR posts.category LIKE ?`;
            params = [`%${search}%`, `%${search}%`, `%${search}%` ];
        }
        
        sql += ` ORDER BY posts.created_at DESC`;
        
        const posts = await db.all(sql, params);

        // Sidebar content: Trending/Sweet Picks
        const sweetPicks = await db.all(`
            SELECT posts.id, posts.title, COUNT(likes.id) as likes_count 
            FROM posts 
            LEFT JOIN likes ON posts.id = likes.post_id 
            GROUP BY posts.id 
            ORDER BY likes_count DESC LIMIT 5
        `);

        for (let post of posts) {
            post.comments = await db.all(`
                SELECT comments.*, users.name as user_name
                FROM comments
                JOIN users ON comments.user_id = users.id
                WHERE post_id = ?
                ORDER BY created_at ASC
            `, [post.id]);
            // Reading time calculation
            const wordsPerMinute = 200;
            post.reading_time = Math.ceil(post.content.split(' ').length / wordsPerMinute);
        }

        res.render('index', { title: 'Home', posts, sweetPicks, search });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
