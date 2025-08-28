const NodeCache = require("node-cache");

class CacheService {
  constructor() {
    // Initialize cache with 30 minutes TTL by default
    this.cache = new NodeCache({
      stdTTL: 1800, // 30 minutes in seconds
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false,
    });

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
    };

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.cache.on("set", (key, value) => {
      this.stats.sets++;
      console.log(`Cache SET: ${key}`);
    });

    this.cache.on("del", (key, value) => {
      console.log(`Cache DEL: ${key}`);
    });

    this.cache.on("expired", (key, value) => {
      console.log(`Cache EXPIRED: ${key}`);
    });
  }

  // Weather data caching
  getWeatherData(city) {
    const key = `weather:${city.toLowerCase()}`;
    const data = this.cache.get(key);

    if (data) {
      this.stats.hits++;
      console.log(`Cache HIT: ${key}`);
      return data;
    } else {
      this.stats.misses++;
      console.log(`Cache MISS: ${key}`);
      return null;
    }
  }

  setWeatherData(city, data, ttl = 1800) {
    const key = `weather:${city.toLowerCase()}`;
    return this.cache.set(key, data, ttl);
  }

  // API rate limiting cache
  getRateLimitData(identifier) {
    const key = `ratelimit:${identifier}`;
    return this.cache.get(key) || { count: 0, resetTime: Date.now() + 3600000 }; // 1 hour
  }

  setRateLimitData(identifier, data, ttl = 3600) {
    const key = `ratelimit:${identifier}`;
    return this.cache.set(key, data, ttl);
  }

  // User session caching
  getUserSession(sessionId) {
    const key = `session:${sessionId}`;
    const data = this.cache.get(key);

    if (data) {
      this.stats.hits++;
      return data;
    } else {
      this.stats.misses++;
      return null;
    }
  }

  setUserSession(sessionId, data, ttl = 7200) {
    // 2 hours
    const key = `session:${sessionId}`;
    return this.cache.set(key, data, ttl);
  }

  // API response caching for external services
  getApiResponse(endpoint, params = {}) {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    const data = this.cache.get(key);

    if (data) {
      this.stats.hits++;
      return data;
    } else {
      this.stats.misses++;
      return null;
    }
  }

  setApiResponse(endpoint, params = {}, data, ttl = 900) {
    // 15 minutes
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return this.cache.set(key, data, ttl);
  }

  // Generic cache methods
  get(key) {
    const data = this.cache.get(key);
    if (data) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    return data;
  }

  set(key, value, ttl) {
    return this.cache.set(key, value, ttl);
  }

  del(key) {
    return this.cache.del(key);
  }

  // Cache management
  clear() {
    this.cache.flushAll();
    this.resetStats();
    console.log("Cache cleared");
  }

  clearPattern(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter((key) => key.includes(pattern));

    if (matchingKeys.length > 0) {
      this.cache.del(matchingKeys);
      console.log(
        `Cleared ${matchingKeys.length} keys matching pattern: ${pattern}`
      );
    }

    return matchingKeys.length;
  }

  // Statistics and monitoring
  getStats() {
    const cacheStats = this.cache.getStats();
    return {
      ...this.stats,
      keys: cacheStats.keys,
      hits_ratio: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      memory_usage: process.memoryUsage(),
    };
  }

  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
    };
  }

  // Health check
  isHealthy() {
    try {
      const testKey = "health_check";
      this.cache.set(testKey, "ok", 1);
      const result = this.cache.get(testKey);
      this.cache.del(testKey);
      return result === "ok";
    } catch (error) {
      console.error("Cache health check failed:", error);
      return false;
    }
  }

  // Cleanup expired entries manually
  cleanup() {
    const beforeKeys = this.cache.keys().length;
    // Force cleanup of expired keys
    this.cache.keys().forEach((key) => {
      this.cache.get(key); // This will trigger cleanup of expired keys
    });
    const afterKeys = this.cache.keys().length;
    const cleaned = beforeKeys - afterKeys;

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired cache entries`);
    }

    return cleaned;
  }
}

module.exports = new CacheService();
