/**
 * Wraps async route handlers to catch errors and pass to global error handler
 * Replaces 40+ manual try/catch blocks across all route files
 *
 * Usage:
 *   const asyncHandler = require('../utils/asyncHandler');
 *   router.post('/', asyncHandler(async (req, res) => {
 *     const item = new MyModel(req.body);
 *     await item.save();
 *     res.json(item);
 *     // No try/catch needed - errors automatically caught
 *   }));
 */

const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
