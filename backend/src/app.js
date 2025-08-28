const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config/config");

// Import services (initialize database)
const databaseService = require("./services/databaseService");
const cacheService = require("./services/cacheService");

// Import middleware
const logger = require("./middleware/logger");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// Import routes
const weatherRoutes = require("./routes/weatherRoutes");

const app = express();

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../../frontend")));

// Custom middleware
app.use(logger);

// API routes
app.use("/api", weatherRoutes);

// Serve the main HTML file for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/index.html"));
});

// Health check
app.get("/health", async (req, res) => {
  try {
    const cacheHealthy = cacheService.isHealthy();
    const dbHealthy = databaseService.db !== null;

    const health = {
      status: cacheHealthy && dbHealthy ? "OK" : "DEGRADED",
      message: "Weather Dashboard API is running!",
      timestamp: new Date().toISOString(),
      environment: config.environment,
      services: {
        cache: cacheHealthy ? "healthy" : "unhealthy",
        database: dbHealthy ? "healthy" : "unhealthy",
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    res.status(health.status === "OK" ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      message: "Health check failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
