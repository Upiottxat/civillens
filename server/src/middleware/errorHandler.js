/**
 * Global error handler middleware.
 * Catches all unhandled errors and returns a standardised JSON response.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);

  // Prisma known request error
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      success: false,
      error: 'Database error — check your request payload.',
      ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired.',
    });
  }

  // Default
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error.',
  });
}

module.exports = { errorHandler };
