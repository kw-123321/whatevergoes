/*
 * bmi-calc.js  —  Shared BMI / health-score logic
 * Owner: Aqil (CI/CD)
 *
 * WHY THIS FILE MATTERS FOR CI/CD:
 * This is pure logic with no browser or database dependencies, so it can be
 * imported by BOTH the web page (bmi-tracker.html) AND the automated test
 * (test/bmi.test.js). The test runs inside the GitHub Actions pipeline, so a
 * wrong BMI formula fails the pipeline and can never reach the live site.
 */

// Body Mass Index = weight(kg) / height(m)^2
function calculateBMI(weightKg, heightCm) {
  if (typeof weightKg !== 'number' || typeof heightCm !== 'number') {
    throw new TypeError('weight and height must be numbers');
  }
  if (weightKg <= 0 || heightCm <= 0) {
    throw new RangeError('weight and height must be greater than 0');
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10; // 1 decimal place
}

// WHO BMI categories
function classifyBMI(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25)   return 'Normal';
  if (bmi < 30)   return 'Overweight';
  return 'Obese';
}

// A friendly 0–100 health score: 100 at the healthy midpoint (BMI 22),
// dropping as BMI moves away from that midpoint.
function healthScore(bmi) {
  const IDEAL = 22;
  const score = 100 - Math.round(Math.abs(bmi - IDEAL) * 6);
  return Math.max(0, Math.min(100, score));
}

// Healthy weight range (kg) for a given height, using the Normal BMI band 18.5–24.9
function idealWeightRange(heightCm) {
  const heightM = heightCm / 100;
  const min = 18.5 * heightM * heightM;
  const max = 24.9 * heightM * heightM;
  return { min: Math.round(min * 10) / 10, max: Math.round(max * 10) / 10 };
}

// Export for Node (tests). Guarded so the browser <script> tag ignores it.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateBMI, classifyBMI, healthScore, idealWeightRange };
}
