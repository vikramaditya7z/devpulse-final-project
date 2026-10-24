const { getClientOrigin, buildInviteUrl } = require('../utils/urlHelper');

describe('urlHelper utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getClientOrigin in development / test', () => {
    test('returns http://localhost:5173 when CLIENT_URL is unset', () => {
      delete process.env.CLIENT_URL;
      process.env.NODE_ENV = 'development';
      expect(getClientOrigin()).toBe('http://localhost:5173');
    });

    test('returns custom CLIENT_URL and strips trailing slashes', () => {
      process.env.CLIENT_URL = 'http://localhost:3000///';
      process.env.NODE_ENV = 'development';
      expect(getClientOrigin()).toBe('http://localhost:3000');
    });
  });

  describe('getClientOrigin in production', () => {
    test('uses explicit production CLIENT_URL when valid and non-localhost', () => {
      process.env.NODE_ENV = 'production';
      process.env.CLIENT_URL = 'https://custom-domain.com/';
      expect(getClientOrigin()).toBe('https://custom-domain.com');
    });

    test('rejects localhost CLIENT_URL in production and falls back to RENDER_EXTERNAL_URL', () => {
      process.env.NODE_ENV = 'production';
      process.env.CLIENT_URL = 'http://localhost:5173';
      process.env.RENDER_EXTERNAL_URL = 'https://devpulse-prod.onrender.com';

      expect(getClientOrigin()).toBe('https://devpulse-prod.onrender.com');
    });

    test('uses request headers when CLIENT_URL is localhost or missing in production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.CLIENT_URL;
      delete process.env.RENDER_EXTERNAL_URL;

      const mockReq = {
        get: jest.fn((header) => {
          if (header === 'x-forwarded-proto') return 'https';
          if (header === 'x-forwarded-host') return 'devpulse-final-project.onrender.com';
          return null;
        })
      };

      expect(getClientOrigin(mockReq)).toBe('https://devpulse-final-project.onrender.com');
    });

    test('falls back to default deployed Render URL if no production env or req headers exist', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.CLIENT_URL;
      delete process.env.RENDER_EXTERNAL_URL;

      expect(getClientOrigin()).toBe('https://devpulse-final-project.onrender.com');
    });
  });

  describe('buildInviteUrl', () => {
    test('constructs full invite URL correctly with raw token', () => {
      process.env.NODE_ENV = 'production';
      process.env.CLIENT_URL = 'https://devpulse-final-project.onrender.com';

      const url = buildInviteUrl('a1b2c3d4e5f6');
      expect(url).toBe('https://devpulse-final-project.onrender.com/invite/a1b2c3d4e5f6');
    });

    test('throws on missing or invalid token', () => {
      expect(() => buildInviteUrl('')).toThrow('Valid invitation token is required');
      expect(() => buildInviteUrl(null)).toThrow('Valid invitation token is required');
    });
  });
});
