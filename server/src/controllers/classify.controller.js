const { success, error } = require('../utils/response');
const { classifyText } = require('../services/classify.service');

/**
 * POST /api/v1/classify
 * Takes a description and returns AI-suggested issue type + severity.
 * Rule-based NLP — transparent, explainable, auditable.
 */
async function classify(req, res, next) {
  try {
    const { description } = req.body;

    if (!description || typeof description !== 'string' || description.trim().length < 3) {
      return error(res, 'Please provide a description (at least 3 characters).');
    }

    const results = classifyText(description);

    if (results.length === 0) {
      return success(res, {
        suggestion: null,
        alternatives: [],
        message: 'Could not classify automatically. Please select a category manually.',
      });
    }

    return success(res, {
      suggestion: results[0],
      alternatives: results.slice(1, 3), // Top 2 alternatives
      message: `Best match: ${results[0].issueType} (${results[0].confidence}% confidence)`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { classify };
