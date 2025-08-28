const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class DatabaseService {
  constructor() {
    this.dbPath = path.join(__dirname, "../../data/weather.db");
    this.db = null;
    this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("Error opening database:", err);
          reject(err);
        } else {
          console.log("Connected to SQLite database");
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const createUserPreferencesTable = `
        CREATE TABLE IF NOT EXISTS user_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT DEFAULT 'default',
          city TEXT NOT NULL,
          is_favorite BOOLEAN DEFAULT 0,
          display_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, city)
        )
      `;

      const createWeatherCacheTable = `
        CREATE TABLE IF NOT EXISTS weather_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          city TEXT NOT NULL UNIQUE,
          weather_data TEXT NOT NULL,
          cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL
        )
      `;

      const createApiUsageTable = `
        CREATE TABLE IF NOT EXISTS api_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          endpoint TEXT NOT NULL,
          city TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          response_time INTEGER,
          status_code INTEGER
        )
      `;

      this.db.serialize(() => {
        this.db.run(createUserPreferencesTable);
        this.db.run(createWeatherCacheTable);
        this.db.run(createApiUsageTable, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log("Database tables created successfully");
            resolve();
          }
        });
      });
    });
  }

  // User Preferences Methods
  async getUserCities(userId = "default") {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT city, is_favorite, display_order 
        FROM user_preferences 
        WHERE user_id = ? 
        ORDER BY display_order ASC, created_at ASC
      `;

      this.db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async addUserCity(city, userId = "default", isFavorite = false) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO user_preferences (user_id, city, is_favorite, display_order, updated_at)
        VALUES (?, ?, ?, 
          COALESCE((SELECT MAX(display_order) + 1 FROM user_preferences WHERE user_id = ?), 0),
          CURRENT_TIMESTAMP
        )
      `;

      this.db.run(query, [userId, city, isFavorite, userId], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, city, isFavorite });
        }
      });
    });
  }

  async removeUserCity(city, userId = "default") {
    return new Promise((resolve, reject) => {
      const query =
        "DELETE FROM user_preferences WHERE user_id = ? AND city = ?";

      this.db.run(query, [userId, city], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async updateCityOrder(cities, userId = "default") {
    return new Promise((resolve, reject) => {
      const updatePromises = cities.map((city, index) => {
        return new Promise((res, rej) => {
          const query = `
            UPDATE user_preferences 
            SET display_order = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = ? AND city = ?
          `;

          this.db.run(query, [index, userId, city], (err) => {
            if (err) rej(err);
            else res();
          });
        });
      });

      Promise.all(updatePromises)
        .then(() => resolve(true))
        .catch(reject);
    });
  }

  // Weather Cache Methods
  async getCachedWeather(city) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT weather_data, cached_at, expires_at 
        FROM weather_cache 
        WHERE city = ? AND expires_at > CURRENT_TIMESTAMP
      `;

      this.db.get(query, [city], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            data: JSON.parse(row.weather_data),
            cachedAt: row.cached_at,
            expiresAt: row.expires_at,
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  async setCachedWeather(city, weatherData, ttlMinutes = 30) {
    return new Promise((resolve, reject) => {
      const expiresAt = new Date(
        Date.now() + ttlMinutes * 60 * 1000
      ).toISOString();
      const query = `
        INSERT OR REPLACE INTO weather_cache (city, weather_data, cached_at, expires_at)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?)
      `;

      this.db.run(
        query,
        [city, JSON.stringify(weatherData), expiresAt],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        }
      );
    });
  }

  async clearExpiredCache() {
    return new Promise((resolve, reject) => {
      const query =
        "DELETE FROM weather_cache WHERE expires_at <= CURRENT_TIMESTAMP";

      this.db.run(query, function (err) {
        if (err) {
          reject(err);
        } else {
          console.log(`Cleared ${this.changes} expired cache entries`);
          resolve(this.changes);
        }
      });
    });
  }

  // API Usage Tracking
  async logApiUsage(endpoint, city, responseTime, statusCode) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO api_usage (endpoint, city, response_time, status_code)
        VALUES (?, ?, ?, ?)
      `;

      this.db.run(
        query,
        [endpoint, city, responseTime, statusCode],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  async getApiUsageStats(hours = 24) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_requests,
          AVG(response_time) as avg_response_time,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
        FROM api_usage 
        WHERE timestamp >= datetime('now', '-${hours} hours')
      `;

      this.db.get(query, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error("Error closing database:", err);
        } else {
          console.log("Database connection closed");
        }
      });
    }
  }
}

module.exports = new DatabaseService();
