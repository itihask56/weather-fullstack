#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🚀 Setting up Weather Dashboard for production...");

// Ensure data directory exists
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("✅ Created data directory");
}

// Check if .env file exists
const envPath = path.join(__dirname, "../.env");
if (!fs.existsSync(envPath)) {
  console.log(
    "⚠️  Warning: .env file not found. Please create one with your API key."
  );
  console.log("   Example: WEATHER_API_KEY=your_key_here");
} else {
  console.log("✅ Environment file found");
}

// Check if database exists, if not it will be created automatically
const dbPath = path.join(dataDir, "weather.db");
if (!fs.existsSync(dbPath)) {
  console.log("📦 Database will be created on first run");
} else {
  console.log("✅ Database file exists");
}

console.log("🎉 Setup complete! Ready for deployment.");
