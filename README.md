# Fitness Tracker App

This is a simple fitness tracker app with signup, login, goal tracking, workout logging, and nutrition tracking.

## Files
- `index.html` - Homepage with navbar to the app pages.
- `signup.html` - Signup form.
- `login.html` - Login form.
- `server.js` - Express server for signup, login, sessions, and API routes.
- `goal-tracker.html` - Schedule and day detail tracker.
- `styles.css` - Layout and styling.
- `app.js` - Client-side app logic for schedule rendering, notes, and alarms.

## How to Open
Do not double-click `signup.html` or `login.html` for signup/login. Those forms submit to Express routes such as `/signup` and `/login`, so the Node server must be running.

From the project folder, run:

```powershell
npm install
npm start
```

Then open:

```text
http://localhost:3000/signup.html
```

## Notes
- Entries are stored in browser `localStorage`.
- Notifications use the browser `Notification` API when permission is granted.
- Search accepts `YYYY-MM-DD` or `Month Day` formats.
- After a successful login the app can send an email with an attachment. Configure SMTP with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optionally `SMTP_FROM` before starting the server.
- Signup and login require the MySQL database configured in `server.js` or through `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` environment variables.
