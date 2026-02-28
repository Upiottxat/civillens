const { error } = require('../utils/response');

/**
 * Role guard middleware factory.
 * Usage: authorize('AUTHORITY', 'ADMIN') — only those roles get through.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return error(
        res,
        `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
        403
      );
    }

    next();
  };
}

module.exports = { authorize };
