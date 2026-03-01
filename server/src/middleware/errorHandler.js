/**
 * Global error handler middleware.
 * Catches all unhandled errors and returns a standardised JSON response.
 * NEVER leaks stack traces or internal details in production.
 */

const isDev = process.env.NODE_ENV !== 'production';

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Always log full error server-side
  console.error(`[ERROR] ${req.method} ${req.url} —`, err);

  // Prisma known request error (P2002 = unique constraint, P2025 = not found, etc.)
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      success: false,
      error: 'Database error — check your request payload.',
      ...(isDev && { detail: err.message, code: err.code }),
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

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large. Maximum size is 10 MB.',
    });
  }

  // Syntax error (malformed JSON body)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON in request body.',
    });
  }

  // Default — never leak internal details in production
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: isDev ? err.message : 'Internal server error.',
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
