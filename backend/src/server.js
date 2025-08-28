const app = require("./app");
const config = require("./config/config");

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🌤️  Weather Dashboard API running on port ${PORT}`);
  console.log(`📍 Environment: ${config.environment}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);

  if (config.environment === "development") {
    console.log(`🌐 CORS enabled for: ${config.corsOrigin}`);
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});
