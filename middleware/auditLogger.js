const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

const RESOURCE_MAP = {
  '/api/appointments': 'appointment',
  '/api/clients': 'client',
  '/api/staff': 'staff',
  '/api/inventory': 'inventory',
  '/api/waitlist': 'waitlist',
  '/api/templates': 'template',
  '/api/appointment-types': 'appointmentType',
  '/api/users/settings': 'settings',
  '/api/users/admin': 'admin'
};

function getResource(path) {
  for (const [prefix, resource] of Object.entries(RESOURCE_MAP)) {
    if (path.startsWith(prefix)) return resource;
  }
  return 'unknown';
}

function getAction(method, path) {
  if (path.includes('/cancel')) return 'cancel';
  if (path.includes('/reschedule')) return 'reschedule';
  if (path.includes('/suspend')) return 'suspend';
  const map = { POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete' };
  return map[method] || method.toLowerCase();
}

function auditLog(req, res, next) {
  if (!AUDITED_METHODS.includes(req.method) || !req.user) return next();

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (res.statusCode < 400) {
      const resourceId = body?._id || body?.data?._id || null;
      AuditLog.create({
        userId: req.user.id,
        action: getAction(req.method, req.path),
        resource: getResource(req.path),
        resourceId,
        details: { method: req.method, path: req.path, statusCode: res.statusCode },
        ip: req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '',
        userAgent: req.headers['user-agent'] || ''
      }).catch(err => logger.error('AuditLog write failed:', err));
    }
    return originalJson(body);
  };

  next();
}

module.exports = auditLog;
