const STORAGE_KEY = 'fitnessTrackerWorkouts';
const ALLOWED_ACTIVITIES = ['Gym', 'Cardio', 'Sports', 'Light activity', 'Cycling'];

const state = {
  workouts: [],
  editingId: null,
};

const elements = {
  form: document.getElementById('workout-form'),
  formTitle: document.getElementById('form-title'),
  workoutDate: document.getElementById('workout-date'),
  workoutName: document.getElementById('workout-name'),
  workoutDuration: document.getElementById('workout-duration'),
  workoutIntensity: document.getElementById('workout-intensity'),
  workoutNotes: document.getElementById('workout-notes'),
  saveButton: document.getElementById('save-workout-button'),
  clearButton: document.getElementById('clear-form-button'),
  saveFeedback: document.getElementById('save-feedback'),
  workoutList: document.getElementById('workout-list'),
  totalWorkouts: document.getElementById('total-workouts'),
  weeklyWorkouts: document.getElementById('weekly-workouts'),
  lastWorkout: document.getElementById('last-workout'),
};

function loadWorkouts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    state.workouts = stored ? JSON.parse(stored) : [];
  } catch (error) {
    state.workouts = [];
  }
}

function saveWorkouts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.workouts));
}

function createWorkoutId() {
  return `workout-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function setDateConstraints() {
  elements.workoutDate.value = getTodayString();
}

function resetForm() {
  elements.form.reset();
  setDateConstraints();
  elements.workoutIntensity.value = 'Moderate';
  state.editingId = null;
  elements.formTitle.textContent = 'Log a workout';
}

function showSaveFeedback(message) {
  elements.saveFeedback.textContent = message;
}

function formatDisplayDate(dateValue) {
  const date = new Date(dateValue);
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${date.getFullYear()}`;
}

function renderSummary() {
  const total = state.workouts.length;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekly = state.workouts.filter((workout) => new Date(workout.date) >= weekStart).length;
  const latest = [...state.workouts].sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  elements.totalWorkouts.textContent = total;
  elements.weeklyWorkouts.textContent = weekly;
  elements.lastWorkout.textContent = latest ? formatDisplayDate(latest.date) : '—';
}

function renderWorkoutList() {
  const sorted = [...state.workouts].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    elements.workoutList.innerHTML = '<div class="empty-state">No workouts logged yet. Start with your first session.</div>';
    return;
  }

  elements.workoutList.innerHTML = '';

  sorted.forEach((workout) => {
    const card = document.createElement('article');
    card.className = 'workout-entry';
    card.innerHTML = `
      <div class="workout-entry-top">
        <div>
          <h3>${workout.name}</h3>
          <p>${formatDisplayDate(workout.date)}</p>
        </div>
        <span class="pill intensity-pill">${workout.intensity}</span>
      </div>
      <div class="workout-meta">
        <span>${workout.duration} min</span>
      </div>
      ${workout.notes ? `<p class="workout-notes-preview">${workout.notes}</p>` : ''}
      <div class="note-item-actions">
        <button type="button" class="edit-note-button" data-id="${workout.id}">Edit</button>
        <button type="button" class="delete-note-button" data-id="${workout.id}">Delete</button>
      </div>
    `;

    card.querySelector('.edit-note-button').addEventListener('click', () => populateForm(workout));
    card.querySelector('.delete-note-button').addEventListener('click', () => deleteWorkout(workout.id));
    elements.workoutList.appendChild(card);
  });
}

function populateForm(workout) {
  state.editingId = workout.id;
  elements.formTitle.textContent = 'Edit workout';
  setDateConstraints();
  elements.workoutName.value = ALLOWED_ACTIVITIES.includes(workout.name) ? workout.name : '';
  elements.workoutDuration.value = workout.duration;
  elements.workoutIntensity.value = workout.intensity;
  elements.workoutNotes.value = workout.notes || '';
  elements.workoutName.focus();
}

function handleSubmit(event) {
  event.preventDefault();

  const workout = {
    id: state.editingId || createWorkoutId(),
    date: elements.workoutDate.value,
    name: elements.workoutName.value.trim(),
    duration: Number(elements.workoutDuration.value),
    intensity: elements.workoutIntensity.value,
    notes: elements.workoutNotes.value.trim(),
  };

  if (!workout.name || !workout.date || !Number.isFinite(workout.duration) || workout.duration <= 0) {
    window.alert("Please choose an activity, today's date, and a valid duration.");
    return;
  }
  if (!ALLOWED_ACTIVITIES.includes(workout.name)) {
    window.alert('Please choose one of the allowed activities.');
    return;
  }
  if (workout.date !== getTodayString()) {
    window.alert("Please select today's date for your workout.");
    return;
  }

  if (state.editingId) {
    state.workouts = state.workouts.map((item) => (item.id === state.editingId ? workout : item));
  } else {
    state.workouts.push(workout);
  }

  saveWorkouts();
  resetForm();
  render();
  showSaveFeedback('Workout saved and added to your log.');
}

function deleteWorkout(id) {
  state.workouts = state.workouts.filter((workout) => workout.id !== id);
  saveWorkouts();
  if (state.editingId === id) {
    resetForm();
  }
  render();
}

function render() {
  renderSummary();
  renderWorkoutList();
}

function init() {
  loadWorkouts();
  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSubmit(event);
  });
  elements.saveButton.addEventListener('click', (event) => {
    event.preventDefault();
    handleSubmit(event);
  });
  elements.clearButton.addEventListener('click', resetForm);
  setDateConstraints();
  elements.workoutDate.value = getTodayString();
  render();
}

init();
