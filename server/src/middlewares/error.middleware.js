const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  
  logger.error(`[${req.method}] ${req.originalUrl} - ${err.message}`, { stack: err.stack });

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
