const axios = require("axios");
const config = require("../config/config");
const cacheService = require("./cacheService");
const databaseService = require("./databaseService");

class WeatherService {
  constructor() {
    this.apiKey = config.weatherApiKey;
    this.baseUrl = config.weatherApiUrl;
    this.cacheTTL = 1800; // 30 minutes
    this.dbCacheTTL = 60; // 60 minutes for database cache
  }

  async getWeatherData(city, useCache = true) {
    const startTime = Date.now();

    if (!this.apiKey || this.apiKey === "your_weatherapi_key_here") {
      console.error("❌ Weather API Key Error:");
      console.error(
        "- API Key:",
        this.apiKey ? "Present but invalid" : "Missing"
      );
      console.error("- Environment:", process.env.NODE_ENV);
      console.error(
        "- All env vars:",
        Object.keys(process.env).filter((k) => k.includes("WEATHER"))
      );

      throw new Error(
        process.env.NODE_ENV === "production"
          ? "Weather API key is not configured. Please check environment variables."
          : "Please get a free API key from https://www.weatherapi.com/ and update your .env file"
      );
    }

    try {
      // Check in-memory cache first
      if (useCache) {
        const cachedData = cacheService.getWeatherData(city);
        if (cachedData) {
          console.log(`Weather data served from memory cache for ${city}`);
          await this.logApiUsage(
            "weather_cache_hit",
            city,
            Date.now() - startTime,
            200
          );
          return cachedData;
        }

        // Check database cache
        const dbCachedData = await databaseService.getCachedWeather(city);
        if (dbCachedData) {
          console.log(`Weather data served from database cache for ${city}`);
          // Store in memory cache for faster access
          cacheService.setWeatherData(city, dbCachedData.data, this.cacheTTL);
          await this.logApiUsage(
            "weather_db_cache_hit",
            city,
            Date.now() - startTime,
            200
          );
          return dbCachedData.data;
        }
      }

      console.log(`Fetching fresh weather data for ${city}`);

      const response = await axios.get(`${this.baseUrl}/forecast.json`, {
        params: {
          key: this.apiKey,
          q: city,
          days: 5,
          aqi: "no",
          alerts: "no",
        },
        timeout: 10000, // 10 second timeout
      });

      const weatherData = response.data;
      const responseTime = Date.now() - startTime;

      // Cache the data
      if (useCache) {
        // Store in memory cache
        cacheService.setWeatherData(city, weatherData, this.cacheTTL);

        // Store in database cache
        await databaseService.setCachedWeather(
          city,
          weatherData,
          this.dbCacheTTL
        );
      }

      // Log API usage
      await this.logApiUsage(
        "weather_api_call",
        city,
        responseTime,
        response.status
      );

      return weatherData;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const statusCode = error.response?.status || 500;

      // Log failed API usage
      await this.logApiUsage(
        "weather_api_error",
        city,
        responseTime,
        statusCode
      );

      console.error(
        "Weather API Error:",
        error.response?.data || error.message
      );

      // Try to return stale cache data if available
      if (useCache) {
        const staleData = await this.getStaleWeatherData(city);
        if (staleData) {
          console.log(
            `Serving stale weather data for ${city} due to API error`
          );
          return staleData;
        }
      }

      // Enhanced error handling for specific API errors
      const apiError = error.response?.data?.error;
      if (apiError) {
        switch (apiError.code) {
          case 1006:
            throw new Error(
              `City "${city}" not found. Please check the spelling and try again.`
            );
          case 2006:
            throw new Error(
              "Invalid API key. Please check your Weather API configuration."
            );
          case 2007:
            throw new Error("API key has exceeded calls per month quota.");
          case 2008:
            throw new Error("API key has been disabled.");
          case 9999:
            throw new Error(
              "Weather service is temporarily unavailable. Please try again later."
            );
          default:
            throw new Error(apiError.message || "Failed to fetch weather data");
        }
      }

      throw new Error("Failed to fetch weather data. Please try again later.");
    }
  }

  async getStaleWeatherData(city) {
    try {
      // Get stale data from database (ignore expiry)
      const query = `
        SELECT weather_data, cached_at 
        FROM weather_cache 
        WHERE city = ? 
        ORDER BY cached_at DESC 
        LIMIT 1
      `;

      return new Promise((resolve) => {
        databaseService.db.get(query, [city], (err, row) => {
          if (err || !row) {
            resolve(null);
          } else {
            resolve(JSON.parse(row.weather_data));
          }
        });
      });
    } catch (error) {
      console.error("Error fetching stale weather data:", error);
      return null;
    }
  }

  async getCurrentWeather(city, useCache = true) {
    try {
      const startTime = Date.now();

      // Check cache first
      if (useCache) {
        const cachedData = cacheService.get(
          `current_weather:${city.toLowerCase()}`
        );
        if (cachedData) {
          await this.logApiUsage(
            "current_weather_cache_hit",
            city,
            Date.now() - startTime,
            200
          );
          return cachedData;
        }
      }

      const response = await axios.get(`${this.baseUrl}/current.json`, {
        params: {
          key: this.apiKey,
          q: city,
          aqi: "no",
        },
        timeout: 8000,
      });

      const currentData = response.data;
      const responseTime = Date.now() - startTime;

      // Cache for shorter time (15 minutes)
      if (useCache) {
        cacheService.set(
          `current_weather:${city.toLowerCase()}`,
          currentData,
          900
        );
      }

      await this.logApiUsage(
        "current_weather_api_call",
        city,
        responseTime,
        response.status
      );
      return currentData;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const statusCode = error.response?.status || 500;

      await this.logApiUsage(
        "current_weather_api_error",
        city,
        responseTime,
        statusCode
      );

      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to fetch current weather data"
      );
    }
  }

  async searchCities(query) {
    try {
      const startTime = Date.now();

      // Check cache first
      const cachedResults = cacheService.get(`search:${query.toLowerCase()}`);
      if (cachedResults) {
        await this.logApiUsage(
          "city_search_cache_hit",
          query,
          Date.now() - startTime,
          200
        );
        return cachedResults;
      }

      const response = await axios.get(`${this.baseUrl}/search.json`, {
        params: {
          key: this.apiKey,
          q: query,
        },
        timeout: 5000,
      });

      const searchResults = response.data;
      const responseTime = Date.now() - startTime;

      // Cache search results for 1 hour
      cacheService.set(`search:${query.toLowerCase()}`, searchResults, 3600);

      await this.logApiUsage(
        "city_search_api_call",
        query,
        responseTime,
        response.status
      );
      return searchResults;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const statusCode = error.response?.status || 500;

      await this.logApiUsage(
        "city_search_api_error",
        query,
        responseTime,
        statusCode
      );

      // Enhanced error handling for search API errors
      const apiError = error.response?.data?.error;
      if (apiError) {
        switch (apiError.code) {
          case 1006:
            throw new Error(
              `No cities found matching "${query}". Please try a different search term.`
            );
          case 2006:
            throw new Error(
              "Invalid API key. Please check your Weather API configuration."
            );
          case 2007:
            throw new Error("API key has exceeded calls per month quota.");
          case 2008:
            throw new Error("API key has been disabled.");
          default:
            throw new Error(apiError.message || "Failed to search cities");
        }
      }

      throw new Error("Failed to search cities. Please try again later.");
    }
  }

  async logApiUsage(endpoint, city, responseTime, statusCode) {
    try {
      await databaseService.logApiUsage(
        endpoint,
        city,
        responseTime,
        statusCode
      );
    } catch (error) {
      console.error("Failed to log API usage:", error);
    }
  }

  async getApiStats() {
    try {
      return await databaseService.getApiUsageStats();
    } catch (error) {
      console.error("Failed to get API stats:", error);
      return null;
    }
  }

  // Cache management methods
  clearWeatherCache(city = null) {
    if (city) {
      cacheService.del(`weather:${city.toLowerCase()}`);
      cacheService.del(`current_weather:${city.toLowerCase()}`);
    } else {
      cacheService.clearPattern("weather:");
      cacheService.clearPattern("current_weather:");
    }
  }

  async clearDatabaseCache(city = null) {
    try {
      if (city) {
        const query = "DELETE FROM weather_cache WHERE city = ?";
        return new Promise((resolve, reject) => {
          databaseService.db.run(query, [city], function (err) {
            if (err) reject(err);
            else resolve(this.changes);
          });
        });
      } else {
        return await databaseService.clearExpiredCache();
      }
    } catch (error) {
      console.error("Failed to clear database cache:", error);
      return 0;
    }
  }

  // Utility methods
  normalizeCityName(cityName) {
    if (!cityName || typeof cityName !== "string") {
      throw new Error("City name must be a valid string");
    }

    // Basic normalization
    let normalized = cityName.trim();

    // Remove extra spaces
    normalized = normalized.replace(/\s+/g, " ");

    // Capitalize first letter of each word
    normalized = normalized.replace(/\b\w/g, (l) => l.toUpperCase());

    if (normalized.length === 0) {
      throw new Error("City name cannot be empty");
    }

    if (normalized.length > 100) {
      throw new Error("City name is too long");
    }

    // Check for invalid characters
    if (!/^[a-zA-Z\s\-'\.]+$/.test(normalized)) {
      throw new Error(
        "City name contains invalid characters. Use only letters, spaces, hyphens, and apostrophes."
      );
    }

    return normalized;
  }

  // Get suggestions for common city name mistakes
  getSuggestions(cityName) {
    const suggestions = [];
    const lower = cityName.toLowerCase();

    // Common city name corrections
    const corrections = {
      newyork: "New York",
      losangeles: "Los Angeles",
      sanfrancisco: "San Francisco",
      lasvegas: "Las Vegas",
      newdelhi: "New Delhi",
      mumbai: "Mumbai",
      kolkata: "Kolkata",
      bangalore: "Bengaluru",
      chennai: "Chennai",
      hyderabad: "Hyderabad",
      pune: "Pune",
      ahmedabad: "Ahmedabad",
    };

    if (corrections[lower.replace(/\s/g, "")]) {
      suggestions.push(corrections[lower.replace(/\s/g, "")]);
    }

    return suggestions;
  }
}

module.exports = new WeatherService();
