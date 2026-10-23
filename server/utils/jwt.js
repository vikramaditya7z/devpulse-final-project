const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'devpulse_fallback_dev_jwt_secret_do_not_use_in_prod';
};

const getCookieOptions = () => {
  const isSecure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
  let sameSite = 'lax';
  if (process.env.COOKIE_SAMESITE) {
    sameSite = process.env.COOKIE_SAMESITE;
  } else if (process.env.COOKIE_SECURE === 'true' && process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost')) {
    sameSite = 'none';
  }
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  };
};

const generateToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

const setAuthCookie = (res, token) => {
  res.cookie('token', token, getCookieOptions());
};

const clearAuthCookie = (res) => {
  const options = getCookieOptions();
  // Set expiry to past to ensure browser deletes it
  res.cookie('token', '', { ...options, maxAge: 0, expires: new Date(0) });
  res.cookie('devpulse_token', '', { ...options, maxAge: 0, expires: new Date(0) });
};

module.exports = {
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  getCookieOptions
};
