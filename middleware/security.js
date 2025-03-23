const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting middleware
exports.limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes',
  skipSuccessfulRequests: false // count all requests
});

// API specific rate limiter - more strict for login attempts
exports.loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // Increased limit for mobile app with OAuth
  message: 'Too many login attempts from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false
});

// Configure Helmet middleware - Mobile app friendly configuration
exports.helmetConfig = helmet({
  contentSecurityPolicy: false, // Disabled for mobile app compatibility
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  xssFilter: true,
  noSniff: true,
  dnsPrefetchControl: { allow: true },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'no-referrer' }
}); 