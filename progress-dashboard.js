const WORKOUT_API = '/api/workouts';
const GOAL_API = '/api/goals';
const NUTRITION_API = '/api/entries';

async function loadProgressDashboard() {
  try {
    const [workoutResponse, goalResponse, nutritionResponse] =
      await Promise.all([
        fetch(WORKOUT_API),
        fetch(GOAL_API),
        fetch(NUTRITION_API)
      ]);

    const workouts = await workoutResponse.json();
    const goals = await goalResponse.json();
    const nutritionEntries = await nutritionResponse.json();

    displayWorkoutProgress(workouts);
    displayGoalProgress(goals);
    displayNutritionProgress(nutritionEntries);

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

  displayRecentWorkouts(workouts);
}

function displayRecentWorkouts(workouts) {
  const workoutList = document.getElementById('recent-workouts');

  workoutList.innerHTML = '';

  if (workouts.length === 0) {
    workoutList.innerHTML = '<li>No workouts recorded yet.</li>';
    return;
  }

  const recentWorkouts = workouts.slice(0, 5);

  recentWorkouts.forEach((workout) => {
    const listItem = document.createElement('li');

    listItem.textContent =
      `${workout.name} - ${workout.duration} minutes - ` +
      `${workout.calories} calories`;

    workoutList.appendChild(listItem);
  });
}

function displayGoalProgress(goals) {
  const goalCount = goals.length;

  const goalProgressText =
    document.getElementById('goal-progress-text');

  const goalProgressBar =
    document.getElementById('goal-progress-bar');

  goalProgressText.textContent =
    `${goalCount} goal${goalCount === 1 ? '' : 's'} recorded`;

  const progressPercentage = Math.min(goalCount * 20, 100);

  goalProgressBar.style.width = `${progressPercentage}%`;
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

loadProgressDashboard();