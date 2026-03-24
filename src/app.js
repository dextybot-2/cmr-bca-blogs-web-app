const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const path = require('path');
const setupDb = require('./config/db');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

// Initialize Database
let db;
setupDb().then(database => {
    db = database;
    app.set('db', db);
    console.log('Database initialized successfully.');
}).catch(err => {
    console.error('Failed to initialize database:', err);
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'cute-secret-pink-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Global variables for views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/user');
const memoriesRoutes = require('./routes/memories');
const chatRoutes = require('./routes/chat');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/user', userRoutes);
app.use('/memories', memoriesRoutes);
app.use('/chat', chatRoutes);

// Socket.io Logic
io.on('connection', (socket) => {
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
    });

    socket.on('chatMessage', async (data) => {
        const { roomId, userId, userName, message } = data;
        
        try {
            const db = app.get('db');
            if (db) {
                await db.run(
                    'INSERT INTO messages (sender_id, group_id, content) VALUES (?, ?, ?)',
                    [userId, roomId, message]
                );

                io.to(roomId).emit('message', {
                    userId,
                    userName,
                    content: message,
                    created_at: new Date()
                });
            }
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });
});

http.listen(PORT, () => {
    console.log(`CMR-BCA BLOGS server running at http://localhost:${PORT}`);
});
