CREATE DATABASE IF NOT EXISTS c270_fitnesstrackerusers;
USE c270_fitnesstrackerusers;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS workouts (
  _id VARCHAR(255) PRIMARY KEY,
  userId INT NOT NULL,
  date VARCHAR(50),
  name VARCHAR(255),
  duration INT,
  calories INT DEFAULT 0,
  intensity VARCHAR(50),
  notes TEXT,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS goals (
  id VARCHAR(255) PRIMARY KEY,
  userId INT NOT NULL,
  dateKey VARCHAR(50),
  title VARCHAR(255),
  text TEXT,
  time VARCHAR(50),
  offsetVal VARCHAR(50) DEFAULT '60',
  offsetText VARCHAR(255),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS nutrition_entries (
  _id VARCHAR(255) PRIMARY KEY,
  userId INT NOT NULL,
  date VARCHAR(50),
  mealType VARCHAR(100),
  food VARCHAR(255),
  calories INT DEFAULT 0,
  protein INT DEFAULT 0,
  carbs INT DEFAULT 0,
  fat INT DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (userId) REFERENCES users(id)
);
