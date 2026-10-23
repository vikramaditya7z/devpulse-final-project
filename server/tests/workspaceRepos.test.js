const request = require('supertest');
const app = require('../app');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const SavedRepository = require('../models/SavedRepository');
const githubService = require('../services/githubService');
const { generateToken } = require('../utils/jwt');

describe('Workspace Repositories Management Integration Tests', () => {
  const ownerId = '507f1f77bcf86cd799439011';
  const memberId = '507f1f77bcf86cd799439022';
  const nonMemberId = '507f1f77bcf86cd799439033';
  const workspaceId = '607f1f77bcf86cd799439044';
  const repoId = '707f1f77bcf86cd799439055';

  const ownerToken = generateToken({ id: ownerId, email: 'owner@university.edu' });
  const memberToken = generateToken({ id: memberId, email: 'member@university.edu' });
  const nonMemberToken = generateToken({ id: nonMemberId, email: 'stranger@university.edu' });

  const mockWorkspace = {
    _id: workspaceId,
    name: 'Distributed Systems Group',
    owner: ownerId
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/workspaces/:id/repos (List Shared Repos)', () => {
    test('blocks non-members from listing workspace repositories with 403', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/repos`)
        .set('Cookie', [`token=${nonMemberToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NOT_A_WORKSPACE_MEMBER');
    });

    test('allows active member to list workspace repositories', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: memberId,
        role: 'member'
      });

      const mockRepos = [
        {
          _id: repoId,
          workspace: workspaceId,
          scope: 'workspace',
          owner: 'facebook',
          repo: 'react',
          fullName: 'facebook/react',
          addedBy: { name: 'Alice Owner', email: 'owner@university.edu' }
        }
      ];

      const populateMock = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockRepos)
      });
      jest.spyOn(SavedRepository, 'find').mockReturnValue({ populate: populateMock });

      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/repos`)
        .set('Cookie', [`token=${memberToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.repositories.length).toBe(1);
      expect(res.body.data.repositories[0].fullName).toBe('facebook/react');
    });
  });

  describe('POST /api/workspaces/:id/repos (Add Repository to Workspace)', () => {
    test('allows workspace member to add a verified public GitHub repo', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: memberId,
        role: 'member'
      });

      jest.spyOn(githubService, 'getRepoMetadata').mockResolvedValue({
        owner: 'expressjs',
        repo: 'express',
        fullName: 'expressjs/express',
        url: 'https://github.com/expressjs/express',
        description: 'Fast, unopinionated, minimalist web framework',
        stars: 65000,
        forks: 14000,
        openIssuesCount: 150,
        defaultBranch: 'master'
      });

      jest.spyOn(SavedRepository, 'findOne').mockResolvedValue(null); // No duplicate
      jest.spyOn(SavedRepository, 'create').mockResolvedValue({
        _id: repoId,
        workspace: workspaceId,
        scope: 'workspace',
        addedBy: memberId,
        fullName: 'expressjs/express'
      });

      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/repos`)
        .set('Cookie', [`token=${memberToken}`])
        .send({ owner: 'expressjs', repo: 'express' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.repository.fullName).toBe('expressjs/express');
      expect(SavedRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace: workspaceId,
          scope: 'workspace',
          addedBy: memberId
        })
      );
    });

    test('rejects adding duplicate repository within the same workspace with 409 Conflict', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: memberId,
        role: 'member'
      });

      jest.spyOn(githubService, 'getRepoMetadata').mockResolvedValue({
        owner: 'expressjs',
        repo: 'express',
        fullName: 'expressjs/express'
      });

      // Existing repository already present in workspace
      jest.spyOn(SavedRepository, 'findOne').mockResolvedValue({
        _id: repoId,
        workspace: workspaceId,
        fullName: 'expressjs/express'
      });

      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/repos`)
        .set('Cookie', [`token=${memberToken}`])
        .send({ owner: 'expressjs', repo: 'express' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('REPO_ALREADY_IN_WORKSPACE');
    });
  });

  describe('DELETE /api/workspaces/:id/repos/:repoId (Remove Repo)', () => {
    test('blocks regular member from removing workspace repository (owner only)', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: memberId,
        role: 'member'
      });

      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/repos/${repoId}`)
        .set('Cookie', [`token=${memberToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('OWNER_ROLE_REQUIRED');
    });

    test('owner can remove workspace repository successfully', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: ownerId,
        role: 'owner'
      });

      jest.spyOn(SavedRepository, 'findOneAndDelete').mockResolvedValue({
        _id: repoId,
        fullName: 'facebook/react'
      });

      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/repos/${repoId}`)
        .set('Cookie', [`token=${ownerToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/workspaces/:id/repos/:repoId/health (Workspace Repo Health)', () => {
    test('workspace member can view live health metrics and bottlenecks for shared repo', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: memberId,
        role: 'member'
      });

      const mockRepo = {
        _id: repoId,
        workspace: workspaceId,
        owner: 'facebook',
        repo: 'react',
        fullName: 'facebook/react',
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(SavedRepository, 'findOne').mockResolvedValue(mockRepo);

      jest.spyOn(githubService, 'getRawRepoData').mockResolvedValue({
        metadata: {
          owner: 'facebook',
          repo: 'react',
          fullName: 'facebook/react',
          description: 'React library',
          stars: 220000,
          forks: 45000,
          openIssuesCount: 1200,
          defaultBranch: 'main',
          url: 'https://github.com/facebook/react'
        },
        issues: [
          {
            number: 1,
            title: 'Stale open issue',
            created_at: '2026-08-01T00:00:00.000Z',
            updated_at: '2026-08-01T00:00:00.000Z'
          }
        ],
        openPullRequests: [],
        closedPullRequests: [
          {
            number: 10,
            created_at: '2026-10-20T00:00:00.000Z',
            merged_at: '2026-10-21T00:00:00.000Z'
          }
        ],
        recentCommits: [{ sha: 'c1' }]
      });

      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/repos/${repoId}/health`)
        .set('Cookie', [`token=${memberToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.analysis).toBeDefined();
      expect(res.body.data.analysis.metrics.openIssuesCount).toBe(1);
      expect(res.body.data.analysis.findings.length).toBeGreaterThan(0);
    });
  });
});
