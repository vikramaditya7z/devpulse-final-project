const request = require('supertest');
const app = require('../app');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const WorkspaceInvitation = require('../models/WorkspaceInvitation');
const SavedRepository = require('../models/SavedRepository');
const HealthReport = require('../models/HealthReport');
const { generateToken } = require('../utils/jwt');

describe('Workspace Management & RBAC Integration Tests', () => {
  const ownerId = '507f1f77bcf86cd799439011';
  const memberId = '507f1f77bcf86cd799439022';
  const nonMemberId = '507f1f77bcf86cd799439033';
  const workspaceId = '607f1f77bcf86cd799439044';

  const ownerToken = generateToken({ id: ownerId, email: 'owner@university.edu' });
  const memberToken = generateToken({ id: memberId, email: 'member@university.edu' });
  const nonMemberToken = generateToken({ id: nonMemberId, email: 'stranger@university.edu' });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/workspaces (Create Workspace)', () => {
    test('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/workspaces').send({ name: 'Alpha Team' });
      expect(res.status).toBe(401);
    });

    test('validates workspace name presence and length', async () => {
      const resShort = await request(app)
        .post('/api/workspaces')
        .set('Cookie', [`token=${ownerToken}`])
        .send({ name: 'A' });

      expect(resShort.status).toBe(400);
      expect(resShort.body.error.code).toBe('INVALID_WORKSPACE_NAME_LENGTH');

      const resEmpty = await request(app)
        .post('/api/workspaces')
        .set('Cookie', [`token=${ownerToken}`])
        .send({ name: '   ' });

      expect(resEmpty.status).toBe(400);
    });

    test('creates workspace and establishes owner membership record', async () => {
      const mockWorkspace = {
        _id: workspaceId,
        name: 'Senior Capstone 2026',
        owner: ownerId,
        description: 'Team 4 capstone project'
      };

      jest.spyOn(Workspace, 'create').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'create').mockResolvedValue({
        _id: '707f1f77bcf86cd799439055',
        workspace: workspaceId,
        user: ownerId,
        role: 'owner'
      });

      const res = await request(app)
        .post('/api/workspaces')
        .set('Cookie', [`token=${ownerToken}`])
        .send({
          name: 'Senior Capstone 2026',
          description: 'Team 4 capstone project'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workspace.name).toBe('Senior Capstone 2026');
      expect(WorkspaceMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace: workspaceId,
          user: ownerId,
          role: 'owner'
        })
      );
    });
  });

  describe('GET /api/workspaces (List User Workspaces)', () => {
    test('returns workspaces accessible to authenticated user', async () => {
      const mockMemberships = [
        {
          role: 'owner',
          joinedAt: new Date(),
          workspace: {
            _id: workspaceId,
            name: 'Senior Capstone 2026',
            owner: ownerId,
            createdAt: new Date()
          }
        }
      ];

      const populateMock = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockMemberships)
      });
      jest.spyOn(WorkspaceMember, 'find').mockReturnValue({ populate: populateMock });
      jest.spyOn(WorkspaceMember, 'countDocuments').mockResolvedValue(3);

      const res = await request(app)
        .get('/api/workspaces')
        .set('Cookie', [`token=${ownerToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workspaces.length).toBe(1);
      expect(res.body.data.workspaces[0].role).toBe('owner');
      expect(res.body.data.workspaces[0].memberCount).toBe(3);
    });
  });

  describe('RBAC Middleware & Authorization Boundaries', () => {
    const mockWorkspace = {
      _id: workspaceId,
      name: 'Project Orion',
      owner: ownerId,
      save: jest.fn().mockResolvedValue(true)
    };

    test('rejects requests with invalid ObjectId format with 400', async () => {
      const res = await request(app)
        .get('/api/workspaces/invalid-id-format')
        .set('Cookie', [`token=${ownerToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_WORKSPACE_ID');
    });

    test('rejects requests for non-existent workspace with 404', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}`)
        .set('Cookie', [`token=${ownerToken}`]);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('WORKSPACE_NOT_FOUND');
    });

    test('blocks non-members from viewing workspace details with 403', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      // Non-member has no membership record
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}`)
        .set('Cookie', [`token=${nonMemberToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NOT_A_WORKSPACE_MEMBER');
    });

    test('allows active member to view workspace details and members', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: memberId,
        role: 'member'
      });

      const mockMembers = [
        { role: 'owner', user: { name: 'Alice Owner', email: 'owner@university.edu' } },
        { role: 'member', user: { name: 'Bob Member', email: 'member@university.edu' } }
      ];

      const populateMock = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockMembers)
      });
      jest.spyOn(WorkspaceMember, 'find').mockReturnValue({ populate: populateMock });

      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}`)
        .set('Cookie', [`token=${memberToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('member');
      expect(res.body.data.members.length).toBe(2);
    });

    test('SERVER ENFORCEMENT: blocks regular member from renaming workspace (requires owner)', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: memberId,
        role: 'member'
      });

      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}`)
        .set('Cookie', [`token=${memberToken}`])
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNER_ROLE_REQUIRED');
    });

    test('SERVER ENFORCEMENT: blocks regular member from deleting workspace (requires owner)', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: memberId,
        role: 'member'
      });

      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}`)
        .set('Cookie', [`token=${memberToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNER_ROLE_REQUIRED');
    });

    test('owner can successfully rename workspace', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: ownerId,
        role: 'owner'
      });

      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}`)
        .set('Cookie', [`token=${ownerToken}`])
        .send({ name: 'Renamed Project' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockWorkspace.name).toBe('Renamed Project');
    });

    test('owner can delete workspace and cascade-delete members and invitations', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: ownerId,
        role: 'owner'
      });

      jest.spyOn(Workspace, 'findByIdAndDelete').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'deleteMany').mockResolvedValue({ deletedCount: 3 });
      jest.spyOn(WorkspaceInvitation, 'deleteMany').mockResolvedValue({ deletedCount: 2 });
      jest.spyOn(SavedRepository, 'deleteMany').mockResolvedValue({ deletedCount: 1 });
      jest.spyOn(HealthReport, 'deleteMany').mockResolvedValue({ deletedCount: 1 });

      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}`)
        .set('Cookie', [`token=${ownerToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(WorkspaceMember.deleteMany).toHaveBeenCalledWith({ workspace: workspaceId });
      expect(WorkspaceInvitation.deleteMany).toHaveBeenCalledWith({ workspace: workspaceId });
      expect(SavedRepository.deleteMany).toHaveBeenCalledWith({ workspace: workspaceId, scope: 'workspace' });
      expect(HealthReport.deleteMany).toHaveBeenCalledWith({ workspace: workspaceId, scope: 'workspace' });
    });
  });

  describe('Member Removal & Departure Workflows', () => {
    const mockWorkspace = {
      _id: workspaceId,
      name: 'Project Delta',
      owner: ownerId
    };

    test('prevents removing the workspace owner via member removal', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: ownerId,
        role: 'owner'
      });

      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/members/${ownerId}`)
        .set('Cookie', [`token=${ownerToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_REMOVE_OWNER');
    });

    test('prevents owner from leaving workspace via leave endpoint', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: ownerId,
        role: 'owner'
      });

      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/leave`)
        .set('Cookie', [`token=${ownerToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('OWNER_CANNOT_LEAVE');
    });

    test('owner can remove another member successfully', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: ownerId,
        role: 'owner'
      });
      jest.spyOn(WorkspaceMember, 'findOneAndDelete').mockResolvedValue({
        workspace: workspaceId,
        user: memberId
      });

      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/members/${memberId}`)
        .set('Cookie', [`token=${ownerToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('member can leave workspace successfully', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: memberId,
        role: 'member'
      });
      jest.spyOn(WorkspaceMember, 'findOneAndDelete').mockResolvedValue({
        workspace: workspaceId,
        user: memberId
      });

      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/leave`)
        .set('Cookie', [`token=${memberToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
