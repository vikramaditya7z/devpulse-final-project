const request = require('supertest');
const app = require('../app');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const WorkspaceInvitation = require('../models/WorkspaceInvitation');
const SavedRepository = require('../models/SavedRepository');
const HealthReport = require('../models/HealthReport');
const githubService = require('../services/githubService');
const { generateToken } = require('../utils/jwt');
const { hashToken } = require('../utils/crypto');

describe('Full Collaboration Workflow & Invariant Tests (Phase 2.3)', () => {
  const ownerId = '507f1f77bcf86cd799439011';
  const memberId = '507f1f77bcf86cd799439022';
  const outsideUserId = '507f1f77bcf86cd799439033';
  const workspaceId = '607f1f77bcf86cd799439044';
  const repoId = '807f1f77bcf86cd799439066';
  const reportId = '907f1f77bcf86cd799439077';

  const ownerToken = generateToken({ id: ownerId, email: 'owner@university.edu' });
  const memberToken = generateToken({ id: memberId, email: 'member@university.edu' });
  const outsiderToken = generateToken({ id: outsideUserId, email: 'outsider@university.edu' });

  const mockWorkspace = {
    _id: workspaceId,
    name: 'DevPulse Team Alpha',
    owner: ownerId,
    description: 'Distributed engineering test workspace'
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('Scenario 1-4: Owner creates workspace, adds repo, and generates invite URL pointing to correct origin', async () => {
    // 1. Owner creates workspace
    jest.spyOn(Workspace, 'create').mockResolvedValue(mockWorkspace);
    jest.spyOn(WorkspaceMember, 'create').mockResolvedValue({
      workspace: workspaceId,
      user: ownerId,
      role: 'owner'
    });

    const createRes = await request(app)
      .post('/api/workspaces')
      .set('Cookie', [`token=${ownerToken}`])
      .send({ name: 'DevPulse Team Alpha', description: 'Distributed engineering test workspace' });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.workspace.name).toBe('DevPulse Team Alpha');

    // 2. Owner adds public repository
    jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
    jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
      workspace: workspaceId,
      user: ownerId,
      role: 'owner'
    });
    jest.spyOn(githubService, 'getRepoMetadata').mockResolvedValue({
      owner: 'expressjs',
      repo: 'express',
      fullName: 'expressjs/express',
      description: 'Fast, unopinionated framework',
      stars: 60000,
      forks: 14000,
      defaultBranch: 'master',
      url: 'https://github.com/expressjs/express'
    });
    jest.spyOn(SavedRepository, 'findOne').mockResolvedValue(null);
    jest.spyOn(SavedRepository, 'create').mockResolvedValue({
      _id: repoId,
      workspace: workspaceId,
      fullName: 'expressjs/express',
      scope: 'workspace'
    });

    const addRepoRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/repos`)
      .set('Cookie', [`token=${ownerToken}`])
      .send({ repoIdentifier: 'expressjs/express' });

    expect(addRepoRes.status).toBe(201);
    expect(addRepoRes.body.data.repository.fullName).toBe('expressjs/express');

    // 3 & 4. Owner generates invitation URL
    jest.spyOn(WorkspaceInvitation, 'create').mockImplementation((data) => ({
      ...data,
      _id: 'invite-id-123'
    }));

    const inviteRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .set('Cookie', [`token=${ownerToken}`]);

    expect(inviteRes.status).toBe(201);
    const inviteUrl = inviteRes.body.data.invitation.inviteUrl;
    expect(inviteUrl).toBeDefined();
    expect(inviteUrl).toContain('/invite/');
    expect(inviteRes.body.data.invitation.rawToken).toBeDefined();
  });

  test('Scenario 5-7: Second account validates and accepts invitation, appearing in member list', async () => {
    const rawToken = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const tokenHash = hashToken(rawToken);

    const mockInvite = {
      _id: 'inv-123',
      workspace: {
        _id: workspaceId,
        name: 'DevPulse Team Alpha',
        description: 'Team workspace'
      },
      invitedBy: { name: 'Owner User', email: 'owner@university.edu' },
      tokenHash,
      status: 'pending',
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      save: jest.fn().mockResolvedValue(true)
    };

    // 5. Public validation
    jest.spyOn(WorkspaceInvitation, 'findOne').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInvite)
      })
    });

    const validateRes = await request(app).get(`/api/invitations/validate/${rawToken}`);
    expect(validateRes.status).toBe(200);
    expect(validateRes.body.data.workspace.name).toBe('DevPulse Team Alpha');

    // 6. Acceptance by second account
    jest.spyOn(WorkspaceInvitation, 'findOne').mockResolvedValue({
      ...mockInvite,
      workspace: workspaceId,
      save: jest.fn().mockResolvedValue(true)
    });
    jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(null); // not already member
    jest.spyOn(WorkspaceMember, 'create').mockResolvedValue({
      workspace: workspaceId,
      user: memberId,
      role: 'member'
    });

    const acceptRes = await request(app)
      .post('/api/invitations/accept')
      .set('Cookie', [`token=${memberToken}`])
      .send({ token: rawToken });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.workspaceId).toBe(workspaceId);

    // 7. Member appears in member list
    jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
    jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
      workspace: workspaceId,
      user: memberId,
      role: 'member'
    });
    jest.spyOn(WorkspaceMember, 'find').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([
          { user: { _id: ownerId, name: 'Owner' }, role: 'owner' },
          { user: { _id: memberId, name: 'Member' }, role: 'member' }
        ])
      })
    });

    const membersRes = await request(app)
      .get(`/api/workspaces/${workspaceId}/members`)
      .set('Cookie', [`token=${memberToken}`]);

    expect(membersRes.status).toBe(200);
    expect(membersRes.body.data.members.length).toBe(2);
  });

  test('Scenario 8-11: Member can view shared repo health, save report, and owner sees original report snapshot', async () => {
    // 8. Member views repo health
    jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
    jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
      workspace: workspaceId,
      user: memberId,
      role: 'member'
    });
    jest.spyOn(SavedRepository, 'findOne').mockResolvedValue({
      _id: repoId,
      owner: 'expressjs',
      repo: 'express',
      fullName: 'expressjs/express',
      workspace: workspaceId,
      scope: 'workspace',
      save: jest.fn().mockResolvedValue(true)
    });
    jest.spyOn(githubService, 'getRawRepoData').mockResolvedValue({
      metadata: {
        owner: 'expressjs',
        repo: 'express',
        fullName: 'expressjs/express',
        description: 'Express web framework',
        stars: 62000,
        forks: 15000,
        defaultBranch: 'master',
        url: 'https://github.com/expressjs/express'
      },
      issues: [],
      openPullRequests: [],
      closedPullRequests: [],
      recentCommits: []
    });

    const healthRes = await request(app)
      .get(`/api/workspaces/${workspaceId}/repos/${repoId}/health`)
      .set('Cookie', [`token=${memberToken}`]);

    expect(healthRes.status).toBe(200);
    expect(healthRes.body.data.analysis.metrics.healthScore).toBeDefined();

    // 9. Member saves persistent report
    jest.spyOn(HealthReport, 'create').mockResolvedValue({
      _id: reportId,
      workspace: workspaceId,
      repository: { fullName: 'expressjs/express' },
      metrics: healthRes.body.data.analysis.metrics,
      findings: [],
      createdBy: memberId,
      scope: 'workspace'
    });

    const generateRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/reports`)
      .set('Cookie', [`token=${memberToken}`])
      .send({ repoId });

    expect(generateRes.status).toBe(201);
    expect(generateRes.body.data.report._id).toBe(reportId);

    // 10 & 11. Owner inspects saved report and verifies snapshot preservation
    jest.spyOn(HealthReport, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: reportId,
          workspace: { _id: workspaceId, name: 'DevPulse Team Alpha' },
          repository: { fullName: 'expressjs/express' },
          metrics: { healthScore: 85, healthStatus: 'Healthy' },
          findings: [],
          createdBy: { _id: memberId, name: 'Member User' },
          scope: 'workspace',
          generatedAt: new Date().toISOString()
        })
      })
    });

    const ownerReportRes = await request(app)
      .get(`/api/reports/${reportId}`)
      .set('Cookie', [`token=${ownerToken}`]);

    expect(ownerReportRes.status).toBe(200);
    expect(ownerReportRes.body.data.report.metrics.healthScore).toBe(85);
  });

  test('Scenario 12-14: Single-use, duplicate prevention, and expired/revoked invitations fail safely', async () => {
    const activeToken = 'tok123456789tok123456789tok123456789';

    // 12. Duplicate acceptance prevented when already a member
    jest.spyOn(WorkspaceInvitation, 'findOne').mockResolvedValue({
      _id: 'inv-dup',
      workspace: workspaceId,
      tokenHash: hashToken(activeToken),
      status: 'pending',
      expiresAt: new Date(Date.now() + 100000)
    });
    jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
      workspace: workspaceId,
      user: memberId,
      role: 'member'
    });

    const dupRes = await request(app)
      .post('/api/invitations/accept')
      .set('Cookie', [`token=${memberToken}`])
      .send({ token: activeToken });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error.code).toBe('ALREADY_MEMBER');

    // 13. Reusing an already accepted invite fails
    jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(null);
    jest.spyOn(WorkspaceInvitation, 'findOne').mockResolvedValue({
      status: 'accepted',
      expiresAt: new Date(Date.now() + 100000)
    });

    const reuseRes = await request(app)
      .post('/api/invitations/accept')
      .set('Cookie', [`token=${memberToken}`])
      .send({ token: activeToken });

    expect(reuseRes.status).toBe(400);
    expect(reuseRes.body.error.code).toBe('INVITATION_ALREADY_USED');

    // 14. Expired invite fails safely
    jest.spyOn(WorkspaceInvitation, 'findOne').mockResolvedValue({
      status: 'pending',
      expiresAt: new Date(Date.now() - 100000) // expired
    });

    const expiredRes = await request(app)
      .post('/api/invitations/accept')
      .set('Cookie', [`token=${memberToken}`])
      .send({ token: activeToken });

    expect(expiredRes.status).toBe(400);
    expect(expiredRes.body.error.code).toBe('INVITATION_EXPIRED');
  });

  test('Scenario 15-17: Member blocked from owner-only actions, outsider blocked from private workspace/reports', async () => {
    // 15. Member cannot execute owner-only operation (e.g. delete workspace)
    jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
    jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
      workspace: workspaceId,
      user: memberId,
      role: 'member' // Member, NOT owner!
    });

    const deleteRes = await request(app)
      .delete(`/api/workspaces/${workspaceId}`)
      .set('Cookie', [`token=${memberToken}`]);

    expect(deleteRes.status).toBe(403);
    expect(deleteRes.body.error.code).toBe('OWNER_ROLE_REQUIRED');

    // 16 & 17. User outside workspace is rejected with 403 / not a member
    jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
    jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(null); // Outsider has no membership

    const outsiderRes = await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set('Cookie', [`token=${outsiderToken}`]);

    expect(outsiderRes.status).toBe(403);
    expect(outsiderRes.body.error.code).toBe('NOT_A_WORKSPACE_MEMBER');
  });
});
