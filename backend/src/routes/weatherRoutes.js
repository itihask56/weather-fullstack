const express = require("express");
const weatherController = require("../controllers/weatherController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiting middleware
const weatherRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests, please try again later",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const searchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 search requests per windowMs
  message: {
    success: false,
    error: "Too many search requests, please try again later",
    code: "SEARCH_RATE_LIMIT_EXCEEDED",
  },
});

// Weather data routes
router.get(
  "/weather/:city",
  weatherRateLimit,
  weatherController.getWeatherByCity.bind(weatherController)
);
router.get(
  "/weather/:city/current",
  weatherRateLimit,
  weatherController.getCurrentWeatherByCity.bind(weatherController)
);

// City management routes
router.get("/cities", weatherController.getAllCities.bind(weatherController));
router.post("/cities", weatherController.addCity.bind(weatherController));
router.delete(
  "/cities/:city",
  weatherController.removeCity.bind(weatherController)
);
router.put(
  "/cities/order",
  weatherController.updateCityOrder.bind(weatherController)
);
router.post(
  "/cities/:city/favorite",
  weatherController.toggleFavorite.bind(weatherController)
);

// Search routes
router.get(
  "/cities/search",
  searchRateLimit,
  weatherController.searchCities.bind(weatherController)
);

// Admin/monitoring routes
router.get("/stats", weatherController.getStats.bind(weatherController));
router.delete("/cache", weatherController.clearCache.bind(weatherController));

// Health check for weather service
router.get("/weather-health", async (req, res) => {
  try {
    // Test with a known city
    const testCity = "London";
    const startTime = Date.now();

    const weatherService = require("../services/weatherService");
    await weatherService.getCurrentWeather(testCity, false);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      service: "Weather API",
      status: "healthy",
      responseTime,
      testCity,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: "Weather API",
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
