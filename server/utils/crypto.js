const crypto = require('crypto');

const INVITATION_EXPIRY_HOURS = 48;
const INVITATION_EXPIRY_MS = INVITATION_EXPIRY_HOURS * 60 * 60 * 1000;

/**
 * Generates a cryptographically secure 32-byte hex string token.
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Computes the SHA-256 hex digest of a raw token.
 */
const hashToken = (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('Raw token is required for hashing');
  }
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
};

module.exports = {
  generateSecureToken,
  hashToken,
  INVITATION_EXPIRY_HOURS,
  INVITATION_EXPIRY_MS
};
