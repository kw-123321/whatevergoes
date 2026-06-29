# Fitness Tracker Project Design

## Goal
Create a homepage and a goal tracker page inside `gitstuff` that provides a timetable-style schedule for year, month, week, and day planning. Users should be able to search specific days, select the current schedule day, configure notes, and set alarms for upcoming reminders.

## Project structure
- `index.html` - Homepage with navbar pointing to the goal tracker page.
- `goal-tracker.html` - Goal tracker app with schedule layout and day management.
- `styles.css` - Shared visual styling and responsive layout.
- `app.js` - Interactive schedule logic, day selection, notes, alarms, and search.
- `fitness-tracker-design.md` - This design specification.

## Homepage
### Purpose
The homepage introduces the fitness tracker and provides a link to the goal tracker page.

### Components
- Top navigation bar
- Hero section with page title and call-to-action
- Summary cards for year overview, monthly calendar, and notes/alarms

### Navigation
- `Home` link back to the homepage
- `Goal Tracker` link to the schedule page

## Goal Tracker page
### Layout
1. Top schedule header
   - Current year display
   - Current month display
   - Search field for locating any day quickly
2. Year overview row
   - Clickable month chips to jump to a month
3. Monthly calendar grid
   - Seven-day week layout with day cells
   - Clickable days to select and edit details
4. Week view
   - Seven-day summary for the selected week
   - Highlights the selected day in the week
5. Day detail panel
   - Display selected day text
   - Notes field
   - Alarm time picker
   - Reminder offset selector
   - Save button
6. Upcoming reminders list
   - Shows configured alarms sorted by date

### Behavior
- Selecting a day updates the detail panel and week view
- The selected day cell is highlighted across the calendar
- Notes are saved per day and persisted in `localStorage`
- Alarms are saved per day and displayed in the reminder list
- Search field accepts ISO date format or human-friendly month/day strings
- Notifications request browser permission and, when granted, can display native reminders

## Data model
- `notes` object keyed by `YYYY-MM-DD`
- `alarms` object keyed by `YYYY-MM-DD`
  - `time` string in `HH:MM` format
  - `offset` string with minutes before the alarm
  - `offsetText` human-readable reminder text

## User flows
### Start from homepage
- Click `Goal Tracker`
- View year/month/week schedule layout
- Search for a date or click a day cell
- Add a note and set an alarm time
- Press `Save note & alarm`

### Search a day
- Enter a date like `2026-06-29` or `June 29`
- Press `Search`
- The schedule updates to the requested date and highlights it

### Configure a day
- Select a day in the calendar grid
- Enter a note and alarm time
- Choose reminder offset
- Save the configuration
- Confirm the reminder appears in the upcoming reminders list

## Notes
- This implementation is intentionally self-contained in the `gitstuff` folder.
- The browser `Notification` API is used where available, but the page also provides in-app reminders and persistent storage.
- The design can be extended later with backend storage, authentication, or more advanced scheduling logic.
