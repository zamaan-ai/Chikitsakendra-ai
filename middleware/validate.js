const { validationResult } = require('express-validator');

/** Run after a chain of express-validator checks; short-circuits with 400 on failure. */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  }
  next();
}

module.exports = { handleValidation };
