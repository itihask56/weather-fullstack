// Load .env file only in development (local)
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    path: require("path").join(__dirname, "../../.env"),
  });
}

const config = {
  port: process.env.PORT || 10000,
  weatherApiKey: process.env.WEATHER_API_KEY,
  weatherApiUrl: "https://api.weatherapi.com/v1",
  environment: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};

// Debug logging for production
if (process.env.NODE_ENV === "production") {
  console.log("🔧 Production Config:");
  console.log("- PORT:", config.port);
  console.log("- NODE_ENV:", config.environment);
  console.log(
    "- WEATHER_API_KEY:",
    config.weatherApiKey ? "✅ Set" : "❌ Missing"
  );
  console.log("- WEATHER_API_URL:", config.weatherApiUrl);
}

module.exports = config;
