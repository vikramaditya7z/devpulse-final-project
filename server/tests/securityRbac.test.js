const request = require('supertest');
const app = require('../app');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const SavedRepository = require('../models/SavedRepository');
const HealthReport = require('../models/HealthReport');
const { generateToken } = require('../utils/jwt');

describe('Security, RBAC & Authorization Integration Tests (TASK-08-01 & TASK-08-03)', () => {
  const userAId = '507f1f77bcf86cd799439001';
  const userBId = '507f1f77bcf86cd799439002';
  const ownerId = userAId;
  const memberId = userBId;
  const nonMemberId = '507f1f77bcf86cd799439003';
  const workspaceId = '607f1f77bcf86cd799439010';
  const repoId = '707f1f77bcf86cd799439020';
  const reportId = '807f1f77bcf86cd799439030';

  const userAToken = generateToken({ id: userAId, email: 'userA@university.edu' });
  const userBToken = generateToken({ id: userBId, email: 'userB@university.edu' });
  const nonMemberToken = generateToken({ id: nonMemberId, email: 'stranger@university.edu' });

  const mockWorkspace = {
    _id: workspaceId,
    name: 'Secure Systems Lab',
    owner: ownerId
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Unauthenticated Rejection (HTTP 401)', () => {
    const protectedEndpoints = [
      { method: 'get', path: '/api/auth/me' },
      { method: 'get', path: '/api/repos' },
      { method: 'post', path: '/api/repos', body: { owner: 'fb', repo: 'react' } },
      { method: 'get', path: `/api/repos/${repoId}/health` },
      { method: 'delete', path: `/api/repos/${repoId}` },
      { method: 'post', path: '/api/repos/analyze', body: { owner: 'fb', repo: 'react' } },
      { method: 'get', path: '/api/workspaces' },
      { method: 'post', path: '/api/workspaces', body: { name: 'New Lab' } },
      { method: 'get', path: `/api/workspaces/${workspaceId}` },
      { method: 'patch', path: `/api/workspaces/${workspaceId}`, body: { name: 'Renamed' } },
      { method: 'delete', path: `/api/workspaces/${workspaceId}` },
      { method: 'get', path: `/api/workspaces/${workspaceId}/invitations` },
      { method: 'post', path: `/api/workspaces/${workspaceId}/invitations` },
      { method: 'get', path: `/api/workspaces/${workspaceId}/repos` },
      { method: 'post', path: `/api/workspaces/${workspaceId}/repos`, body: { owner: 'fb', repo: 'react' } },
      { method: 'delete', path: `/api/workspaces/${workspaceId}/repos/${repoId}` },
      { method: 'get', path: `/api/workspaces/${workspaceId}/reports` },
      { method: 'post', path: `/api/workspaces/${workspaceId}/reports`, body: { repoId } },
      { method: 'get', path: '/api/reports/personal' },
      { method: 'post', path: '/api/reports/personal', body: { repoId } },
      { method: 'get', path: `/api/reports/${reportId}` }
    ];

    test.each(protectedEndpoints)('$method $path rejects unauthenticated request with 401', async ({ method, path, body }) => {
      let req = request(app)[method](path);
      if (body) req = req.send(body);
      const res = await req;
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toMatch(/UNAUTHORIZED|INVALID_TOKEN/);
    });
  });

  describe('2. Non-Member Access Rejection to Workspace Resources (HTTP 403)', () => {
    beforeEach(() => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      // Non-member has no membership record in WorkspaceMember
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(null);
    });

    test('non-member blocked from getting workspace details', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}`)
        .set('Cookie', [`token=${nonMemberToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NOT_A_WORKSPACE_MEMBER');
    });

    test('non-member blocked from viewing workspace repos', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/repos`)
        .set('Cookie', [`token=${nonMemberToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NOT_A_WORKSPACE_MEMBER');
    });

    test('non-member blocked from adding repo to workspace', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/repos`)
        .set('Cookie', [`token=${nonMemberToken}`])
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ owner: 'facebook', repo: 'react' });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NOT_A_WORKSPACE_MEMBER');
    });

    test('non-member blocked from viewing workspace reports', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/reports`)
        .set('Cookie', [`token=${nonMemberToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NOT_A_WORKSPACE_MEMBER');
    });
  });

  describe('3. Member vs. Owner Permission Boundaries (HTTP 403 on Owner-only Actions)', () => {
    beforeEach(() => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      // User B is a regular member, NOT the owner
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: memberId,
        role: 'member'
      });
    });

    test('member blocked from renaming workspace', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}`)
        .set('Cookie', [`token=${userBToken}`])
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ name: 'Hacked Lab Name' });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNER_ROLE_REQUIRED');
    });

    test('member blocked from deleting workspace', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}`)
        .set('Cookie', [`token=${userBToken}`])
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNER_ROLE_REQUIRED');
    });

    test('member blocked from generating invitation links', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/invitations`)
        .set('Cookie', [`token=${userBToken}`])
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNER_ROLE_REQUIRED');
    });

    test('member blocked from deleting a shared repository', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/repos/${repoId}`)
        .set('Cookie', [`token=${userBToken}`])
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNER_ROLE_REQUIRED');
    });

    test('member blocked from deleting a workspace report', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/reports/${reportId}`)
        .set('Cookie', [`token=${userBToken}`])
        .set('X-Requested-With', 'XMLHttpRequest');
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNER_ROLE_REQUIRED');
    });
  });

  describe('4. Cross-User Resource Isolation', () => {
    test('User B cannot view User A personal report via unified endpoint', async () => {
      const mockPersonalReport = {
        _id: reportId,
        scope: 'personal',
        user: userAId, // Belongs to User A
        metrics: { healthScore: 85 },
        findings: []
      };

      const populate2 = jest.fn().mockResolvedValue(mockPersonalReport);
      const populate1 = jest.fn().mockReturnValue({ populate: populate2 });
      jest.spyOn(HealthReport, 'findById').mockReturnValue({ populate: populate1 });

      const res = await request(app)
        .get(`/api/reports/${reportId}`)
        .set('Cookie', [`token=${userBToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('User B cannot delete User A saved personal repository', async () => {
      // Not found under User B
      jest.spyOn(SavedRepository, 'findOneAndDelete').mockResolvedValue(null);
      // Exists in DB under User A
      jest.spyOn(SavedRepository, 'findById').mockResolvedValue({
        _id: repoId,
        user: userAId,
        scope: 'personal'
      });

      const res = await request(app)
        .delete(`/api/repos/${repoId}`)
        .set('Cookie', [`token=${userBToken}`])
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('5. CSRF Protection Middleware', () => {
    test('blocks state-changing request from unauthorized origin when using cookie', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Cookie', [`token=${userAToken}`])
        .set('Origin', 'http://malicious-attacker-site.com')
        .send({ name: 'CSRF Attack Workspace' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_BLOCKED');
    });

    test('allows state-changing request with valid X-Requested-With header', async () => {
      jest.spyOn(Workspace, 'create').mockResolvedValue({
        _id: workspaceId,
        name: 'Valid Safe Workspace',
        owner: userAId
      });
      jest.spyOn(WorkspaceMember, 'create').mockResolvedValue({
        workspace: workspaceId,
        user: userAId,
        role: 'owner'
      });

      const res = await request(app)
        .post('/api/workspaces')
        .set('Cookie', [`token=${userAToken}`])
        .set('Origin', 'http://localhost:5173')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ name: 'Valid Safe Workspace' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('6. Security Headers & Input Sanitization', () => {
    test('sets security headers (Helmet)', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    test('sanitizes NoSQL injection keys ($gt) from request body', async () => {
      const User = require('../models/User');
      jest.spyOn(User, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // When body contains a key starting with $, sanitizeInputs removes it
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          $gt: { field: 1 },
          email: 'user@university.edu',
          password: 'Password123!'
        });

      // Sanitizer strips $gt, controller processes normal fields and returns 401 invalid creds
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });
});
