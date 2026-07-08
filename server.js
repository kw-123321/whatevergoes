const express = require('express');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const session = require('express-session');
const app = express();

const attachmentPath = path.join(__dirname, 'files', 'welcome-attachment.txt');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'RP738964$',
  database: 'c270_fitnesstrackerusers',
  waitForConnections: true,
  connectionLimit: 10,
});

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
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

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (existing.length > 0) {
      console.log(`Signup blocked: Email ${email} already exists.`);
      return res.send("<h1>An account with this email address already exists.</h1><a href='/login.html'>Go to Log In</a>");
    }

    const result = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
    console.log(`User saved successfully: ${email} (id: ${result.insertId})`);
    return res.redirect('/login.html');
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).send('<h1>Server error. Please try again.</h1>');
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = await query('SELECT id, name, email, password FROM users WHERE LOWER(email) = LOWER(?) AND password = ?', [email, password]);

    if (users.length > 0) {
      const user = users[0];
      req.session.user = {
        id: user.id,
        name: user.name,
      };
      console.log(`User logged in successfully: ${user.name}`);
      await sendLoginEmail(email, user.name);
      return res.redirect('/index.html');
    }

    return res.send("<h1>Invalid email or password.</h1><a href='/login.html'>Try Again</a>");
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).send('<h1>Server error. Please try again.</h1>');
  }
});

app.get('/api/current-user', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, name: req.session.user.name });
  } else {
    res.json({ loggedIn: false });
  }
});

app.get('/api/workouts', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json([]);
  }

  try {
    const workouts = await query(
      'SELECT _id, userId, date, name, duration, calories, intensity, notes FROM workouts WHERE userId = ? ORDER BY date DESC',
      [req.session.user.id]
    );
    return res.json(workouts);
  } catch (err) {
    console.error('Error fetching workouts:', err);
    return res.status(500).json([]);
  }
});

app.post('/api/workouts', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in first.' });
  }

  const { date, name, duration, calories, intensity, notes } = req.body;
  const userId = req.session.user.id;
  const _id = `workout-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  try {
    await query(
      'INSERT INTO workouts (_id, userId, date, name, duration, calories, intensity, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [_id, userId, date, name, Number(duration), Number(calories) || 0, intensity, notes || '']
    );
    console.log(`Workout saved successfully for User ID ${userId}!`);
    return res.status(201).json({ _id, userId, date, name, duration: Number(duration), calories: Number(calories) || 0, intensity, notes: notes || '' });
  } catch (err) {
    console.error('Error saving workout:', err);
    return res.status(500).json({ success: false, message: 'Failed to save workout.' });
  }
});

app.put('/api/workouts/:id', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  const { date, name, duration, calories, intensity, notes } = req.body;
  const userId = req.session.user.id;

  try {
    const result = await query(
      'UPDATE workouts SET date = ?, name = ?, duration = ?, calories = ?, intensity = ?, notes = ? WHERE _id = ? AND userId = ?',
      [date, name, Number(duration), Number(calories) || 0, intensity, notes || '', req.params.id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Workout not found.' });
    }

    const updated = await query('SELECT _id, userId, date, name, duration, calories, intensity, notes FROM workouts WHERE _id = ?', [req.params.id]);
    return res.json(updated[0]);
  } catch (err) {
    console.error('Error updating workout:', err);
    return res.status(500).json({ success: false, message: 'Failed to update workout.' });
  }
});

app.delete('/api/workouts/:id', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  try {
    const result = await query('DELETE FROM workouts WHERE _id = ? AND userId = ?', [req.params.id, req.session.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Workout not found.' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting workout:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete workout.' });
  }
});

app.get('/api/goals', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json([]);
  }

  try {
    const goals = await query(
      'SELECT id, userId, dateKey, title, text, time, offsetVal AS `offset`, offsetText FROM goals WHERE userId = ?',
      [req.session.user.id]
    );
    return res.json(goals);
  } catch (err) {
    console.error('Error fetching goals:', err);
    return res.status(500).json([]);
  }
});

app.post('/api/goals', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  const { dateKey, id, title, text, time, offset, offsetText } = req.body;
  const goalId = id || `goal-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  try {
    await query(
      'INSERT INTO goals (id, userId, dateKey, title, text, time, offsetVal, offsetText) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [goalId, req.session.user.id, dateKey, title || '', text || '', time || '', offset || '60', offsetText || '']
    );
    return res.status(201).json({ id: goalId, userId: req.session.user.id, dateKey, title: title || '', text: text || '', time: time || '', offset: offset || '60', offsetText: offsetText || '' });
  } catch (err) {
    console.error('Error saving goal:', err);
    return res.status(500).json({ success: false, message: 'Failed to save goal.' });
  }
});

app.put('/api/goals/:id', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  const { dateKey, title, text, time, offset, offsetText } = req.body;

  try {
    const result = await query(
      'UPDATE goals SET dateKey = ?, title = ?, text = ?, time = ?, offsetVal = ?, offsetText = ? WHERE id = ? AND userId = ?',
      [dateKey, title || '', text || '', time || '', offset || '60', offsetText || '', req.params.id, req.session.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }

    return res.json({ id: req.params.id, userId: req.session.user.id, dateKey, title: title || '', text: text || '', time: time || '', offset: offset || '60', offsetText: offsetText || '' });
  } catch (err) {
    console.error('Error updating goal:', err);
    return res.status(500).json({ success: false, message: 'Failed to update goal.' });
  }
});

app.delete('/api/goals/:id', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  try {
    const result = await query('DELETE FROM goals WHERE id = ? AND userId = ?', [req.params.id, req.session.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting goal:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete goal.' });
  }
});

app.get('/api/entries', async (req, res) => {
  if (!req.session.user) return res.status(401).json([]);

  try {
    const entries = await query(
      'SELECT _id, userId, date, mealType, food, calories, protein, carbs, fat, notes FROM nutrition_entries WHERE userId = ? ORDER BY date DESC',
      [req.session.user.id]
    );
    return res.json(entries);
  } catch (err) {
    console.error('Error fetching entries:', err);
    return res.status(500).json([]);
  }
});

app.post('/api/entries', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  const { date, mealType, food, calories, protein, carbs, fat, notes } = req.body;
  const _id = `entry-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  try {
    await query(
      'INSERT INTO nutrition_entries (_id, userId, date, mealType, food, calories, protein, carbs, fat, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [_id, req.session.user.id, date, mealType, food, Number(calories) || 0, Number(protein) || 0, Number(carbs) || 0, Number(fat) || 0, notes || '']
    );
    return res.status(201).json({ _id, userId: req.session.user.id, date, mealType, food, calories: Number(calories) || 0, protein: Number(protein) || 0, carbs: Number(carbs) || 0, fat: Number(fat) || 0, notes: notes || '' });
  } catch (err) {
    console.error('Error saving entry:', err);
    return res.status(500).json({ success: false, message: 'Failed to save entry.' });
  }
});

app.put('/api/entries/:id', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  const { date, mealType, food, calories, protein, carbs, fat, notes } = req.body;

  try {
    const result = await query(
      'UPDATE nutrition_entries SET date = ?, mealType = ?, food = ?, calories = ?, protein = ?, carbs = ?, fat = ?, notes = ? WHERE _id = ? AND userId = ?',
      [date, mealType, food, Number(calories) || 0, Number(protein) || 0, Number(carbs) || 0, Number(fat) || 0, notes || '', req.params.id, req.session.user.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Entry not found.' });

    return res.json({ _id: req.params.id, userId: req.session.user.id, date, mealType, food, calories: Number(calories) || 0, protein: Number(protein) || 0, carbs: Number(carbs) || 0, fat: Number(fat) || 0, notes: notes || '' });
  } catch (err) {
    console.error('Error updating entry:', err);
    return res.status(500).json({ success: false, message: 'Failed to update entry.' });
  }
});

app.delete('/api/entries/:id', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  try {
    const result = await query('DELETE FROM nutrition_entries WHERE _id = ? AND userId = ?', [req.params.id, req.session.user.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Entry not found.' });
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting entry:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete entry.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started! Open http://localhost:${PORT}/signup.html in your browser.`);
  console.log(`Other devices can open http://<your-computer-ip>:${PORT}/signup.html`);
});