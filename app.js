const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const state = {
  currentMonth: new Date(),
  selectedDate: new Date(),
  notes: {},
  editingNoteId: null,
};

const elements = {
  currentYear: document.getElementById('current-year'),
  currentMonthName: document.getElementById('current-month-name'),
  calendarTitle: document.getElementById('calendar-title'),
  calendarTitleButton: document.getElementById('calendar-title-button'),
  monthPicker: document.getElementById('month-picker'),
  calendarGrid: document.getElementById('calendar-grid'),
  selectedDayLabel: document.getElementById('selected-day-label'),
  selectedSummary: document.getElementById('selected-summary'),
  notesList: document.getElementById('notes-list'),
  newNoteText: document.getElementById('new-note-text'),
  newNoteTime: document.getElementById('new-note-time'),
  newNoteOffset: document.getElementById('new-note-offset'),
  saveNoteButton: document.getElementById('save-note-button'),
  cancelNoteButton: document.getElementById('cancel-note-button'),
  remindersList: document.getElementById('reminders-list'),
  searchDay: document.getElementById('search-day'),
};

function normalizeNotes(rawNotes) {
  const notes = {};
  if (!rawNotes || typeof rawNotes !== 'object') return notes;
  Object.entries(rawNotes).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      notes[key] = value;
    } else if (typeof value === 'string' && value.trim()) {
      notes[key] = [{
        id: nextNoteId(),
        text: value,
        time: '',
        offset: '60',
        offsetText: '',
      }];
    } else if (value && typeof value === 'object' && typeof value.text === 'string') {
      notes[key] = [{
        id: nextNoteId(),
        text: value.text,
        time: value.time || '',
        offset: value.offset || '60',
        offsetText: value.offsetText || (value.time ? getOffsetText(value.offset || '60') : ''),
      }];
    }
  });
  return notes;
}

function loadState() {
  const savedNotes = localStorage.getItem('fitnessTrackerNotes');
  try {
    state.notes = normalizeNotes(savedNotes ? JSON.parse(savedNotes) : {});
  } catch (error) {
    state.notes = {};
  }
}

function saveState() {
  localStorage.setItem('fitnessTrackerNotes', JSON.stringify(state.notes));
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

function nextNoteId() {
  return `note-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function setCurrentMonth(monthDate) {
  state.currentMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  state.currentMonth.setHours(0, 0, 0, 0);
}

function renderHeader() {
  elements.currentYear.textContent = state.currentMonth.getFullYear();
  elements.currentMonthName.textContent = monthNames[state.currentMonth.getMonth()];
  elements.calendarTitle.textContent = `${monthNames[state.currentMonth.getMonth()]} ${state.currentMonth.getFullYear()}`;
}

function renderMonthPicker() {
  elements.monthPicker.innerHTML = '';
  const year = state.currentMonth.getFullYear();
  for (let month = 0; month < 12; month += 1) {
    const monthElement = document.createElement('button');
    monthElement.type = 'button';
    monthElement.textContent = monthNames[month];
    monthElement.className = 'month-chip';
    if (month === state.currentMonth.getMonth()) {
      monthElement.classList.add('active-month');
    }
    monthElement.addEventListener('click', () => {
      setCurrentMonth(new Date(year, month, 1));
      closeMonthPicker();
      renderAll();
    });
    elements.monthPicker.appendChild(monthElement);
  }
}

function toggleMonthPicker() {
  if (!elements.monthPicker) return;
  elements.monthPicker.classList.toggle('hidden');
}

function closeMonthPicker() {
  if (!elements.monthPicker) return;
  elements.monthPicker.classList.add('hidden');
}

function renderCalendar() {
  elements.calendarGrid.innerHTML = '';
  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let slot = 0; slot < startDay; slot += 1) {
    const empty = document.createElement('div');
    empty.className = 'day-cell inactive';
    elements.calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = formatDateKey(date);
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day-cell';
    if (formatDateKey(date) === formatDateKey(new Date())) {
      cell.classList.add('current-day');
    }
    if (formatDateKey(date) === formatDateKey(state.selectedDate)) {
      cell.classList.add('selected');
    }

    const notes = state.notes[key] || [];
    const noteCount = notes.length;
    const hasAlarm = notes.some((note) => note.time && note.time.trim().length > 0);

    cell.innerHTML = `
      <div class="day-number">${day}</div>
      <div class="note-indicator">
        ${noteCount > 0 ? `📝 ${noteCount}` : ''} ${hasAlarm ? '⏰' : ''}
      </div>
    `;

    cell.addEventListener('click', () => {
      state.selectedDate = date;
      state.editingNoteId = null;
      resetNoteForm();
      renderAll();
    });
    elements.calendarGrid.appendChild(cell);
  }
}

function getSelectedDateKey() {
  return formatDateKey(state.selectedDate);
}

function getCurrentNotes() {
  const key = getSelectedDateKey();
  return state.notes[key] || [];
}

function renderDetailPanel() {
  elements.selectedDayLabel.textContent = formatDisplayDate(state.selectedDate);
  const notes = getCurrentNotes();
  const alarmNotes = notes.filter((note) => note.time && note.time.trim().length > 0);

  if (elements.selectedSummary) {
    const summaryParts = [];
    if (notes.length > 0) summaryParts.push(`${notes.length} note${notes.length > 1 ? 's' : ''}`);
    if (alarmNotes.length > 0) summaryParts.push(`${alarmNotes.length} alarm${alarmNotes.length > 1 ? 's' : ''}`);
    elements.selectedSummary.textContent = summaryParts.length > 0 ? summaryParts.join(' · ') : 'No notes or alarms yet.';
  }

  renderNotesList();
}

function renderNotesList() {
  elements.notesList.innerHTML = '';
  const notes = getCurrentNotes();
  if (notes.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'No notes yet for this day. Use the form below to add one.';
    elements.notesList.appendChild(item);
    return;
  }

  notes.forEach((note) => {
    const item = document.createElement('li');
    item.className = 'selected-note-item';
    item.innerHTML = `
      <div class="note-text">${note.text}</div>
      ${note.time ? `<div class="note-alarm">⏰ ${note.time} (${note.offsetText})</div>` : ''}
      <div class="note-item-actions">
        <button type="button" class="edit-note-button" data-note-id="${note.id}">Edit</button>
        <button type="button" class="delete-note-button" data-note-id="${note.id}">Delete</button>
      </div>
    `;

    const editButton = item.querySelector('.edit-note-button');
    editButton.addEventListener('click', () => {
      state.editingNoteId = note.id;
      populateNoteForm(note);
    });

    const deleteButton = item.querySelector('.delete-note-button');
    deleteButton.addEventListener('click', () => {
      deleteNote(note.id);
    });

    elements.notesList.appendChild(item);
  });
}

function resetNoteForm() {
  elements.newNoteText.value = '';
  elements.newNoteTime.value = '';
  elements.newNoteOffset.value = '60';
  state.editingNoteId = null;
  document.getElementById('note-form-title').textContent = 'Add a new note';
}

function populateNoteForm(note) {
  elements.newNoteText.value = note.text;
  elements.newNoteTime.value = note.time || '';
  elements.newNoteOffset.value = note.offset || '60';
  document.getElementById('note-form-title').textContent = 'Edit note';
}

function saveNote() {
  const noteText = elements.newNoteText.value.trim();
  if (!noteText) {
    window.alert('Please enter a note before saving.');
    return;
  }

  const key = getSelectedDateKey();
  const notes = getCurrentNotes();
  const time = elements.newNoteTime.value;
  const offset = elements.newNoteOffset.value;
  const offsetText = time ? getOffsetText(offset) : '';

  if (state.editingNoteId) {
    const existing = notes.find((note) => note.id === state.editingNoteId);
    if (existing) {
      existing.text = noteText;
      existing.time = time;
      existing.offset = offset;
      existing.offsetText = offsetText;
    }
  } else {
    notes.push({
      id: nextNoteId(),
      text: noteText,
      time,
      offset,
      offsetText,
    });
  }

  state.notes[key] = notes;
  saveState();
  resetNoteForm();
  renderAll();
}

function deleteNote(noteId) {
  const key = getSelectedDateKey();
  const notes = getCurrentNotes().filter((note) => note.id !== noteId);
  if (notes.length > 0) {
    state.notes[key] = notes;
  } else {
    delete state.notes[key];
  }
  saveState();
  resetNoteForm();
  renderAll();
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

function renderReminders() {
  elements.remindersList.innerHTML = '';
  const reminders = [];
  Object.entries(state.notes).forEach(([key, notes]) => {
    notes.forEach((note) => {
      if (note.time && note.time.trim()) {
        reminders.push(`${key} at ${note.time} - ${note.text.slice(0, 40)}`);
      }
    });
  });

  if (reminders.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'No alarms configured yet.';
    elements.remindersList.appendChild(item);
    return;
  }

  reminders.sort().forEach((text) => {
    const item = document.createElement('li');
    item.textContent = text;
    elements.remindersList.appendChild(item);
  });
}

function checkDueReminders() {
  const now = new Date();
  const upcoming = [];
  Object.entries(state.notes).forEach(([key, notes]) => {
    notes.forEach((note) => {
      if (!note.time) return;
      const [hour, minute] = note.time.split(':').map(Number);
      const [year, month, day] = key.split('-').map(Number);
      const alarmDate = new Date(year, month - 1, day, hour, minute);
      const offsetMinutes = Number(note.offset || 60);
      const reminderDate = new Date(alarmDate.getTime() - offsetMinutes * 60000);
      if (reminderDate <= now && alarmDate >= now) {
        upcoming.push(`On ${key} at ${note.time}: ${note.offsetText}`);
      }
    });
  });

  if (upcoming.length > 0) {
    notifyUsers(upcoming.join('\n'));
  }
}

function notifyUsers(message) {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return;
  }
  if (Notification.permission === 'granted') {
    new Notification('Fitness Tracker Reminder', { body: message });
    return;
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification('Fitness Tracker Reminder', { body: message });
      } else {
        console.log('Notification permission denied');
      }
    });
  }
}

function parseSearchValue(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }
  const year = state.currentMonth.getFullYear();
  const fallback = new Date(`${trimmed} ${year}`);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }
  return null;
}

function handleSearch() {
  const parsed = parseSearchValue(elements.searchDay.value);
  if (!parsed) {
    window.alert('Enter a valid date such as 2026-06-29 or June 29.');
    return;
  }
  state.selectedDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  setCurrentMonth(state.selectedDate);
  resetNoteForm();
  renderAll();
}

function applyEventHandlers() {
  document.getElementById('prev-month').addEventListener('click', () => {
    setCurrentMonth(new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1));
    renderAll();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    setCurrentMonth(new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1));
    renderAll();
  });
  document.getElementById('search-button').addEventListener('click', handleSearch);
  elements.searchDay.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  });
  if (elements.calendarTitleButton) {
    elements.calendarTitleButton.addEventListener('click', () => {
      toggleMonthPicker();
    });
  }
  if (elements.saveNoteButton) {
    elements.saveNoteButton.addEventListener('click', saveNote);
  }
  if (elements.cancelNoteButton) {
    elements.cancelNoteButton.addEventListener('click', resetNoteForm);
  }
  document.addEventListener('click', (event) => {
    if (!elements.monthPicker || !elements.calendarTitleButton) return;
    if (!elements.monthPicker.contains(event.target) && !elements.calendarTitleButton.contains(event.target)) {
      closeMonthPicker();
    }
  });
}

function renderAll() {
  renderHeader();
  renderMonthPicker();
  renderCalendar();
  renderDetailPanel();
  renderReminders();
}

function initialize() {
  loadState();
  setCurrentMonth(state.selectedDate);
  resetNoteForm();
  renderAll();
  applyEventHandlers();
  setInterval(checkDueReminders, 60 * 1000);
}

initialize();
