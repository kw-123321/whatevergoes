const WORKOUT_API = '/api/workouts';
const NUTRITION_API = '/api/entries';

async function loadProgressDashboard() {
  try {
    const [workoutResponse, nutritionResponse] = await Promise.all([
      fetch(WORKOUT_API),
      fetch(NUTRITION_API)
    ]);

    const workouts = await workoutResponse.json();
    const nutritionEntries = await nutritionResponse.json();

    displayWorkoutProgress(workouts);
    displayNutritionProgress(nutritionEntries);
    displayRecentWorkouts(workouts);
    displayRecentNutrition(nutritionEntries);

    loadCurrentUser();
  } catch (error) {
    console.error('Failed to load progress dashboard:', error);
  }
}

function displayWorkoutProgress(workouts) {
  const totalWorkouts = workouts.length;

  const totalDuration = workouts.reduce((total, workout) => {
    return total + Number(workout.duration || 0);
  }, 0);

  const totalCaloriesBurned = workouts.reduce((total, workout) => {
    return total + Number(workout.calories || 0);
  }, 0);

  document.getElementById('total-workouts').textContent = totalWorkouts;
  document.getElementById('total-duration').textContent = totalDuration;
  document.getElementById('calories-burned').textContent =
    totalCaloriesBurned;
}

function displayNutritionProgress(entries) {
  const totalCalories = entries.reduce((total, entry) => {
    return total + Number(entry.calories || 0);
  }, 0);

  const totalProtein = entries.reduce((total, entry) => {
    return total + Number(entry.protein || 0);
  }, 0);

  const totalCarbs = entries.reduce((total, entry) => {
    return total + Number(entry.carbs || 0);
  }, 0);

  const totalFat = entries.reduce((total, entry) => {
    return total + Number(entry.fat || 0);
  }, 0);

  document.getElementById('calories-consumed').textContent =
    totalCalories;

  document.getElementById('total-protein').textContent =
    totalProtein;

  document.getElementById('total-carbs').textContent =
    totalCarbs;

  document.getElementById('total-fat').textContent =
    totalFat;
}

function displayRecentWorkouts(workouts) {
  const workoutList = document.getElementById('recent-workouts');

  workoutList.innerHTML = '';

  if (workouts.length === 0) {
    workoutList.innerHTML = `
      <div class="empty-state">
        No workouts recorded yet.
      </div>
    `;

    return;
  }

  const recentWorkouts = workouts.slice(0, 5);

  recentWorkouts.forEach((workout) => {
    const workoutEntry = document.createElement('div');

    workoutEntry.className = 'workout-entry';

    workoutEntry.innerHTML = `
      <div class="workout-entry-top">
        <div>
          <h3>${workout.name}</h3>
          <p>${workout.date}</p>
        </div>

        <span class="pill intensity-pill">
          ${workout.intensity}
        </span>
      </div>

      <div class="workout-meta">
        <span>${workout.duration} minutes</span>
        <span>${workout.calories} calories burned</span>
      </div>
    `;

    workoutList.appendChild(workoutEntry);
  });
}

function displayRecentNutrition(entries) {
  const nutritionList = document.getElementById('recent-nutrition');

  nutritionList.innerHTML = '';

  if (entries.length === 0) {
    nutritionList.innerHTML = `
      <div class="empty-state">
        No nutrition entries recorded yet.
      </div>
    `;

    return;
  }

  const recentEntries = entries.slice(0, 5);

  recentEntries.forEach((entry) => {
    const nutritionEntry = document.createElement('div');

    nutritionEntry.className = 'workout-entry';

    nutritionEntry.innerHTML = `
      <div class="workout-entry-top">
        <div>
          <h3>${entry.food}</h3>
          <p>${entry.date}</p>
        </div>

        <span class="pill">
          ${entry.mealType}
        </span>
      </div>

      <div class="workout-meta">
        <span>${entry.calories} kcal</span>
        <span>${entry.protein}g protein</span>
        <span>${entry.carbs}g carbs</span>
        <span>${entry.fat}g fat</span>
      </div>
    `;

    nutritionList.appendChild(nutritionEntry);
  });
}

async function loadCurrentUser() {
  try {
    const response = await fetch('/api/current-user');
    const user = await response.json();

    if (user.loggedIn) {
      document.getElementById('user-profile-display').textContent =
        user.name;
    }
  } catch (error) {
    console.error('Failed to load current user:', error);
  }
}

loadProgressDashboard();