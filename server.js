const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const session = require('express-session');
const app = express();

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const WORKOUTS_FILE = path.join(DATA_DIR, 'workouts.json');
const GOALS_FILE = path.join(DATA_DIR, 'goals.json');
const ENTRIES_FILE = path.join(DATA_DIR, 'entries.json');
const attachmentPath = path.join(__dirname, 'files', 'welcome-attachment.txt');

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const file of [USERS_FILE, WORKOUTS_FILE, GOALS_FILE, ENTRIES_FILE]) {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([], null, 2));
    }
  }
}

function readJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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

app.use(express.static(__dirname));

app.use(session({
  secret: 'fitness_tracker_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/logout.html');
});

app.get('/download/welcome-attachment', (req, res) => {
  if (!fs.existsSync(attachmentPath)) {
    return res.status(404).send('<h1>Attachment file not found.</h1>');
  }

  return res.download(attachmentPath, 'welcome-attachment.txt');
});

app.post('/signup', (req, res) => {
  ensureDataFiles();
  const { name, email, password } = req.body;

  const users = readJsonFile(USERS_FILE);
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
  writeJsonFile(USERS_FILE, users);

  console.log(`User saved successfully: ${email}`);
  return res.redirect('/login.html');
});

app.post('/login', (req, res) => {
  ensureDataFiles();
  const { email, password } = req.body;
  const users = readJsonFile(USERS_FILE);
  const user = users.find((entry) => entry.email.toLowerCase() === String(email).toLowerCase() && entry.password === password);

  if (user) {
    req.session.user = {
      id: user.id,
      name: user.name,
    };
    console.log(`User logged in successfully: ${user.name}`);
    sendLoginEmail(email, user.name);
    return res.redirect('/index.html');
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
    return res.status(401).json([]);
  }

  ensureDataFiles();
  const workouts = readJsonFile(WORKOUTS_FILE)
    .filter((entry) => entry.userId === req.session.user.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.json(workouts);
});

app.post('/api/workouts', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in first.' });
  }

  ensureDataFiles();
  const { date, name, duration, calories, intensity, notes } = req.body;
  const userId = req.session.user.id;
  const _id = `workout-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const workouts = readJsonFile(WORKOUTS_FILE);
  workouts.push({
    _id,
    userId,
    date,
    name,
    duration: Number(duration),
    calories: Number(calories) || 0,
    intensity,
    notes: notes || '',
  });
  writeJsonFile(WORKOUTS_FILE, workouts);

  console.log(`Workout saved successfully for User ID ${userId}!`);
  return res.status(201).json({ _id, userId, date, name, duration: Number(duration), calories: Number(calories) || 0, intensity, notes: notes || '' });
});

app.put('/api/workouts/:id', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  ensureDataFiles();
  const { date, name, duration, calories, intensity, notes } = req.body;
  const userId = req.session.user.id;

  const workouts = readJsonFile(WORKOUTS_FILE);
  const index = workouts.findIndex((w) => w._id === req.params.id && w.userId === userId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Workout not found.' });
  }

  workouts[index] = {
    ...workouts[index],
    date,
    name,
    duration: Number(duration),
    calories: Number(calories) || 0,
    intensity,
    notes: notes || '',
  };
  writeJsonFile(WORKOUTS_FILE, workouts);

  return res.json(workouts[index]);
});

app.delete('/api/workouts/:id', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  ensureDataFiles();
  const workouts = readJsonFile(WORKOUTS_FILE);
  const index = workouts.findIndex((w) => w._id === req.params.id && w.userId === req.session.user.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Workout not found.' });
  }

  workouts.splice(index, 1);
  writeJsonFile(WORKOUTS_FILE, workouts);

  return res.json({ success: true });
});

app.get('/api/goals', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json([]);
  }

  ensureDataFiles();
  const goals = readJsonFile(GOALS_FILE)
    .filter((g) => g.userId === req.session.user.id);

  return res.json(goals);
});

app.post('/api/goals', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  ensureDataFiles();
  const { dateKey, id, title, text, time, offset, offsetText } = req.body;
  const goalId = id || `goal-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const goals = readJsonFile(GOALS_FILE);
  goals.push({
    id: goalId,
    userId: req.session.user.id,
    dateKey,
    title: title || '',
    text: text || '',
    time: time || '',
    offset: offset || '60',
    offsetText: offsetText || '',
  });
  writeJsonFile(GOALS_FILE, goals);

  return res.status(201).json({ id: goalId, userId: req.session.user.id, dateKey, title: title || '', text: text || '', time: time || '', offset: offset || '60', offsetText: offsetText || '' });
});

app.put('/api/goals/:id', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  ensureDataFiles();
  const { dateKey, title, text, time, offset, offsetText } = req.body;
  const userId = req.session.user.id;

  const goals = readJsonFile(GOALS_FILE);
  const index = goals.findIndex((g) => g.id === req.params.id && g.userId === userId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Goal not found.' });
  }

  goals[index] = {
    ...goals[index],
    dateKey,
    title: title || '',
    text: text || '',
    time: time || '',
    offset: offset || '60',
    offsetText: offsetText || '',
  };
  writeJsonFile(GOALS_FILE, goals);

  return res.json({ id: req.params.id, userId: req.session.user.id, dateKey, title: title || '', text: text || '', time: time || '', offset: offset || '60', offsetText: offsetText || '' });
});

app.delete('/api/goals/:id', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  ensureDataFiles();
  const goals = readJsonFile(GOALS_FILE);
  const index = goals.findIndex((g) => g.id === req.params.id && g.userId === req.session.user.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Goal not found.' });
  }

  goals.splice(index, 1);
  writeJsonFile(GOALS_FILE, goals);

  return res.json({ success: true });
});

app.get('/api/entries', (req, res) => {
  if (!req.session.user) return res.status(401).json([]);

  ensureDataFiles();
  const entries = readJsonFile(ENTRIES_FILE)
    .filter((e) => e.userId === req.session.user.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.json(entries);
});

app.post('/api/entries', (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  ensureDataFiles();
  const { date, mealType, food, calories, protein, carbs, fat, notes } = req.body;
  const _id = `entry-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const entries = readJsonFile(ENTRIES_FILE);
  entries.push({
    _id,
    userId: req.session.user.id,
    date,
    mealType,
    food,
    calories: Number(calories) || 0,
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fat: Number(fat) || 0,
    notes: notes || '',
  });
  writeJsonFile(ENTRIES_FILE, entries);

  return res.status(201).json({ _id, userId: req.session.user.id, date, mealType, food, calories: Number(calories) || 0, protein: Number(protein) || 0, carbs: Number(carbs) || 0, fat: Number(fat) || 0, notes: notes || '' });
});

app.put('/api/entries/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  ensureDataFiles();
  const { date, mealType, food, calories, protein, carbs, fat, notes } = req.body;
  const userId = req.session.user.id;

  const entries = readJsonFile(ENTRIES_FILE);
  const index = entries.findIndex((e) => e._id === req.params.id && e.userId === userId);

  if (index === -1) return res.status(404).json({ success: false, message: 'Entry not found.' });

  entries[index] = {
    ...entries[index],
    date,
    mealType,
    food,
    calories: Number(calories) || 0,
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fat: Number(fat) || 0,
    notes: notes || '',
  };
  writeJsonFile(ENTRIES_FILE, entries);

  return res.json(entries[index]);
});

app.delete('/api/entries/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  ensureDataFiles();
  const entries = readJsonFile(ENTRIES_FILE);
  const index = entries.findIndex((e) => e._id === req.params.id && e.userId === req.session.user.id);

  if (index === -1) return res.status(404).json({ success: false, message: 'Entry not found.' });

  entries.splice(index, 1);
  writeJsonFile(ENTRIES_FILE, entries);

  return res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started! Open http://localhost:${PORT}/signup.html in your browser.`);
  console.log(`Other devices can open http://<your-computer-ip>:${PORT}/signup.html`);
});
