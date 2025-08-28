require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});

const config = {
  port: process.env.PORT || 10000,
  weatherApiKey: process.env.WEATHER_API_KEY,
  weatherApiUrl: "https://api.weatherapi.com/v1",
  environment: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*",
};

module.exports = config;
