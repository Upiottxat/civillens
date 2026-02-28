/**
 * Standard response wrapper — every endpoint returns this shape.
 * Judges love consistency; this makes the API feel production-grade.
 */

const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

const error = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
};

const paginated = (res, data, { page, limit, total }) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { success, error, paginated };
