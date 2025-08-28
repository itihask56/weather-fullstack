const databaseService = require("../services/databaseService");

class CityModel {
  constructor() {
    // Default cities for new users
    this.defaultCities = ["London", "New York", "Tokyo"];
  }

  async getAllCities(userId = "default") {
    try {
      const cities = await databaseService.getUserCities(userId);

      // If no cities found, initialize with defaults
      if (cities.length === 0) {
        await this.initializeDefaultCities(userId);
        return await databaseService.getUserCities(userId);
      }

      return cities.map((city) => ({
        name: city.city,
        isFavorite: Boolean(city.is_favorite),
        displayOrder: city.display_order,
      }));
    } catch (error) {
      console.error("Error getting cities:", error);
      // Fallback to default cities
      return this.defaultCities.map((city, index) => ({
        name: city,
        isFavorite: false,
        displayOrder: index,
      }));
    }
  }

  async addCity(cityName, userId = "default", isFavorite = false) {
    try {
      if (!cityName || typeof cityName !== "string") {
        return { success: false, error: "Invalid city name" };
      }

      const normalizedCity = this.normalizeCityName(cityName);

      // Check if city already exists
      const existingCities = await databaseService.getUserCities(userId);
      const cityExists = existingCities.some(
        (city) => this.normalizeCityName(city.city) === normalizedCity
      );

      if (cityExists) {
        return { success: false, error: "City already exists" };
      }

      const result = await databaseService.addUserCity(
        cityName,
        userId,
        isFavorite
      );
      return {
        success: true,
        city: {
          name: cityName,
          isFavorite,
          id: result.id,
        },
      };
    } catch (error) {
      console.error("Error adding city:", error);
      return { success: false, error: "Failed to add city" };
    }
  }

  async removeCity(cityName, userId = "default") {
    try {
      if (!cityName) {
        return { success: false, error: "City name is required" };
      }

      const removed = await databaseService.removeUserCity(cityName, userId);
      return {
        success: removed,
        error: removed ? null : "City not found",
      };
    } catch (error) {
      console.error("Error removing city:", error);
      return { success: false, error: "Failed to remove city" };
    }
  }

  async updateCityOrder(cities, userId = "default") {
    try {
      if (!Array.isArray(cities)) {
        return { success: false, error: "Cities must be an array" };
      }

      await databaseService.updateCityOrder(cities, userId);
      return { success: true };
    } catch (error) {
      console.error("Error updating city order:", error);
      return { success: false, error: "Failed to update city order" };
    }
  }

  async toggleFavorite(cityName, userId = "default") {
    try {
      const cities = await databaseService.getUserCities(userId);
      const city = cities.find((c) => c.city === cityName);

      if (!city) {
        return { success: false, error: "City not found" };
      }

      // Remove and re-add with toggled favorite status
      await databaseService.removeUserCity(cityName, userId);
      await databaseService.addUserCity(cityName, userId, !city.is_favorite);

      return {
        success: true,
        isFavorite: !city.is_favorite,
      };
    } catch (error) {
      console.error("Error toggling favorite:", error);
      return { success: false, error: "Failed to toggle favorite" };
    }
  }

  async getFavoriteCities(userId = "default") {
    try {
      const cities = await databaseService.getUserCities(userId);
      return cities
        .filter((city) => city.is_favorite)
        .map((city) => ({
          name: city.city,
          displayOrder: city.display_order,
        }));
    } catch (error) {
      console.error("Error getting favorite cities:", error);
      return [];
    }
  }

  async initializeDefaultCities(userId = "default") {
    try {
      for (let i = 0; i < this.defaultCities.length; i++) {
        await databaseService.addUserCity(this.defaultCities[i], userId, false);
      }
      console.log(`Initialized default cities for user: ${userId}`);
    } catch (error) {
      console.error("Error initializing default cities:", error);
    }
  }

  // Utility methods
  normalizeCityName(cityName) {
    return cityName.toLowerCase().trim().replace(/\s+/g, " ");
  }

  validateCityName(cityName) {
    if (!cityName || typeof cityName !== "string") {
      return { valid: false, error: "City name must be a string" };
    }

    const trimmed = cityName.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: "City name cannot be empty" };
    }

    if (trimmed.length > 100) {
      return { valid: false, error: "City name too long" };
    }

    // Basic validation for city names (letters, spaces, hyphens, apostrophes)
    const validPattern = /^[a-zA-Z\s\-'\.]+$/;
    if (!validPattern.test(trimmed)) {
      return { valid: false, error: "City name contains invalid characters" };
    }

    return { valid: true, cityName: trimmed };
  }

  // Statistics and analytics
  async getCityStats(userId = "default") {
    try {
      const cities = await databaseService.getUserCities(userId);
      return {
        totalCities: cities.length,
        favoriteCities: cities.filter((c) => c.is_favorite).length,
        oldestCity: cities.length > 0 ? cities[0].city : null,
        newestCity: cities.length > 0 ? cities[cities.length - 1].city : null,
      };
    } catch (error) {
      console.error("Error getting city stats:", error);
      return {
        totalCities: 0,
        favoriteCities: 0,
        oldestCity: null,
        newestCity: null,
      };
    }
  }

  // Search and suggestions
  async searchUserCities(query, userId = "default") {
    try {
      const cities = await databaseService.getUserCities(userId);
      const normalizedQuery = query.toLowerCase();

      return cities
        .filter((city) => city.city.toLowerCase().includes(normalizedQuery))
        .map((city) => ({
          name: city.city,
          isFavorite: Boolean(city.is_favorite),
          displayOrder: city.display_order,
        }));
    } catch (error) {
      console.error("Error searching cities:", error);
      return [];
    }
  }

  // Bulk operations
  async bulkAddCities(cityNames, userId = "default") {
    const results = [];

    for (const cityName of cityNames) {
      const result = await this.addCity(cityName, userId);
      results.push({
        city: cityName,
        ...result,
      });
    }

    return results;
  }

  async bulkRemoveCities(cityNames, userId = "default") {
    const results = [];

    for (const cityName of cityNames) {
      const result = await this.removeCity(cityName, userId);
      results.push({
        city: cityName,
        ...result,
      });
    }

    return results;
  }
}

module.exports = new CityModel();
