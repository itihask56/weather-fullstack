class WeatherApp {
  constructor() {
    this.apiBase = "/api";
    this.userId = this.getUserId();
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadCities();
    this.setupPeriodicRefresh();
  }

  getUserId() {
    // For now, use a simple user ID system
    let userId = localStorage.getItem("weather_user_id");
    if (!userId) {
      userId = "user_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("weather_user_id", userId);
    }
    return userId;
  }

  bindEvents() {
    // Add city on Enter key
    document.getElementById("cityInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addCity();
    });

    // Add city button
    document.querySelector(".add-city-btn").addEventListener("click", () => {
      this.addCity();
    });

    // Search functionality
    const searchInput = document.getElementById("cityInput");
    let searchTimeout;

    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();

      if (query.length >= 2) {
        searchTimeout = setTimeout(() => {
          this.searchCities(query);
        }, 300);
      } else {
        this.hideSearchSuggestions();
      }
    });

    // Click outside to hide suggestions
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-container")) {
        this.hideSearchSuggestions();
      }
    });
  }

  async makeApiCall(url, options = {}) {
    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": this.userId,
      },
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, finalOptions);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        return data;
      } catch (error) {
        console.error(`API call attempt ${attempt} failed:`, error);

        if (attempt === this.retryAttempts) {
          throw error;
        }

        // Exponential backoff
        await this.delay(this.retryDelay * Math.pow(2, attempt - 1));
      }
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async loadCities() {
    try {
      this.showLoading(true);
      const response = await this.makeApiCall(`${this.apiBase}/cities`);

      document.getElementById("cities").innerHTML = "";

      if (!response.data || response.data.length === 0) {
        this.showEmptyState();
      } else {
        // Sort cities by display order
        const sortedCities = response.data.sort(
          (a, b) => a.displayOrder - b.displayOrder
        );

        for (const cityData of sortedCities) {
          await this.loadWeatherForCity(cityData.name, cityData.isFavorite);
        }
      }

      this.updateStats(response.meta?.stats);
    } catch (error) {
      this.showError("Failed to load cities: " + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  async loadWeatherForCity(city, isFavorite = false) {
    try {
      const response = await this.makeApiCall(
        `${this.apiBase}/weather/${encodeURIComponent(city)}`
      );
      this.displayWeatherCard(
        city,
        response.data,
        isFavorite,
        response.meta?.cached
      );
    } catch (error) {
      console.error(`Failed to load weather for ${city}:`, error);
      this.displayErrorCard(city, error.message, isFavorite);
    }
  }

  displayWeatherCard(city, data, isFavorite = false, cached = false) {
    const weatherData = data.current || data;
    const current = weatherData.current;
    const forecast = weatherData.forecast;
    const location = weatherData.location;

    if (
      !forecast ||
      !forecast.forecastday ||
      !Array.isArray(forecast.forecastday)
    ) {
      console.error("Invalid forecast data structure:", forecast);
      this.displayErrorCard(city, "Invalid weather data received", isFavorite);
      return;
    }

    const dailyForecast = forecast.forecastday.slice(0, 5).map((day) => ({
      day: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
      temp: Math.round(day.day.avgtemp_c),
      desc: day.day.condition.text,
      icon: day.day.condition.icon,
    }));

    const card = document.createElement("div");
    card.className = `city-card ${isFavorite ? "favorite" : ""}`;
    card.innerHTML = `
      <div class="city-header">
        <div class="city-title">
          <h2 class="city-name">${location.name}</h2>
          ${
            cached
              ? '<span class="cached-indicator" title="Cached data">📋</span>'
              : ""
          }
          ${
            isFavorite
              ? '<span class="favorite-star" title="Favorite">⭐</span>'
              : ""
          }
        </div>
        <div class="city-actions">
          <button class="favorite-btn" onclick="weatherApp.toggleFavorite('${city}')" title="${
      isFavorite ? "Remove from favorites" : "Add to favorites"
    }">
            ${isFavorite ? "⭐" : "☆"}
          </button>
          <button class="refresh-btn" onclick="weatherApp.refreshCity('${city}')" title="Refresh weather data">
            🔄
          </button>
          <button class="remove-btn" onclick="weatherApp.removeCity('${city}')" title="Remove city">
            ✕
          </button>
        </div>
      </div>
      
      <div class="current-weather">
        <div class="temperature">${Math.round(current.temp_c)}°C</div>
        <div class="description">${current.condition.text}</div>
        <div class="weather-details">
          <span>Feels like ${Math.round(current.feelslike_c)}°C</span>
          <span>Humidity ${current.humidity}%</span>
          <span>Wind ${current.wind_kph} km/h</span>
        </div>
      </div>
      
      <div class="forecast">
        ${dailyForecast
          .map(
            (day) => `
          <div class="forecast-item">
            <div class="forecast-day">${day.day}</div>
            <div class="forecast-temp">${day.temp}°C</div>
            <div class="forecast-desc">${day.desc}</div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    document.getElementById("cities").appendChild(card);
  }

  displayErrorCard(city, error, isFavorite = false) {
    const card = document.createElement("div");
    card.className = `city-card error-card ${isFavorite ? "favorite" : ""}`;
    card.innerHTML = `
      <div class="city-header">
        <div class="city-title">
          <h2 class="city-name">${city}</h2>
          ${isFavorite ? '<span class="favorite-star">⭐</span>' : ""}
        </div>
        <div class="city-actions">
          <button class="refresh-btn" onclick="weatherApp.refreshCity('${city}')" title="Retry">
            🔄
          </button>
          <button class="remove-btn" onclick="weatherApp.removeCity('${city}')" title="Remove city">
            ✕
          </button>
        </div>
      </div>
      <div class="error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">Failed to load weather: ${error}</div>
        <button class="retry-btn" onclick="weatherApp.refreshCity('${city}')">Retry</button>
      </div>
    `;

    document.getElementById("cities").appendChild(card);
  }

  showEmptyState() {
    document.getElementById("cities").innerHTML = `
      <div class="city-card empty-state" style="grid-column: 1 / -1; text-align: center;">
        <div class="empty-icon">🌍</div>
        <h3>No cities added yet</h3>
        <p>Add a city to see weather information</p>
        <div class="suggested-cities">
          <p>Try these popular cities:</p>
          <div class="suggestion-buttons">
            <button onclick="weatherApp.addSuggestedCity('London')">London</button>
            <button onclick="weatherApp.addSuggestedCity('New York')">New York</button>
            <button onclick="weatherApp.addSuggestedCity('Tokyo')">Tokyo</button>
            <button onclick="weatherApp.addSuggestedCity('Paris')">Paris</button>
          </div>
        </div>
      </div>
    `;
  }

  async addCity() {
    const input = document.getElementById("cityInput");
    const city = input.value.trim();

    if (!city) {
      this.showError("Please enter a city name");
      return;
    }

    try {
      this.showLoading(true);
      const response = await this.makeApiCall(`${this.apiBase}/cities`, {
        method: "POST",
        body: JSON.stringify({ city }),
      });

      input.value = "";
      this.hideSearchSuggestions();
      await this.loadCities();
      this.showSuccess(`${city} added successfully!`);
    } catch (error) {
      this.showError("Failed to add city: " + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  async addSuggestedCity(city) {
    const input = document.getElementById("cityInput");
    input.value = city;
    await this.addCity();
  }

  async removeCity(city) {
    if (!confirm(`Are you sure you want to remove ${city}?`)) {
      return;
    }

    try {
      this.showLoading(true);
      await this.makeApiCall(
        `${this.apiBase}/cities/${encodeURIComponent(city)}`,
        {
          method: "DELETE",
        }
      );

      await this.loadCities();
      this.showSuccess(`${city} removed successfully!`);
    } catch (error) {
      this.showError("Failed to remove city: " + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  async toggleFavorite(city) {
    try {
      const response = await this.makeApiCall(
        `${this.apiBase}/cities/${encodeURIComponent(city)}/favorite`,
        {
          method: "POST",
        }
      );

      await this.loadCities();
      const message = response.data.isFavorite
        ? `${city} added to favorites!`
        : `${city} removed from favorites!`;
      this.showSuccess(message);
    } catch (error) {
      this.showError("Failed to update favorite: " + error.message);
    }
  }

  async refreshCity(city) {
    try {
      this.showLoading(true, `Refreshing ${city}...`);

      // Force fresh data by adding fresh=true parameter
      const response = await this.makeApiCall(
        `${this.apiBase}/weather/${encodeURIComponent(city)}?fresh=true`
      );

      // Find and update the specific city card
      const cityCards = document.querySelectorAll(".city-card");
      for (const card of cityCards) {
        const cityName = card.querySelector(".city-name").textContent;
        if (cityName === city) {
          const isFavorite = card.classList.contains("favorite");
          card.remove();
          this.displayWeatherCard(city, response.data, isFavorite, false);
          break;
        }
      }

      this.showSuccess(`${city} refreshed successfully!`);
    } catch (error) {
      this.showError(`Failed to refresh ${city}: ` + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  async searchCities(query) {
    try {
      const response = await this.makeApiCall(
        `${this.apiBase}/cities/search?q=${encodeURIComponent(query)}`
      );
      this.showSearchSuggestions(response.data);
    } catch (error) {
      console.error("Search failed:", error);
      this.hideSearchSuggestions();
    }
  }

  showSearchSuggestions(cities) {
    let suggestionsContainer = document.getElementById("search-suggestions");

    if (!suggestionsContainer) {
      suggestionsContainer = document.createElement("div");
      suggestionsContainer.id = "search-suggestions";
      suggestionsContainer.className = "search-suggestions";
      document.querySelector(".controls").appendChild(suggestionsContainer);
    }

    if (cities.length === 0) {
      this.hideSearchSuggestions();
      return;
    }

    suggestionsContainer.innerHTML = cities
      .slice(0, 5)
      .map(
        (city) => `
      <div class="suggestion-item" onclick="weatherApp.selectSuggestion('${city.name}')">
        <div class="suggestion-name">${city.name}</div>
        <div class="suggestion-details">${city.region}, ${city.country}</div>
      </div>
    `
      )
      .join("");

    suggestionsContainer.style.display = "block";
  }

  hideSearchSuggestions() {
    const suggestionsContainer = document.getElementById("search-suggestions");
    if (suggestionsContainer) {
      suggestionsContainer.style.display = "none";
    }
  }

  selectSuggestion(cityName) {
    document.getElementById("cityInput").value = cityName;
    this.hideSearchSuggestions();
    this.addCity();
  }

  setupPeriodicRefresh() {
    // Refresh weather data every 30 minutes
    setInterval(() => {
      console.log("Performing periodic refresh...");
      this.loadCities();
    }, 30 * 60 * 1000);
  }

  updateStats(stats) {
    if (!stats) return;

    let statsContainer = document.getElementById("stats-container");
    if (!statsContainer) {
      statsContainer = document.createElement("div");
      statsContainer.id = "stats-container";
      statsContainer.className = "stats-container";
      document.querySelector(".container").appendChild(statsContainer);
    }

    statsContainer.innerHTML = `
      <div class="stats">
        <span>Cities: ${stats.totalCities}</span>
        <span>Favorites: ${stats.favoriteCities}</span>
      </div>
    `;
  }

  showLoading(show, message = "Loading weather data...") {
    const loading = document.getElementById("loading");
    if (loading) {
      if (show) {
        loading.querySelector("p").textContent = message;
        loading.style.display = "block";
      } else {
        loading.style.display = "none";
      }
    }
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showNotification(message, type = "info") {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll(".notification");
    existingNotifications.forEach((n) => n.remove());

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">✕</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.weatherApp = new WeatherApp();
});
