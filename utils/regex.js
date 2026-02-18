/**
 * Safe regex utilities - prevents regex injection attacks
 * Usage: const { escapeRegex } = require('../utils/regex');
 */

const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Case-insensitive username search (safe from injection)
 * Usage: await User.findOne({ username: { $regex: usernameRegex(req.params.username) } });
 */
const usernameRegex = (username) => {
  const escaped = escapeRegex(username);
  return new RegExp(`^${escaped}$`, 'i');
};

module.exports = {
  escapeRegex,
  usernameRegex
};
