/**
 * Safe ObjectId casting for aggregation pipelines
 * Replaces scattered 'new mongoose.Types.ObjectId(id)' calls across routes
 *
 * Usage:
 *   const { toObjectId } = require('../utils/mongoId');
 *   const pipeline = [
 *     { $match: { businessOwnerId: toObjectId(req.user.id) } }
 *   ];
 */

const mongoose = require('mongoose');

const toObjectId = (id) => {
  if (!id) return null;
  if (typeof id === 'object' && id.constructor.name === 'ObjectId') {
    return id; // Already an ObjectId
  }
  return new mongoose.Types.ObjectId(id);
};

module.exports = { toObjectId };
