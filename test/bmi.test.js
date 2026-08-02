/*
 * test/bmi.test.js  —  Automated tests for the BMI / health-score logic
 * Owner: Aqil (CI/CD)
 *
 * Run locally with:  npm test   (which runs: node --test)
 * Runs automatically in the GitHub Actions pipeline on every push.
 * Uses Node's BUILT-IN test runner — no jest/mocha to install.
 */

const test = require('node:test');
const assert = require('node:assert');
const { calculateBMI, classifyBMI, healthScore, idealWeightRange } = require('../bmi-calc.js');

test('calculateBMI returns correct value for a known case', () => {
  // 70kg, 175cm -> 22.9
  assert.strictEqual(calculateBMI(70, 175), 22.9);
});

test('calculateBMI handles a second known case', () => {
  // 90kg, 180cm -> 27.8
  assert.strictEqual(calculateBMI(90, 180), 27.8);
});

test('classifyBMI returns the correct WHO category', () => {
  assert.strictEqual(classifyBMI(17), 'Underweight');
  assert.strictEqual(classifyBMI(22), 'Normal');
  assert.strictEqual(classifyBMI(27), 'Overweight');
  assert.strictEqual(classifyBMI(32), 'Obese');
});

test('classifyBMI respects the exact category boundaries', () => {
  assert.strictEqual(classifyBMI(18.5), 'Normal');   // 18.5 is Normal, not Underweight
  assert.strictEqual(classifyBMI(24.9), 'Normal');
  assert.strictEqual(classifyBMI(25), 'Overweight'); // 25 flips to Overweight
  assert.strictEqual(classifyBMI(30), 'Obese');
});

test('healthScore is highest at the ideal BMI and lower away from it', () => {
  assert.strictEqual(healthScore(22), 100);          // ideal midpoint
  assert.ok(healthScore(27) < healthScore(22));      // moving away lowers the score
  assert.ok(healthScore(35) >= 0);                   // never below 0
});

test('idealWeightRange gives a sensible healthy range for a height', () => {
  const r = idealWeightRange(175);
  assert.ok(r.min < r.max);
  assert.ok(r.min > 50 && r.max < 80);               // ~56.7kg – 76.3kg for 175cm
});

test('calculateBMI rejects invalid input', () => {
  assert.throws(() => calculateBMI(0, 175), RangeError);
  assert.throws(() => calculateBMI(70, -1), RangeError);
  assert.throws(() => calculateBMI('70', 175), TypeError);
});
