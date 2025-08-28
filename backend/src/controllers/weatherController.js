const weatherService = require("../services/weatherService");
const cityModel = require("../models/cityModel");
const cacheService = require("../services/cacheService");
const Joi = require("joi");

class WeatherController {
  constructor() {
    // Validation schemas
    this.citySchema = Joi.object({
      city: Joi.string().min(1).max(100).required().trim(),
      isFavorite: Joi.boolean().default(false),
    });

    this.cityOrderSchema = Joi.object({
      cities: Joi.array().items(Joi.string().min(1).max(100)).required(),
    });

    this.searchSchema = Joi.object({
      q: Joi.string().min(1).max(100).required().trim(),
    });
  }

  // GET /api/weather/:city - Get weather data for a specific city
  async getWeatherByCity(req, res) {
    const startTime = Date.now();

    try {
      const { city } = req.params;
      const { fresh } = req.query; // ?fresh=true to bypass cache

      if (!city || city.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "City name is required",
          code: "INVALID_CITY_NAME",
        });
      }

      const useCache = fresh !== "true";
      const weatherData = await weatherService.getWeatherData(city, useCache);

      res.json({
        success: true,
        data: {
          current: weatherData,
          forecast: weatherData,
          location: weatherData.location,
          cached: useCache && cacheService.getWeatherData(city) !== null,
        },
        meta: {
          city: weatherData.location?.name || city,
          country: weatherData.location?.country,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(`Weather API error for ${req.params.city}:`, error);

      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        error: error.message,
        code: error.message.includes("not found")
          ? "CITY_NOT_FOUND"
          : "WEATHER_API_ERROR",
        meta: {
          city: req.params.city,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // GET /api/weather/:city/current - Get current weather only
  async getCurrentWeatherByCity(req, res) {
    const startTime = Date.now();

    try {
      const { city } = req.params;
      const { fresh } = req.query;

      if (!city || city.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "City name is required",
          code: "INVALID_CITY_NAME",
        });
      }

      const useCache = fresh !== "true";
      const currentData = await weatherService.getCurrentWeather(
        city,
        useCache
      );

      res.json({
        success: true,
        data: currentData,
        meta: {
          city: currentData.location?.name || city,
          country: currentData.location?.country,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          cached:
            useCache &&
            cacheService.get(`current_weather:${city.toLowerCase()}`) !== null,
        },
      });
    } catch (error) {
      console.error(`Current weather API error for ${req.params.city}:`, error);

      res.status(error.message.includes("not found") ? 404 : 500).json({
        success: false,
        error: error.message,
        code: error.message.includes("not found")
          ? "CITY_NOT_FOUND"
          : "WEATHER_API_ERROR",
        meta: {
          city: req.params.city,
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // GET /api/cities - Get all user cities
  async getAllCities(req, res) {
    try {
      const userId = req.headers["x-user-id"] || "default";
      const cities = await cityModel.getAllCities(userId);
      const stats = await cityModel.getCityStats(userId);

      res.json({
        success: true,
        data: cities,
        meta: {
          count: cities.length,
          stats,
          userId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error getting cities:", error);

      res.status(500).json({
        success: false,
        error: "Failed to get cities",
        code: "DATABASE_ERROR",
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // POST /api/cities - Add a new city
  async addCity(req, res) {
    try {
      const { error, value } = this.citySchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
          code: "VALIDATION_ERROR",
          details: error.details,
        });
      }

      const { city, isFavorite } = value;
      const userId = req.headers["x-user-id"] || "default";

      // Validate city name format
      const validation = cityModel.validateCityName(city);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
          code: "INVALID_CITY_FORMAT",
        });
      }

      // Try to fetch weather data to validate city exists
      try {
        await weatherService.getWeatherData(validation.cityName, false);
      } catch (weatherError) {
        // Get suggestions for common mistakes
        const suggestions = weatherService.getSuggestions(validation.cityName);

        return res.status(404).json({
          success: false,
          error: weatherError.message,
          code: "CITY_NOT_FOUND",
          suggestions: suggestions.length > 0 ? suggestions : undefined,
          meta: {
            searchedCity: validation.cityName,
            timestamp: new Date().toISOString(),
          },
        });
      }

      const result = await cityModel.addCity(
        validation.cityName,
        userId,
        isFavorite
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: result.error.includes("exists")
            ? "CITY_ALREADY_EXISTS"
            : "ADD_CITY_ERROR",
        });
      }

      const updatedCities = await cityModel.getAllCities(userId);

      res.status(201).json({
        success: true,
        data: {
          city: result.city,
          allCities: updatedCities,
        },
        meta: {
          message: "City added successfully",
          totalCities: updatedCities.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error adding city:", error);

      res.status(500).json({
        success: false,
        error: "Failed to add city",
        code: "SERVER_ERROR",
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // DELETE /api/cities/:city - Remove a city
  async removeCity(req, res) {
    try {
      const { city } = req.params;
      const userId = req.headers["x-user-id"] || "default";

      if (!city || city.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "City name is required",
          code: "INVALID_CITY_NAME",
        });
      }

      const result = await cityModel.removeCity(city, userId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
          code: "CITY_NOT_FOUND",
        });
      }

      // Clear cache for removed city
      weatherService.clearWeatherCache(city);

      const updatedCities = await cityModel.getAllCities(userId);

      res.json({
        success: true,
        data: {
          removedCity: city,
          allCities: updatedCities,
        },
        meta: {
          message: "City removed successfully",
          totalCities: updatedCities.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error removing city:", error);

      res.status(500).json({
        success: false,
        error: "Failed to remove city",
        code: "SERVER_ERROR",
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // PUT /api/cities/order - Update city display order
  async updateCityOrder(req, res) {
    try {
      const { error, value } = this.cityOrderSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
          code: "VALIDATION_ERROR",
          details: error.details,
        });
      }

      const { cities } = value;
      const userId = req.headers["x-user-id"] || "default";

      const result = await cityModel.updateCityOrder(cities, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: "UPDATE_ORDER_ERROR",
        });
      }

      const updatedCities = await cityModel.getAllCities(userId);

      res.json({
        success: true,
        data: updatedCities,
        meta: {
          message: "City order updated successfully",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error updating city order:", error);

      res.status(500).json({
        success: false,
        error: "Failed to update city order",
        code: "SERVER_ERROR",
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // POST /api/cities/:city/favorite - Toggle favorite status
  async toggleFavorite(req, res) {
    try {
      const { city } = req.params;
      const userId = req.headers["x-user-id"] || "default";

      if (!city || city.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "City name is required",
          code: "INVALID_CITY_NAME",
        });
      }

      const result = await cityModel.toggleFavorite(city, userId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.error,
          code: "CITY_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        data: {
          city,
          isFavorite: result.isFavorite,
        },
        meta: {
          message: `City ${
            result.isFavorite ? "added to" : "removed from"
          } favorites`,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);

      res.status(500).json({
        success: false,
        error: "Failed to toggle favorite",
        code: "SERVER_ERROR",
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // GET /api/cities/search?q=query - Search cities
  async searchCities(req, res) {
    try {
      const { error, value } = this.searchSchema.validate(req.query);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
          code: "VALIDATION_ERROR",
          details: error.details,
        });
      }

      const { q: query } = value;
      const searchResults = await weatherService.searchCities(query);

      res.json({
        success: true,
        data: searchResults,
        meta: {
          query,
          count: searchResults.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error searching cities:", error);

      res.status(500).json({
        success: false,
        error: "Failed to search cities",
        code: "SEARCH_ERROR",
        meta: {
          query: req.query.q,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // GET /api/stats - Get API usage statistics
  async getStats(req, res) {
    try {
      const apiStats = await weatherService.getApiStats();
      const cacheStats = cacheService.getStats();

      res.json({
        success: true,
        data: {
          api: apiStats,
          cache: cacheStats,
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Error getting stats:", error);

      res.status(500).json({
        success: false,
        error: "Failed to get statistics",
        code: "STATS_ERROR",
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // DELETE /api/cache - Clear cache
  async clearCache(req, res) {
    try {
      const { city, type } = req.query;

      if (city) {
        // Clear cache for specific city
        weatherService.clearWeatherCache(city);
        const dbCleared = await weatherService.clearDatabaseCache(city);

        res.json({
          success: true,
          data: {
            message: `Cache cleared for ${city}`,
            databaseEntriesCleared: dbCleared,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      } else if (type === "memory") {
        // Clear only memory cache
        cacheService.clear();

        res.json({
          success: true,
          data: {
            message: "Memory cache cleared",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        // Clear all cache
        cacheService.clear();
        const dbCleared = await weatherService.clearDatabaseCache();

        res.json({
          success: true,
          data: {
            message: "All cache cleared",
            databaseEntriesCleared: dbCleared,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("Error clearing cache:", error);

      res.status(500).json({
        success: false,
        error: "Failed to clear cache",
        code: "CACHE_CLEAR_ERROR",
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

module.exports = new WeatherController();
