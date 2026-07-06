const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const session = require('express-session');
const app = express();

<<<<<<< HEAD
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const WORKOUTS_FILE = path.join(DATA_DIR, 'workouts.json');
const attachmentPath = path.join(__dirname, 'files', 'welcome-attachment.txt');

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(WORKOUTS_FILE)) {
    fs.writeFileSync(WORKOUTS_FILE, JSON.stringify([], null, 2));
  }
}

function readJsonFile(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getUsers() {
  ensureDataFiles();
  return readJsonFile(USERS_FILE, []);
}

function saveUsers(users) {
  ensureDataFiles();
  writeJsonFile(USERS_FILE, users);
}

function getWorkouts() {
  ensureDataFiles();
  return readJsonFile(WORKOUTS_FILE, []);
}

function saveWorkouts(workouts) {
  ensureDataFiles();
  writeJsonFile(WORKOUTS_FILE, workouts);
}

function createEmailTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to enable email delivery.');
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

async function sendLoginEmail(address, name) {
  if (!fs.existsSync(attachmentPath)) {
    console.warn(`Attachment file not found at ${attachmentPath}`);
    return false;
  }

  const transporter = createEmailTransporter();
  if (!transporter) {
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: address,
      subject: 'Your fitness tracker file',
      text: `Hello ${name}, your login was successful. The attached file is included for you.`,
      attachments: [{
        filename: 'welcome-attachment.txt',
        path: attachmentPath,
      }],
    });

    console.log(`Email sent successfully to ${address}`);
    return true;
  } catch (err) {
    console.error('Failed to send login email:', err);
    return false;
  }
}
=======
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
>>>>>>> 0d8ad2d3f94b0a4ba5ce907b65110187408ae31a

app.use(session({
  secret: 'fitness_tracker_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.get('/download/welcome-attachment', (req, res) => {
  if (!fs.existsSync(attachmentPath)) {
    return res.status(404).send('<h1>Attachment file not found.</h1>');
  }

  return res.download(attachmentPath, 'welcome-attachment.txt');
});

app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  const users = getUsers();
  const existingUser = users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());

  if (existingUser) {
    console.log(`Signup blocked: Email ${email} already exists.`);
    return res.send("<h1>An account with this email address already exists.</h1><a href='/login.html'>Go to Log In</a>");
  }

  users.push({
    id: Date.now(),
    name,
    email,
    password,
  });
  saveUsers(users);

  console.log(`User saved successfully: ${email}`);
  return res.redirect('/login.html');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = getUsers();
  const user = users.find((entry) => entry.email.toLowerCase() === String(email).toLowerCase() && entry.password === password);

  if (user) {
    req.session.user = {
      id: user.id,
      name: user.name,
    };
    console.log(`User logged in successfully: ${user.name}`);
    await sendLoginEmail(email, user.name);
    return res.redirect('/download/welcome-attachment');
  }

  return res.send("<h1>Invalid email or password.</h1><a href='/login.html'>Try Again</a>");
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
  const workouts = getWorkouts()
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.json({ workouts });
});

app.post('/api/log-workout', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in first.' });
  }

  const { date, activity, duration, intensity, notes } = req.body;
  const userId = req.session.user.id;
  const workouts = getWorkouts();

  workouts.push({
    id: `workout-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId,
    date,
    name: activity,
    duration,
    intensity,
    notes: notes || '',
  });

  saveWorkouts(workouts);
  console.log(`Workout saved successfully for User ID ${userId}!`);
  return res.json({ success: true, message: 'Workout saved successfully!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started! Open http://localhost:${PORT}/signup.html in your browser.`);
  console.log(`Other devices can open http://<your-computer-ip>:${PORT}/signup.html`);
});