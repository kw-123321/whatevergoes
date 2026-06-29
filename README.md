# Fitness Tracker App

This is a simple browser-based fitness tracker prototype with a homepage and a goal tracker page.

## Files
- `index.html` - Homepage with navbar to the Goal Tracker.
- `goal-tracker.html` - Schedule and day detail tracker.
- `styles.css` - Layout and styling.
- `app.js` - Client-side app logic for schedule rendering, notes, and alarms.

## How to Open
### Option 1: Open in browser
1. Open `d:\RP\C270 DevOps Essential\week 8\gitstuff\index.html` in your browser.
2. Click `Goal Tracker` to use the app.

### Option 2: Run a local web server
From the `gitstuff` folder run one of these commands:

- Python 3:
  ```powershell
  python -m http.server 8000
  ```

- Node.js (`http-server` installed):
  ```powershell
  npx http-server -p 8000
  ```

Then open `http://localhost:8000/index.html`.

## Notes
- Entries are stored in browser `localStorage`.
- Notifications use the browser `Notification` API when permission is granted.
- Search accepts `YYYY-MM-DD` or `Month Day` formats.
