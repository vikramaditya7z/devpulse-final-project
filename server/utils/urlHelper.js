/**
 * DevPulse - URL & Origin Helper Utility
 * Resolves and normalizes frontend client origin across environments.
 */

/**
 * Returns the validated, normalized client origin URL for frontend links (such as invitations).
 * @param {import('express').Request} [req] - Optional Express request to detect host in production
 * @returns {string} The normalized base origin (without trailing slash)
 */
function getClientOrigin(req) {
  const isProduction = process.env.NODE_ENV === 'production';
  const configuredClientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.trim().replace(/\/+$/, '') : '';

  if (isProduction) {
    // 1. If an explicit production CLIENT_URL is set and does not point to localhost, use it
    if (configuredClientUrl && !configuredClientUrl.includes('localhost') && !configuredClientUrl.includes('127.0.0.1')) {
      return configuredClientUrl;
    }

    // 2. Check RENDER_EXTERNAL_URL (automatically populated by Render deployment environment)
    if (process.env.RENDER_EXTERNAL_URL) {
      const renderUrl = process.env.RENDER_EXTERNAL_URL.trim().replace(/\/+$/, '');
      if (renderUrl) {
        return renderUrl.startsWith('http') ? renderUrl : `https://${renderUrl}`;
      }
    }

    // 3. Inspect incoming request headers (x-forwarded-proto + x-forwarded-host or host)
    if (req && typeof req.get === 'function') {
      const host = req.get('x-forwarded-host') || req.get('host');
      const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        return `${proto}://${host}`.replace(/\/+$/, '');
      }
    }

    // 4. Default production fallback to the deployed DevPulse platform URL
    return 'https://devpulse-final-project.onrender.com';
  }

  // Development / Test environments:
  return configuredClientUrl || 'http://localhost:5173';
}

/**
 * Builds a full invitation URL using the resolved client origin.
 * @param {string} token - The raw invitation token
 * @param {import('express').Request} [req] - Optional Express request
 * @returns {string} The full invitation URL
 */
function buildInviteUrl(token, req) {
  if (!token || typeof token !== 'string') {
    throw new Error('Valid invitation token is required to build invite URL');
  }
  const origin = getClientOrigin(req);
  return `${origin}/invite/${encodeURIComponent(token.trim())}`;
}

module.exports = {
  getClientOrigin,
  buildInviteUrl
};
