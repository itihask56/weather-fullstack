const fs = require("fs").promises;
const path = require("path");

class UtilityService {
  constructor() {
    this.startTime = Date.now();
  }

  // Time and date utilities
  formatTimestamp(date = new Date()) {
    return date.toISOString();
  }

  getUptime() {
    return {
      seconds: Math.floor(process.uptime()),
      formatted: this.formatUptime(process.uptime()),
    };
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(" ") || "0s";
  }

  // Memory and performance utilities
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: this.formatBytes(usage.rss),
      heapTotal: this.formatBytes(usage.heapTotal),
      heapUsed: this.formatBytes(usage.heapUsed),
      external: this.formatBytes(usage.external),
      arrayBuffers: this.formatBytes(usage.arrayBuffers),
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // String utilities
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }

  capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  truncate(text, length = 100, suffix = "...") {
    if (text.length <= length) return text;
    return text.substring(0, length) + suffix;
  }

  // Array utilities
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  unique(array) {
    return [...new Set(array)];
  }

  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Object utilities
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  pick(obj, keys) {
    const result = {};
    keys.forEach((key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  }

  omit(obj, keys) {
    const result = { ...obj };
    keys.forEach((key) => {
      delete result[key];
    });
    return result;
  }

  // Validation utilities
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  // File utilities
  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  // Weather utilities
  celsiusToFahrenheit(celsius) {
    return (celsius * 9) / 5 + 32;
  }

  fahrenheitToCelsius(fahrenheit) {
    return ((fahrenheit - 32) * 5) / 9;
  }

  getWindDirection(degrees) {
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  getWeatherIcon(condition, isDay = true) {
    const iconMap = {
      sunny: isDay ? "☀️" : "🌙",
      clear: isDay ? "☀️" : "🌙",
      "partly cloudy": isDay ? "⛅" : "☁️",
      cloudy: "☁️",
      overcast: "☁️",
      mist: "🌫️",
      fog: "🌫️",
      "light rain": "🌦️",
      "moderate rain": "🌧️",
      "heavy rain": "⛈️",
      thunderstorm: "⛈️",
      snow: "❄️",
      blizzard: "🌨️",
    };

    const normalizedCondition = condition.toLowerCase();
    return iconMap[normalizedCondition] || "🌤️";
  }

  // Response utilities
  createSuccessResponse(data, meta = {}) {
    return {
      success: true,
      data,
      meta: {
        timestamp: this.formatTimestamp(),
        ...meta,
      },
    };
  }

  createErrorResponse(error, code = "UNKNOWN_ERROR", meta = {}) {
    return {
      success: false,
      error: typeof error === "string" ? error : error.message,
      code,
      meta: {
        timestamp: this.formatTimestamp(),
        ...meta,
      },
    };
  }

  // Async utilities
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async retry(fn, maxAttempts = 3, delayMs = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          throw lastError;
        }

        console.log(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await this.delay(delayMs);
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  // Logging utilities
  logWithTimestamp(level, message, data = {}) {
    const timestamp = this.formatTimestamp();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...data,
    };

    console.log(JSON.stringify(logEntry));
  }

  // Health check utilities
  async performHealthCheck() {
    const health = {
      status: "healthy",
      timestamp: this.formatTimestamp(),
      uptime: this.getUptime(),
      memory: this.getMemoryUsage(),
      services: {},
    };

    // Check database
    try {
      const databaseService = require("./databaseService");
      health.services.database = databaseService.db ? "healthy" : "unhealthy";
    } catch (error) {
      health.services.database = "error";
      health.status = "degraded";
    }

    // Check cache
    try {
      const cacheService = require("./cacheService");
      health.services.cache = cacheService.isHealthy()
        ? "healthy"
        : "unhealthy";
    } catch (error) {
      health.services.cache = "error";
      health.status = "degraded";
    }

    // Check weather API
    try {
      const weatherService = require("./weatherService");
      await weatherService.getCurrentWeather("London", false);
      health.services.weatherApi = "healthy";
    } catch (error) {
      health.services.weatherApi = "unhealthy";
      health.status = "degraded";
    }

    return health;
  }

  // Configuration utilities
  getEnvironmentInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || "development",
      pid: process.pid,
      cwd: process.cwd(),
    };
  }
}

module.exports = new UtilityService();
