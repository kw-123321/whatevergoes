const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const API_URL = '/api/goals';

const state = {
  currentMonth: new Date(),
  selectedDate: new Date(),
  notes: {},
  editingNoteId: null,
  selectedNoteId: null,
  expandedNoteId: null,
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
  newNoteTitle: document.getElementById('new-note-title'),
  newNoteText: document.getElementById('new-note-text'),
  newNoteTime: document.getElementById('new-note-time'),
  newNoteOffset: document.getElementById('new-note-offset'),
  saveNoteButton: document.getElementById('save-note-button'),
  cancelNoteButton: document.getElementById('cancel-note-button'),
  remindersList: document.getElementById('reminders-list'),
  searchDay: document.getElementById('search-day'),
};

async function loadState() {
  try {
    const response = await fetch(API_URL);
    const allNotes = await response.json();
    state.notes = {};
    allNotes.forEach((note) => {
      const key = note.dateKey;
      if (!key) return;
      if (!state.notes[key]) state.notes[key] = [];
      state.notes[key].push({
        id: note.id,
        title: note.title,
        text: note.text,
        time: note.time,
        offset: note.offset,
        offsetText: note.offsetText,
      });
    });
  } catch (error) {
    console.error('Failed to load goals from backend:', error);
    state.notes = {};
  }
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

function getNoteTitle(note) {
  if (note.title && note.title.trim()) {
    return note.title.trim();
  }
  if (note.text && note.text.trim()) {
    return note.text.trim().slice(0, 32);
  }
  return 'Untitled note';
}

function getNotePreview(text) {
  const plainText = (text || '').replace(/<[^>]*>/g, '').trim();
  if (!plainText) return '';
  const lines = plainText.split(/\r?\n/).filter(Boolean);
  const previewLines = lines.slice(0, 3).join('\n');
  return previewLines;
}

function renderNotesList() {
  elements.notesList.innerHTML = '';
  const notes = getCurrentNotes();
  if (notes.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'notes-empty-state';
    emptyState.textContent = 'No notes yet for this day. Use the form below to add one.';
    elements.notesList.appendChild(emptyState);
    return;
  }

  const activeNote = notes.find((note) => note.id === state.selectedNoteId) || notes[0];
  if (activeNote) {
    state.selectedNoteId = activeNote.id;
  }

  const tabs = document.createElement('div');
  tabs.className = 'note-tabs';

  notes.forEach((note) => {
    const tabButton = document.createElement('button');
    tabButton.type = 'button';
    tabButton.className = 'note-tab';
    if (activeNote && activeNote.id === note.id) {
      tabButton.classList.add('active');
    }
    tabButton.innerHTML = `<span>${getNoteTitle(note)}</span>`;
    tabButton.addEventListener('click', () => {
      state.selectedNoteId = note.id;
      state.editingNoteId = null;
      renderAll();
    });
    tabs.appendChild(tabButton);
  });

  const detailCard = document.createElement('div');
  detailCard.className = 'note-detail-card';
  const previewText = getNotePreview(activeNote.text);
  const isExpanded = state.expandedNoteId === activeNote.id;
  const bodyContent = isExpanded
    ? (activeNote.text || 'No details yet.')
    : previewText || 'No details yet.';
  detailCard.innerHTML = `
    <div class="note-detail-header">
      <h4>${getNoteTitle(activeNote)}</h4>
      <div class="note-item-actions">
        <button type="button" class="view-full-note">View</button>
        <button type="button" class="edit-note-button" data-note-id="${activeNote.id}">Edit</button>
        <button type="button" class="delete-note-button" data-note-id="${activeNote.id}">Delete</button>
      </div>
    </div>
    <div class="note-detail-body ${isExpanded ? '' : 'note-preview'}">
      <p class="note-detail-text">${bodyContent}</p>
    </div>
    ${activeNote.time ? `<div class="note-alarm">⏰ ${activeNote.time} (${activeNote.offsetText})</div>` : ''}
  `;

  const editButton = detailCard.querySelector('.edit-note-button');
  editButton.addEventListener('click', () => {
    state.editingNoteId = activeNote.id;
    state.selectedNoteId = activeNote.id;
    populateNoteForm(activeNote);
    renderAll();
  });

  const deleteButton = detailCard.querySelector('.delete-note-button');
  deleteButton.addEventListener('click', () => {
    deleteNote(activeNote.id);
  });

  const fullNoteButton = detailCard.querySelector('.view-full-note');
  if (fullNoteButton) {
    fullNoteButton.addEventListener('click', () => {
      state.expandedNoteId = activeNote.id;
      renderAll();
    });
  }

  elements.notesList.appendChild(tabs);
  elements.notesList.appendChild(detailCard);
}

function resetNoteForm() {
  elements.newNoteTitle.value = '';
  elements.newNoteText.value = '';
  elements.newNoteTime.value = '';
  elements.newNoteOffset.value = '60';
  state.editingNoteId = null;
  document.getElementById('note-form-title').textContent = 'Add a new note';
}

function populateNoteForm(note) {
  elements.newNoteTitle.value = note.title || '';
  elements.newNoteText.value = note.text;
  elements.newNoteTime.value = note.time || '';
  elements.newNoteOffset.value = note.offset || '60';
  document.getElementById('note-form-title').textContent = 'Edit note';
}

async function saveNote() {
  const noteText = elements.newNoteText.value.trim();
  if (!noteText) {
    window.alert('Please enter a note before saving.');
    return;
  }

  const noteTitle = elements.newNoteTitle.value.trim() || (noteText.length > 32 ? `${noteText.slice(0, 32)}...` : noteText);
  const key = getSelectedDateKey();
  const time = elements.newNoteTime.value;
  const offset = elements.newNoteOffset.value;
  const offsetText = time ? getOffsetText(offset) : '';

  try {
    if (state.editingNoteId) {
      const updatedNote = {
        dateKey: key,
        id: state.editingNoteId,
        title: noteTitle,
        text: noteText,
        time,
        offset,
        offsetText,
      };
      await fetch(`${API_URL}/${state.editingNoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNote),
      });
      state.selectedNoteId = state.editingNoteId;
    } else {
      const newNote = {
        dateKey: key,
        id: nextNoteId(),
        title: noteTitle,
        text: noteText,
        time,
        offset,
        offsetText,
      };
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });
      state.selectedNoteId = newNote.id;
    }

    await loadState();
    resetNoteForm();
    renderAll();
  } catch (error) {
    window.alert('Could not save note. Check that the backend server is running.');
    console.error(error);
  }
}

async function deleteNote(noteId) {
  try {
    await fetch(`${API_URL}/${noteId}`, { method: 'DELETE' });
    await loadState();
    const notes = getCurrentNotes();
    state.selectedNoteId = notes.length > 0 ? notes[0].id : null;
    resetNoteForm();
    renderAll();
  } catch (error) {
    window.alert('Could not delete note. Check that the backend server is running.');
    console.error(error);
  }
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

async function initialize() {
  await loadState();
  setCurrentMonth(state.selectedDate);
  resetNoteForm();
  renderAll();
  applyEventHandlers();
  setInterval(checkDueReminders, 60 * 1000);
}

initialize();