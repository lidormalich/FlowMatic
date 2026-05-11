const winston = require('winston');
require('winston-mongodb');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const transports = [
  new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), consoleFormat)
  })
];

// Add MongoDB transport after env is loaded
if (process.env.MONGO_URI) {
  transports.push(
    new winston.transports.MongoDB({
      db: process.env.MONGO_URI,
      collection: 'system_logs',
      level: 'warn',
      storeHost: true,
      capped: true,
      cappedMax: 10000,
      tryReconnect: true
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), errors({ stack: true })),
  transports
});

module.exports = logger;
