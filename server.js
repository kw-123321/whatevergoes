const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session'); // Required for user profile sessions
const app = express();

// 1. Establish connection to your MySQL database schema
// Use environment variables so collaborators can connect to a shared remote database.
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || 'RP738964$';
const dbName = process.env.DB_NAME || 'c270_fitnesstrackerusers';

const db = mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL Database:', err);
        return;
    }
    console.log(`Successfully connected to MySQL at ${dbHost}:${dbPort} using database ${dbName}`);
});

// 2. Session Middleware Setup (Helps the server remember who logged in)
app.use(session({
    secret: 'fitness_tracker_secret_key', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Session cookie lasts for 1 day
}));

// 3. Serves your static HTML/CSS files from this folder
app.use(express.static(__dirname));

// 4. Allows the server to parse form and JSON data sent from your pages
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 5. SIGNUP ROUTE (With Duplicate Email Checking)
app.post('/signup', (req, res) => {
    const { name, email, password } = req.body; 
    
    const sqlQuery = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    
    db.query(sqlQuery, [name, email, password], (err, result) => {
        if (err) {
            // Check if the error is due to a duplicate entry (MySQL unique error code 1062)
            if (err.errno === 1062) {
                console.log(`Signup blocked: Email ${email} already exists.`);
                return res.send("<h1>An account with this email address already exists.</h1><a href='/login.html'>Go to Log In</a>");
            }
            
            console.error("Database insert error:", err);
            return res.status(500).send("<h1>Database error occurred during registration.</h1>");
        }

        console.log("User saved to MySQL successfully!"); 
        return res.redirect('/login.html');
    });
});

// 6. LOGIN ROUTE (Validates credentials and initializes the session)
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sqlQuery = "SELECT * FROM users WHERE email = ? AND password = ?";

    db.query(sqlQuery, [email, password], (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("<h1>Database error occurred during login.</h1>");
        }

        if (results.length > 0) {
            // Store the user's name and unique ID into the session store!
            req.session.user = {
                id: results[0].userId,
                name: results[0].name
            };
            console.log(`User logged in successfully: ${results[0].name}`);
            return res.redirect('/index.html');
        } else {
            return res.send("<h1>Invalid email or password.</h1><a href='/login.html'>Try Again</a>");
        }
    });
});

// 7. PROFILE API ROUTE (Frontend HTML files fetch from here to find out who is logged in)
app.get('/api/current-user', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, name: req.session.user.name });
    } else {
        res.json({ loggedIn: false });
    }
});

// 8. WORKOUTS API ROUTE (Returns logged-in user's workouts from MySQL)
app.get('/api/workouts', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ workouts: [] });
    }

    const userId = req.session.user.id;
    const sqlQuery = "SELECT workoutId, date, activity, duration, intensity, notes FROM workoutlog WHERE userId = ? ORDER BY date DESC";

    db.query(sqlQuery, [userId], (err, results) => {
        if (err) {
            console.error("Database workout load error:", err);
            return res.status(500).json({ workouts: [], message: "Failed to load workouts." });
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

// 9. LOG WORKOUT ROUTE (Saves workout data linked to the logged-in user)
app.post('/api/log-workout', (req, res) => {
    // 1. Make sure a user is actually logged in before saving a workout
    if (!req.session.user) {
        return res.status(401).send("<h1>Unauthorized. Please log in first.</h1><a href='/login.html'>Go to Login</a>");
    }

    // 2. Extract the data sent from the frontend form
    const { date, activity, duration, intensity, notes } = req.body;
    
    // Grab the active user's ID from their session token
    const userId = req.session.user.id; 

    // 3. Match the columns in your MySQL workbench table perfectly
    const sqlQuery = "INSERT INTO workoutlog (userId, date, activity, duration, intensity, notes) VALUES (?, ?, ?, ?, ?, ?)";
    
    db.query(sqlQuery, [userId, date, activity, duration, intensity, notes || null], (err, result) => {
        if (err) {
            console.error("Database workout save error:", err);
            return res.status(500).json({ success: false, message: "Failed to save workout to the database." });
        }
        
        console.log(`Workout saved successfully for User ID ${userId}!`);
        // Send a success JSON response back to your frontend script
        return res.json({ success: true, message: "Workout saved successfully!" });
    });
});

// 8. Start the server on Port 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server started! Open http://localhost:${PORT}/signup.html in your browser.`);
});