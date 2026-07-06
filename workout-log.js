const API_URL = 'http://localhost:5000/api/workouts';

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
  workoutCalories: document.getElementById('workout-calories'),
  workoutIntensity: document.getElementById('workout-intensity'),
  workoutNotes: document.getElementById('workout-notes'),
  saveButton: document.getElementById('save-workout-button'),
  clearButton: document.getElementById('clear-form-button'),
  workoutList: document.getElementById('workout-list'),
  totalWorkouts: document.getElementById('total-workouts'),
  weeklyWorkouts: document.getElementById('weekly-workouts'),
  lastWorkout: document.getElementById('last-workout'),
};

async function loadWorkouts() {
  try {
    const response = await fetch(API_URL);
    state.workouts = await response.json();
  } catch (error) {
    console.error('Failed to load workouts:', error);
    state.workouts = [];
  }
}

function resetForm() {
  elements.form.reset();
  elements.workoutDate.value = new Date().toISOString().slice(0, 10);
  elements.workoutIntensity.value = 'Moderate';
  state.editingId = null;
  elements.formTitle.textContent = 'Log a workout';
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
        <span>${workout.calories ? `${workout.calories} kcal` : 'Calories not set'}</span>
      </div>
      ${workout.notes ? `<p class="workout-notes-preview">${workout.notes}</p>` : ''}
      <div class="note-item-actions">
        <button type="button" class="edit-note-button" data-id="${workout._id}">Edit</button>
        <button type="button" class="delete-note-button" data-id="${workout._id}">Delete</button>
      </div>
    `;

    card.querySelector('.edit-note-button').addEventListener('click', () => populateForm(workout));
    card.querySelector('.delete-note-button').addEventListener('click', () => deleteWorkout(workout._id));
    elements.workoutList.appendChild(card);
  });
}

function populateForm(workout) {
  state.editingId = workout._id;
  elements.formTitle.textContent = 'Edit workout';
  elements.workoutDate.value = workout.date;
  elements.workoutName.value = workout.name;
  elements.workoutDuration.value = workout.duration;
  if (elements.workoutCalories) {
      elements.workoutCalories.value = workout.calories || '';
    }
  elements.workoutIntensity.value = workout.intensity;
  elements.workoutNotes.value = workout.notes || '';
  elements.workoutName.focus();
}

async function handleSubmit(event) {
  event.preventDefault();

  const workout = {
    date: elements.workoutDate.value,
    name: elements.workoutName.value.trim(),
    duration: Number(elements.workoutDuration.value),
    calories: elements.workoutCalories ? Number(elements.workoutCalories.value) || 0 : 0,
    intensity: elements.workoutIntensity.value,
    notes: elements.workoutNotes.value.trim(),
  };

  if (!workout.name || !workout.date || !Number.isFinite(workout.duration) || workout.duration <= 0) {
    window.alert('Please enter a workout name, date, and duration.');
    return;
  }

  try {
    if (state.editingId) {
      await fetch(`${API_URL}/${state.editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workout),
      });
    } else {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workout),
      });
    }

    resetForm();
    await loadWorkouts();
    render();
  } catch (error) {
    window.alert('Could not save workout. Check that the backend server is running.');
    console.error(error);
  }
}

async function deleteWorkout(id) {
  try {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (state.editingId === id) {
      resetForm();
    }
    await loadWorkouts();
    render();
  } catch (error) {
    window.alert('Could not delete workout. Check that the backend server is running.');
    console.error(error);
  }
}

function render() {
  renderSummary();
  renderWorkoutList();
}

async function init() {
  elements.form.addEventListener('submit', handleSubmit);
  elements.clearButton.addEventListener('click', resetForm);
  elements.workoutDate.value = new Date().toISOString().slice(0, 10);
  await loadWorkouts();
  render();
}

init();