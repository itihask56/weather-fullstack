const rateLimit = require("express-rate-limit");
const cacheService = require("../services/cacheService");

// Custom rate limiter using our cache service
class CustomRateLimiter {
  constructor() {
    this.windowMs = 15 * 60 * 1000; // 15 minutes
    this.maxRequests = 100;
  }

  middleware(options = {}) {
    const windowMs = options.windowMs || this.windowMs;
    const max = options.max || this.maxRequests;
    const keyGenerator = options.keyGenerator || ((req) => req.ip);
    const message = options.message || {
      success: false,
      error: "Too many requests, please try again later",
      code: "RATE_LIMIT_EXCEEDED",
    };

    return (req, res, next) => {
      const key = keyGenerator(req);
      const rateLimitKey = `rate_limit:${key}`;

      const current = cacheService.get(rateLimitKey) || {
        count: 0,
        resetTime: Date.now() + windowMs,
      };

      // Reset if window has expired
      if (Date.now() > current.resetTime) {
        current.count = 0;
        current.resetTime = Date.now() + windowMs;
      }

      current.count++;

      // Set headers
      res.set({
        "X-RateLimit-Limit": max,
        "X-RateLimit-Remaining": Math.max(0, max - current.count),
        "X-RateLimit-Reset": new Date(current.resetTime).toISOString(),
      });

      if (current.count > max) {
        return res.status(429).json({
          ...message,
          retryAfter: Math.ceil((current.resetTime - Date.now()) / 1000),
        });
      }

      // Update cache
      cacheService.set(rateLimitKey, current, Math.ceil(windowMs / 1000));

      next();
    };
  }
}

// Pre-configured rate limiters
const rateLimiters = {
  // General API rate limiter
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      success: false,
      error: "Too many requests, please try again later",
      code: "RATE_LIMIT_EXCEEDED",
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Weather API specific rate limiter
  weather: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // Weather API calls are more expensive
    message: {
      success: false,
      error: "Too many weather requests, please try again later",
      code: "WEATHER_RATE_LIMIT_EXCEEDED",
    },
    keyGenerator: (req) => {
      // Rate limit by IP and city combination for weather requests
      return `${req.ip}:${req.params.city || "general"}`;
    },
  }),

  // Search rate limiter
  search: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    message: {
      success: false,
      error: "Too many search requests, please try again later",
      code: "SEARCH_RATE_LIMIT_EXCEEDED",
    },
  }),

  // Admin operations rate limiter
  admin: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
      success: false,
      error: "Too many admin requests, please try again later",
      code: "ADMIN_RATE_LIMIT_EXCEEDED",
    },
  }),
};

module.exports = {
  CustomRateLimiter,
  rateLimiters,
};
