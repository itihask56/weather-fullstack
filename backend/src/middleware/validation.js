const Joi = require("joi");

// Common validation schemas
const schemas = {
  city: Joi.object({
    city: Joi.string()
      .min(1)
      .max(100)
      .required()
      .trim()
      .pattern(/^[a-zA-Z\s\-'\.]+$/)
      .messages({
        "string.pattern.base":
          "City name can only contain letters, spaces, hyphens, and apostrophes",
        "string.min": "City name must be at least 1 character long",
        "string.max": "City name cannot exceed 100 characters",
        "any.required": "City name is required",
      }),
    isFavorite: Joi.boolean().default(false),
  }),

  cityParam: Joi.object({
    city: Joi.string().min(1).max(100).required().trim().messages({
      "string.min": "City name must be at least 1 character long",
      "string.max": "City name cannot exceed 100 characters",
      "any.required": "City name is required",
    }),
  }),

  cityOrder: Joi.object({
    cities: Joi.array()
      .items(Joi.string().min(1).max(100))
      .min(1)
      .required()
      .messages({
        "array.min": "At least one city is required",
        "any.required": "Cities array is required",
      }),
  }),

  search: Joi.object({
    q: Joi.string().min(1).max(100).required().trim().messages({
      "string.min": "Search query must be at least 1 character long",
      "string.max": "Search query cannot exceed 100 characters",
      "any.required": "Search query is required",
    }),
  }),

  userId: Joi.object({
    "x-user-id": Joi.string()
      .min(1)
      .max(50)
      .optional()
      .default("default")
      .trim(),
  }),
};

// Validation middleware factory
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    let dataToValidate;

    switch (source) {
      case "body":
        dataToValidate = req.body;
        break;
      case "params":
        dataToValidate = req.params;
        break;
      case "query":
        dataToValidate = req.query;
        break;
      case "headers":
        dataToValidate = req.headers;
        break;
      default:
        dataToValidate = req.body;
    }

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: errorDetails,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Replace the original data with validated data
    switch (source) {
      case "body":
        req.body = value;
        break;
      case "params":
        req.params = value;
        break;
      case "query":
        req.query = value;
        break;
      case "headers":
        // Don't replace headers, just validate
        break;
    }

    next();
  };
};

// Pre-configured validation middleware
const validators = {
  addCity: validate(schemas.city, "body"),
  cityParam: validate(schemas.cityParam, "params"),
  updateCityOrder: validate(schemas.cityOrder, "body"),
  searchQuery: validate(schemas.search, "query"),
  userIdHeader: validate(schemas.userId, "headers"),
};

// Custom validation functions
const customValidators = {
  // Validate city name format
  validateCityName: (cityName) => {
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

    // Basic validation for city names
    const validPattern = /^[a-zA-Z\s\-'\.]+$/;
    if (!validPattern.test(trimmed)) {
      return { valid: false, error: "City name contains invalid characters" };
    }

    return { valid: true, cityName: trimmed };
  },

  // Validate coordinates
  validateCoordinates: (lat, lon) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return { valid: false, error: "Invalid coordinates format" };
    }

    if (latitude < -90 || latitude > 90) {
      return { valid: false, error: "Latitude must be between -90 and 90" };
    }

    if (longitude < -180 || longitude > 180) {
      return { valid: false, error: "Longitude must be between -180 and 180" };
    }

    return { valid: true, latitude, longitude };
  },

  // Validate date range
  validateDateRange: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { valid: false, error: "Invalid date format" };
    }

    if (start > end) {
      return { valid: false, error: "Start date must be before end date" };
    }

    if (end > now) {
      return { valid: false, error: "End date cannot be in the future" };
    }

    const maxRange = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (end - start > maxRange) {
      return { valid: false, error: "Date range cannot exceed 30 days" };
    }

    return { valid: true, startDate: start, endDate: end };
  },
};

module.exports = {
  schemas,
  validate,
  validators,
  customValidators,
};
