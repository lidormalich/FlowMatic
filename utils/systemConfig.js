const SystemConfig = require('../models/SystemConfig');

const DEFAULT = {
    notifications: { reminders: true, confirmations: true, cancellations: true, reschedules: true }
};

let _cache = null;
let _cacheExpiry = 0;

async function getSystemConfig() {
    if (_cache && Date.now() < _cacheExpiry) return _cache;
    const doc = await SystemConfig.findById('singleton').lean();
    _cache = doc || DEFAULT;
    _cacheExpiry = Date.now() + 5 * 60 * 1000;
    return _cache;
}

function invalidateCache() {
    _cache = null;
    _cacheExpiry = 0;
}

module.exports = { getSystemConfig, invalidateCache };
