const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.cookies && req.cookies.devpulse_token) {
      token = req.cookies.devpulse_token;
    }

    // 2. Fallback to Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. No valid token found.'
        }
      });
    }

    // 3. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: err.name === 'TokenExpiredError' ? 'Token has expired. Please log in again.' : 'Invalid token signature.'
        }
      });
    }

    // 4. Attach authenticated user details to request
    req.user = {
      id: decoded.id || decoded.userId || decoded.sub,
      email: decoded.email
    };

    if (!req.user.id) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_PAYLOAD',
          message: 'Token does not contain a valid user identity.'
        }
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Internal server error during authentication.'
      }
    });
  }
};

module.exports = { requireAuth };
