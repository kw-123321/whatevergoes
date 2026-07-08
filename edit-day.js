const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const storageKey = 'fitnessTrackerNotes';
const alarmStorageKey = 'fitnessTrackerAlarms';

const elements = {
  selectedDayLabel: document.getElementById('selected-day-label'),
  noteText: document.getElementById('note-text'),
  alarmTime: document.getElementById('alarm-time'),
  reminderOffset: document.getElementById('reminder-offset'),
  saveButton: document.getElementById('save-button'),
  cancelButton: document.getElementById('cancel-button'),
};

function getQueryDate() {
  const params = new URLSearchParams(window.location.search);
  const day = params.get('day');
  if (!day) {
    return null;
  }
  const parsed = new Date(day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function loadStorage(key) {
  const raw = localStorage.getItem(key);
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStorage(key, object) {
  localStorage.setItem(key, JSON.stringify(object));
}

function populateForm() {
  const selectedDate = getQueryDate();
  if (!selectedDate) {
    window.location.href = 'goal-tracker.html';
    return;
  }
  elements.selectedDayLabel.textContent = formatDisplayDate(selectedDate);
  const key = formatDateKey(selectedDate);
  const notes = loadStorage(storageKey);
  const alarms = loadStorage(alarmStorageKey);
  elements.noteText.value = notes[key] || '';
  elements.alarmTime.value = alarms[key] ? alarms[key].time : '';
  elements.reminderOffset.value = alarms[key] ? alarms[key].offset : '60';
}

function handleSave() {
  const selectedDate = getQueryDate();
  if (!selectedDate) return;

  const notes = loadStorage(storageKey);
  const alarms = loadStorage(alarmStorageKey);
  const key = formatDateKey(selectedDate);
  const note = elements.noteText.value.trim();
  const time = elements.alarmTime.value;
  const offset = elements.reminderOffset.value;

  if (note) {
    notes[key] = note;
  } else {
    delete notes[key];
  }

  if (time) {
    alarms[key] = { time, offset, offsetText: getOffsetText(offset) };
  } else {
    delete alarms[key];
  }

  saveStorage(storageKey, notes);
  saveStorage(alarmStorageKey, alarms);
  window.location.href = `goal-tracker.html?day=${key}`;
}

function getOffsetText(offset) {
  switch (offset) {
    case '15': return '15 minutes before';
    case '30': return '30 minutes before';
    case '60': return '1 hour before';
    case '1440': return '1 day before';
    default: return 'Reminder set';
  }
}

function applyEventHandlers() {
  elements.saveButton.addEventListener('click', handleSave);
  elements.cancelButton.addEventListener('click', () => {
    const selectedDate = getQueryDate();
    const day = selectedDate ? formatDateKey(selectedDate) : '';
    window.location.href = `goal-tracker.html${day ? `?day=${day}` : ''}`;
  });
}

populateForm();
applyEventHandlers();
