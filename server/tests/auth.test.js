const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

describe('Authentication API & Middleware Integration Tests', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('successfully registers a user with valid credentials and sets HttpOnly cookie', async () => {
      const mockCreatedUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Jane Doe',
        email: 'jane@university.edu',
        toJSON: () => ({
          _id: '507f1f77bcf86cd799439011',
          name: 'Jane Doe',
          email: 'jane@university.edu',
          createdAt: new Date().toISOString()
        })
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'create').mockResolvedValue(mockCreatedUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@university.edu',
          password: 'Password123!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('jane@university.edu');
      expect(res.body.data.user.password).toBeUndefined(); // Never leaked

      // Check HttpOnly cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('token=') && c.includes('HttpOnly'))).toBe(true);
    });

    test('rejects registration when mandatory fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'jane@university.edu'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_FIELDS');
    });

    test('rejects registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'not-an-email',
          password: 'Password123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_EMAIL');
    });

    test('rejects registration when password is shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@university.edu',
          password: 'short'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('WEAK_PASSWORD');
    });

    test('rejects duplicate email registration with 409 Conflict regardless of casing', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'student@university.edu'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'STUDENT@UNIVERSITY.EDU',
          password: 'Password123!'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    test('logs in successfully with valid credentials and sets auth cookie', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Alice Smith',
        email: 'alice@university.edu',
        comparePassword: jest.fn().mockResolvedValue(true),
        toJSON: () => ({
          _id: '507f1f77bcf86cd799439011',
          name: 'Alice Smith',
          email: 'alice@university.edu'
        })
      };

      const selectMock = jest.fn().mockResolvedValue(mockUser);
      jest.spyOn(User, 'findOne').mockReturnValue({ select: selectMock });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@university.edu',
          password: 'SecurePassword123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('alice@university.edu');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('token='))).toBe(true);
    });

    test('rejects login with non-existent email with generic 401 error', async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      jest.spyOn(User, 'findOne').mockReturnValue({ select: selectMock });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@university.edu',
          password: 'SecurePassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password.');
    });

    test('rejects login with incorrect password with generic 401 error', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'alice@university.edu',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      const selectMock = jest.fn().mockResolvedValue(mockUser);
      jest.spyOn(User, 'findOne').mockReturnValue({ select: selectMock });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@university.edu',
          password: 'WrongPassword!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password.');
    });
  });

  describe('GET /api/auth/me and POST /api/auth/logout', () => {
    const validUserId = '507f1f77bcf86cd799439011';
    const testToken = generateToken({ id: validUserId, email: 'bob@university.edu' });

    test('GET /api/auth/me returns authenticated user profile when cookie is present', async () => {
      const mockUser = {
        _id: validUserId,
        name: 'Bob Jones',
        email: 'bob@university.edu',
        toJSON: () => ({
          _id: validUserId,
          name: 'Bob Jones',
          email: 'bob@university.edu'
        })
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${testToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('bob@university.edu');
      expect(res.body.data.user.name).toBe('Bob Jones');
    });

    test('GET /api/auth/me rejects request with 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('POST /api/auth/logout clears auth cookie and subsequent /me returns 401', async () => {
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [`token=${testToken}`]);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      const clearCookies = logoutRes.headers['set-cookie'];
      expect(clearCookies).toBeDefined();
      expect(clearCookies.some((c) => c.includes('Max-Age=0') || c.includes('expires='))).toBe(true);

      const unauthRes = await request(app).get('/api/auth/me');
      expect(unauthRes.status).toBe(401);
    });
  });
});
