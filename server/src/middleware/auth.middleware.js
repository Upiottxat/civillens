const jwt = require('jsonwebtoken');
const config = require('../config');
const { prisma } = require('../lib/prisma');
const { error } = require('../utils/response');

/**
 * JWT authentication middleware.
 * Extracts the token from Authorization header, verifies it,
 * attaches the full user object to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Authentication required. Provide a Bearer token.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return error(res, 'User not found. Token may be stale.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return error(res, 'Invalid or expired token.', 401);
    }
    next(err);
  }
}

module.exports = { authenticate };
