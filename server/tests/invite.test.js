const request = require('supertest');
const app = require('../app');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const WorkspaceInvitation = require('../models/WorkspaceInvitation');
const { generateToken } = require('../utils/jwt');
const { hashToken, INVITATION_EXPIRY_MS } = require('../utils/crypto');

describe('Secure Workspace Invitation System Tests', () => {
  const ownerId = '507f1f77bcf86cd799439011';
  const memberId = '507f1f77bcf86cd799439022';
  const invitedUserId = '507f1f77bcf86cd799439033';
  const workspaceId = '607f1f77bcf86cd799439044';
  const invitationId = '807f1f77bcf86cd799439066';

  const ownerToken = generateToken({ id: ownerId, email: 'owner@university.edu' });
  const memberToken = generateToken({ id: memberId, email: 'member@university.edu' });
  const invitedUserToken = generateToken({ id: invitedUserId, email: 'invitee@university.edu' });

  const mockWorkspace = {
    _id: workspaceId,
    name: 'Research Lab Alpha',
    owner: ownerId
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/workspaces/:id/invitations (Create Invite Link)', () => {
    test('blocks regular member from generating invitation link (owner only)', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: memberId,
        role: 'member'
      });

      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/invitations`)
        .set('Cookie', [`token=${memberToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNER_ROLE_REQUIRED');
    });

    test('owner creates invitation with cryptographically hashed token and 48h expiry', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: ownerId,
        role: 'owner'
      });

      let capturedPayload = null;
      jest.spyOn(WorkspaceInvitation, 'create').mockImplementation(async (payload) => {
        capturedPayload = payload;
        return {
          _id: invitationId,
          ...payload
        };
      });

      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/invitations`)
        .set('Cookie', [`token=${ownerToken}`]);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const inviteData = res.body.data.invitation;
      expect(inviteData.rawToken).toBeDefined();
      expect(inviteData.rawToken.length).toBe(64); // 32 bytes hex = 64 chars
      expect(inviteData.inviteUrl).toContain(`/invite/${inviteData.rawToken}`);

      // SECURITY INVARIANT: Database payload MUST store only SHA-256 hash, NEVER raw token!
      expect(capturedPayload).not.toBeNull();
      expect(capturedPayload.tokenHash).toBe(hashToken(inviteData.rawToken));
      expect(capturedPayload.rawToken).toBeUndefined();

      // Verify expiration is set approximately 48 hours into the future
      const now = Date.now();
      const expiresAtMs = new Date(capturedPayload.expiresAt).getTime();
      expect(expiresAtMs - now).toBeGreaterThan(INVITATION_EXPIRY_MS - 5000);
      expect(expiresAtMs - now).toBeLessThanOrEqual(INVITATION_EXPIRY_MS + 1000);
    });
  });

  describe('GET /api/workspaces/:id/invitations & DELETE (List & Revoke)', () => {
    test('owner lists active invitations without leaking token hashes', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: ownerId,
        role: 'owner'
      });

      const mockInvitations = [
        {
          _id: invitationId,
          workspace: workspaceId,
          invitedBy: { name: 'Owner', email: 'owner@university.edu' },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'pending',
          createdAt: new Date()
        }
      ];

      const populateMock = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockInvitations)
      });
      jest.spyOn(WorkspaceInvitation, 'find').mockReturnValue({ populate: populateMock });

      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/invitations`)
        .set('Cookie', [`token=${ownerToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.invitations.length).toBe(1);
      // Ensure tokenHash is never leaked
      expect(res.body.data.invitations[0].tokenHash).toBeUndefined();
    });

    test('owner revokes an active invitation successfully', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: ownerId,
        role: 'owner'
      });

      const mockInv = {
        _id: invitationId,
        workspace: workspaceId,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(WorkspaceInvitation, 'findOne').mockResolvedValue(mockInv);

      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/invitations/${invitationId}`)
        .set('Cookie', [`token=${ownerToken}`]);

      expect(res.status).toBe(200);
      expect(mockInv.status).toBe('revoked');
      expect(mockInv.save).toHaveBeenCalled();
    });
  });

  describe('GET /api/invitations/validate/:token (Token Validation & Preview)', () => {
    const rawToken = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const expectedHash = hashToken(rawToken);

    test('returns 404 for invalid or non-existent token hash', async () => {
      const populate1 = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      jest.spyOn(WorkspaceInvitation, 'findOne').mockImplementation((query) => {
        expect(query.tokenHash).toBe(expectedHash);
        return { populate: populate1 };
      });

      const res = await request(app).get(`/api/invitations/validate/${rawToken}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('INVALID_INVITATION');
    });

    test('rejects revoked invitation with 400 INVITATION_REVOKED', async () => {
      const mockInv = {
        status: 'revoked',
        workspace: { _id: workspaceId, name: 'Lab' },
        expiresAt: new Date(Date.now() + 100000)
      };

      const populate1 = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInv)
      });
      jest.spyOn(WorkspaceInvitation, 'findOne').mockReturnValue({ populate: populate1 });

      const res = await request(app).get(`/api/invitations/validate/${rawToken}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVITATION_REVOKED');
    });

    test('rejects expired invitation (> 48h) with 400 INVITATION_EXPIRED', async () => {
      const mockInv = {
        status: 'pending',
        workspace: { _id: workspaceId, name: 'Lab' },
        expiresAt: new Date(Date.now() - 1000) // Expired in the past
      };

      const populate1 = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInv)
      });
      jest.spyOn(WorkspaceInvitation, 'findOne').mockReturnValue({ populate: populate1 });

      const res = await request(app).get(`/api/invitations/validate/${rawToken}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVITATION_EXPIRED');
    });

    test('returns valid preview info for active invitation', async () => {
      const mockInv = {
        status: 'pending',
        workspace: { _id: workspaceId, name: 'Distributed Systems', description: 'Lab group' },
        invitedBy: { name: 'Alice TeamLead' },
        expiresAt: new Date(Date.now() + 100000)
      };

      const populate1 = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockInv)
      });
      jest.spyOn(WorkspaceInvitation, 'findOne').mockReturnValue({ populate: populate1 });

      const res = await request(app).get(`/api/invitations/validate/${rawToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.workspace.name).toBe('Distributed Systems');
    });
  });

  describe('POST /api/invitations/accept (Accept Invite & Join)', () => {
    const rawToken = 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';

    test('rejects unauthenticated user attempting to accept invite with 401', async () => {
      const res = await request(app)
        .post('/api/invitations/accept')
        .send({ token: rawToken });

      expect(res.status).toBe(401);
    });

    test('rejects acceptance if user is already a member with 409 Conflict', async () => {
      const mockInv = {
        workspace: workspaceId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 100000)
      };

      jest.spyOn(WorkspaceInvitation, 'findOne').mockResolvedValue(mockInv);
      // User already in workspace
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: invitedUserId,
        role: 'member'
      });

      const res = await request(app)
        .post('/api/invitations/accept')
        .set('Cookie', [`token=${invitedUserToken}`])
        .send({ token: rawToken });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_MEMBER');
    });

    test('successfully joins workspace, adds member role, and marks invite single-use accepted', async () => {
      const mockInv = {
        workspace: workspaceId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 100000),
        save: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(WorkspaceInvitation, 'findOne').mockResolvedValue(mockInv);
      // Not yet a member
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(null);
      jest.spyOn(WorkspaceMember, 'create').mockResolvedValue({
        workspace: workspaceId,
        user: invitedUserId,
        role: 'member'
      });

      const res = await request(app)
        .post('/api/invitations/accept')
        .set('Cookie', [`token=${invitedUserToken}`])
        .send({ token: rawToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify member added
      expect(WorkspaceMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace: workspaceId,
          user: invitedUserId,
          role: 'member'
        })
      );

      // Verify invitation marked as single-use accepted
      expect(mockInv.status).toBe('accepted');
      expect(mockInv.acceptedBy).toBe(invitedUserId);
      expect(mockInv.save).toHaveBeenCalled();
    });
  });
});
