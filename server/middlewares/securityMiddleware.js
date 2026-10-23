const rateLimit = require('express-rate-limit');

/**
 * Sanitizes input objects to prevent NoSQL query injection
 * Strips keys beginning with '$' or containing '.'
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
  return obj;
};

const sanitizeInputs = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  return next();
};

/**
 * Validates Origin/Referer and custom headers on state-changing requests
 * to guard cookie sessions against CSRF attacks.
 */
const csrfProtection = (req, res, next) => {
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  // Token in Authorization header is immune to browser CSRF
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // Requests passing custom header X-Requested-With cannot be sent across origins
  // by standard browser forms or script without explicit CORS preflight acceptance
  if (req.headers['x-requested-with']) {
    return next();
  }

  const origin = req.headers.origin;
  const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

  if (origin) {
    const currentHostOrigin = `${req.protocol}://${req.get('host')}`;
    const allowed = [
      clientOrigin,
      currentHostOrigin,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5001',
      'http://127.0.0.1:5001'
    ];
    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    if (!allowed.includes(origin) && !isLocalhost) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_BLOCKED',
          message: 'Cross-site request blocked by security policy.'
        }
      });
    }
  }

  return next();
};

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please try again later.'
    }
  }
});

/**
 * Tighter rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_AUTH_ATTEMPTS',
      message: 'Too many authentication attempts. Please try again later.'
    }
  }
});

module.exports = {
  sanitizeInputs,
  csrfProtection,
  apiLimiter,
  authLimiter
};
