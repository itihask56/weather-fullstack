const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.stack);

  // Default error
  let error = {
    message: err.message || "Internal Server Error",
    status: err.status || 500,
  };

  // Weather API specific errors
  if (err.response && err.response.data) {
    error.message = err.response.data.error?.message || err.message;
    error.status = err.response.status || 500;
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
};
