require('dotenv').config();

const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const app = express();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT)
};

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL Database:', err);
        return;
    }
    console.log(`Successfully connected to MySQL at ${dbConfig.host}:${dbConfig.port} using database ${dbConfig.database}`);
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;
    const sqlQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';

    db.query(sqlQuery, [name, email, password], (err) => {
        if (err) {
            if (err.errno === 1062) {
                console.log(`Signup blocked: Email ${email} already exists.`);
                return res.send("<h1>An account with this email address already exists.</h1><a href='/login.html'>Go to Log In</a>");
            }

            console.error('Database insert error:', err);
            return res.status(500).send('<h1>Database error occurred during registration.</h1>');
        }

        console.log('User saved to MySQL successfully!');
        return res.redirect('/login.html');
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sqlQuery = 'SELECT * FROM users WHERE email = ? AND password = ?';

    db.query(sqlQuery, [email, password], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('<h1>Database error occurred during login.</h1>');
        }

        if (results.length > 0) {
            req.session.user = {
                id: results[0].userId,
                name: results[0].name
            };
            console.log(`User logged in successfully: ${results[0].name}`);
            return res.redirect('/index.html');
        }

        return res.send("<h1>Invalid email or password.</h1><a href='/login.html'>Try Again</a>");
    });
});

app.get('/api/current-user', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, name: req.session.user.name });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/workouts', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ workouts: [] });
    }

    const userId = req.session.user.id;
    const sqlQuery = 'SELECT workoutId, date, activity, duration, intensity, notes FROM workoutlog WHERE userId = ? ORDER BY date DESC';

    db.query(sqlQuery, [userId], (err, results) => {
        if (err) {
            console.error('Database workout load error:', err);
            return res.status(500).json({ workouts: [], message: 'Failed to load workouts.' });
        }

        const workouts = results.map((row) => ({
            id: row.workoutId,
            date: row.date,
            name: row.activity,
            duration: row.duration,
            intensity: row.intensity,
            notes: row.notes,
        }));

        return res.json({ workouts });
    });
});

app.post('/api/log-workout', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send("<h1>Unauthorized. Please log in first.</h1><a href='/login.html'>Go to Login</a>");
    }

    const { date, activity, duration, intensity, notes } = req.body;
    const userId = req.session.user.id;
    const sqlQuery = 'INSERT INTO workoutlog (userId, date, activity, duration, intensity, notes) VALUES (?, ?, ?, ?, ?, ?)';

    db.query(sqlQuery, [userId, date, activity, duration, intensity, notes || null], (err) => {
        if (err) {
            console.error('Database workout save error:', err);
            return res.status(500).json({ success: false, message: 'Failed to save workout to the database.' });
        }

        console.log(`Workout saved successfully for User ID ${userId}!`);
        return res.json({ success: true, message: 'Workout saved successfully!' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started! Open http://localhost:${PORT}/signup.html in your browser.`);
});
