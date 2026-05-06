import { ValidationError, UniqueConstraintError } from 'sequelize';

// ── 404 handler ─────────────────────────
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

// ── Global error handler ─────────────────────────
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation errors
  if (err instanceof ValidationError || err instanceof UniqueConstraintError) {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages[0],
      errors: messages,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  // Default
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// ── Helper to create HTTP errors ─────────────────────────
export const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};