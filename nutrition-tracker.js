const API_URL = '/api/entries';

const state = {
  entries: [],
  editingId: null,
};

const elements = {
  form: document.getElementById('nutrition-form'),
  formTitle: document.getElementById('form-title'),
  entryDate: document.getElementById('entry-date'),
  entryMealType: document.getElementById('entry-meal-type'),
  entryFood: document.getElementById('entry-food'),
  entryCalories: document.getElementById('entry-calories'),
  entryProtein: document.getElementById('entry-protein'),
  entryCarbs: document.getElementById('entry-carbs'),
  entryFat: document.getElementById('entry-fat'),
  entryNotes: document.getElementById('entry-notes'),
  saveButton: document.getElementById('save-entry-button'),
  clearButton: document.getElementById('clear-form-button'),
  nutritionList: document.getElementById('nutrition-list'),
  todayCalories: document.getElementById('today-calories'),
  todayEntries: document.getElementById('today-entries'),
  lastEntry: document.getElementById('last-entry'),
};

async function loadEntries() {
  try {
    const response = await fetch(API_URL);
    state.entries = await response.json();
  } catch (error) {
    console.error('Failed to load entries:', error);
    state.entries = [];
  }
}

function resetForm() {
  elements.form.reset();
  elements.entryDate.value = new Date().toISOString().slice(0, 10);
  elements.entryMealType.value = 'Breakfast';
  state.editingId = null;
  elements.formTitle.textContent = 'Log a meal';
}

function formatDisplayDate(dateValue) {
  const date = new Date(dateValue);
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${date.getFullYear()}`;
}

function isToday(dateValue) {
  const today = new Date().toISOString().slice(0, 10);
  return dateValue === today;
}

function renderSummary() {
  const todaysEntries = state.entries.filter((entry) => isToday(entry.date));
  const totalCaloriesToday = todaysEntries.reduce((sum, entry) => sum + entry.calories, 0);
  const latest = [...state.entries].sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  elements.todayCalories.textContent = totalCaloriesToday;
  elements.todayEntries.textContent = todaysEntries.length;
  elements.lastEntry.textContent = latest ? formatDisplayDate(latest.date) : '—';
}

function renderEntryList() {
  const sorted = [...state.entries].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    elements.nutritionList.innerHTML = '<div class="empty-state">No meals logged yet. Start with your first entry.</div>';
    return;
  }

  elements.nutritionList.innerHTML = '';

  sorted.forEach((entry) => {
    const card = document.createElement('article');
    card.className = 'workout-entry';
    card.innerHTML = `
      <div class="workout-entry-top">
        <div>
          <h3>${entry.food}</h3>
          <p>${formatDisplayDate(entry.date)}</p>
        </div>
        <span class="pill intensity-pill">${entry.mealType}</span>
      </div>
      <div class="workout-meta">
        <span>${entry.calories} kcal</span>
        <span>P: ${entry.protein || 0}g · C: ${entry.carbs || 0}g · F: ${entry.fat || 0}g</span>
      </div>
      ${entry.notes ? `<p class="workout-notes-preview">${entry.notes}</p>` : ''}
      <div class="note-item-actions">
        <button type="button" class="edit-note-button" data-id="${entry._id}">Edit</button>
        <button type="button" class="delete-note-button" data-id="${entry._id}">Delete</button>
      </div>
    `;

    card.querySelector('.edit-note-button').addEventListener('click', () => populateForm(entry));
    card.querySelector('.delete-note-button').addEventListener('click', () => deleteEntry(entry._id));
    elements.nutritionList.appendChild(card);
  });
}

function populateForm(entry) {
  state.editingId = entry._id;
  elements.formTitle.textContent = 'Edit meal';
  elements.entryDate.value = entry.date;
  elements.entryMealType.value = entry.mealType;
  elements.entryFood.value = entry.food;
  elements.entryCalories.value = entry.calories;
  elements.entryProtein.value = entry.protein || '';
  elements.entryCarbs.value = entry.carbs || '';
  elements.entryFat.value = entry.fat || '';
  elements.entryNotes.value = entry.notes || '';
  elements.entryFood.focus();
}

async function handleSubmit(event) {
  event.preventDefault();

  const entry = {
    date: elements.entryDate.value,
    mealType: elements.entryMealType.value,
    food: elements.entryFood.value.trim(),
    calories: Number(elements.entryCalories.value) || 0,
    protein: Number(elements.entryProtein.value) || 0,
    carbs: Number(elements.entryCarbs.value) || 0,
    fat: Number(elements.entryFat.value) || 0,
    notes: elements.entryNotes.value.trim(),
  };

  if (!entry.food || !entry.date || !Number.isFinite(entry.calories) || entry.calories <= 0) {
    window.alert('Please enter a food name, date, and calorie amount.');
    return;
  }

  try {
    if (state.editingId) {
      await fetch(`${API_URL}/${state.editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } else {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    }

    resetForm();
    await loadEntries();
    render();
  } catch (error) {
    window.alert('Could not save entry. Check that the backend server is running.');
    console.error(error);
  }
}

async function deleteEntry(id) {
  try {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (state.editingId === id) {
      resetForm();
    }
    await loadEntries();
    render();
  } catch (error) {
    window.alert('Could not delete entry. Check that the backend server is running.');
    console.error(error);
  }
}

function render() {
  renderSummary();
  renderEntryList();
}

async function init() {
  elements.form.addEventListener('submit', handleSubmit);
  elements.clearButton.addEventListener('click', resetForm);
  elements.entryDate.value = new Date().toISOString().slice(0, 10);
  await loadEntries();
  render();
}

init();