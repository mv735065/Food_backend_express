/**
 * Logger Middleware
 * 
 * Simple request logging middleware to log all incoming requests
 */

const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[${timestamp}] ${method} ${url} - ${ip}`);

  // Log response when it finishes
  res.on('finish', () => {
    const statusCode = res.statusCode;
    console.log(`[${timestamp}] ${method} ${url} - ${statusCode}`);
  });

  next();
};

module.exports = logger;
