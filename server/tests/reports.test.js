const request = require('supertest');
const app = require('../app');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const SavedRepository = require('../models/SavedRepository');
const HealthReport = require('../models/HealthReport');
const githubService = require('../services/githubService');
const { generateToken } = require('../utils/jwt');

describe('Persistent Health Reports Integration Tests', () => {
  const user1Id = '507f1f77bcf86cd799439011';
  const user2Id = '507f1f77bcf86cd799439022';
  const workspaceId = '607f1f77bcf86cd799439033';
  const repoId = '707f1f77bcf86cd799439044';
  const reportId = '807f1f77bcf86cd799439055';

  const user1Token = generateToken({ id: user1Id, email: 'user1@university.edu' });
  const user2Token = generateToken({ id: user2Id, email: 'user2@university.edu' });

  const mockSavedPersonalRepo = {
    _id: repoId,
    user: user1Id,
    scope: 'personal',
    owner: 'facebook',
    repo: 'react',
    fullName: 'facebook/react',
    url: 'https://github.com/facebook/react',
    description: 'React library',
    defaultBranch: 'main'
  };

  const mockSavedWorkspaceRepo = {
    _id: repoId,
    workspace: workspaceId,
    scope: 'workspace',
    owner: 'expressjs',
    repo: 'express',
    fullName: 'expressjs/express',
    url: 'https://github.com/expressjs/express',
    description: 'Express web framework',
    defaultBranch: 'master'
  };

  const mockWorkspace = {
    _id: workspaceId,
    name: 'Capstone Project Alpha',
    owner: user1Id
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('Personal Reports Workflows', () => {
    test('generates an immutable persistent personal report snapshot', async () => {
      jest.spyOn(SavedRepository, 'findOne').mockResolvedValue(mockSavedPersonalRepo);

      jest.spyOn(githubService, 'getRawRepoData').mockResolvedValue({
        metadata: {
          owner: 'facebook',
          repo: 'react',
          fullName: 'facebook/react',
          stars: 220000,
          forks: 45000,
          openIssuesCount: 1200,
          defaultBranch: 'main',
          url: 'https://github.com/facebook/react'
        },
        issues: [
          {
            number: 1,
            title: 'Stale bug',
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

      let capturedReport = null;
      jest.spyOn(HealthReport, 'create').mockImplementation(async (payload) => {
        capturedReport = payload;
        return {
          _id: reportId,
          ...payload
        };
      });

      const res = await request(app)
        .post('/api/reports/personal')
        .set('Cookie', [`token=${user1Token}`])
        .send({ repoId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(capturedReport).not.toBeNull();
      expect(capturedReport.scope).toBe('personal');
      expect(capturedReport.user).toBe(user1Id);
      expect(capturedReport.metrics.openIssuesCount).toBe(1);
      expect(capturedReport.findings.length).toBeGreaterThan(0);
      expect(capturedReport.status).toBe('complete');
    });

    test('PERSONAL PRIVACY: User 2 is forbidden from viewing User 1 personal report', async () => {
      const mockReport = {
        _id: reportId,
        scope: 'personal',
        user: user1Id,
        createdBy: user1Id,
        repository: { fullName: 'facebook/react' }
      };

      const populate1 = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReport)
      });
      jest.spyOn(HealthReport, 'findById').mockReturnValue({ populate: populate1 });

      const res = await request(app)
        .get(`/api/reports/${reportId}`)
        .set('Cookie', [`token=${user2Token}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Workspace Reports Workflows', () => {
    test('workspace member generates a persistent workspace report snapshot', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: user1Id,
        role: 'owner'
      });

      jest.spyOn(SavedRepository, 'findOne').mockResolvedValue(mockSavedWorkspaceRepo);

      jest.spyOn(githubService, 'getRawRepoData').mockResolvedValue({
        metadata: {
          owner: 'expressjs',
          repo: 'express',
          fullName: 'expressjs/express',
          stars: 65000,
          forks: 14000,
          openIssuesCount: 150,
          defaultBranch: 'master',
          url: 'https://github.com/expressjs/express'
        },
        issues: [],
        openPullRequests: [],
        closedPullRequests: [],
        recentCommits: [{ sha: 'c1' }]
      });

      let capturedWorkspaceReport = null;
      jest.spyOn(HealthReport, 'create').mockImplementation(async (payload) => {
        capturedWorkspaceReport = payload;
        return {
          _id: reportId,
          ...payload
        };
      });

      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/reports`)
        .set('Cookie', [`token=${user1Token}`])
        .send({ repoId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(capturedWorkspaceReport).not.toBeNull();
      expect(capturedWorkspaceReport.scope).toBe('workspace');
      expect(capturedWorkspaceReport.workspace).toBe(workspaceId);
    });

    test('WORKSPACE RBAC: non-member is blocked from viewing workspace reports', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(null); // Not a member

      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/reports`)
        .set('Cookie', [`token=${user2Token}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NOT_A_WORKSPACE_MEMBER');
    });

    test('WORKSPACE REPORTS: filters out orphaned reports for deleted repositories', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: user1Id,
        role: 'owner'
      });

      // Active repos in workspace only includes 'facebook/react' (expressjs/express was deleted)
      jest.spyOn(SavedRepository, 'find').mockReturnValue({
        select: jest.fn().mockResolvedValue([{ fullName: 'facebook/react' }])
      });

      const mockReports = [
        {
          _id: 'report_react_1',
          repository: { fullName: 'facebook/react' },
          metrics: { healthScore: 85 }
        },
        {
          _id: 'report_orphaned_express',
          repository: { fullName: 'expressjs/express' },
          metrics: { healthScore: 47 }
        }
      ];

      jest.spyOn(HealthReport, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockReports)
        })
      });

      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/reports`)
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Orphaned express report should NOT be returned
      expect(res.body.data.reports.length).toBe(1);
      expect(res.body.data.reports[0].repository.fullName).toBe('facebook/react');
    });

    test('WORKSPACE REPORT DELETION: owner can delete an individual workspace report', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue({
        workspace: workspaceId,
        user: user1Id,
        role: 'owner'
      });

      jest.spyOn(HealthReport, 'findOneAndDelete').mockResolvedValue({
        _id: reportId,
        workspace: workspaceId,
        scope: 'workspace'
      });

      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/reports/${reportId}`)
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('deleted successfully');
    });

    test('SNAPSHOT IMMUTABILITY: report retains original snapshot metrics even when live analysis changes', async () => {
      // Stored report has 2 open issues and score 75
      const storedReport = {
        _id: reportId,
        scope: 'personal',
        user: user1Id,
        metrics: {
          healthScore: 75,
          openIssuesCount: 2
        },
        findings: [{ type: 'stale_issue', title: 'Old issue' }],
        generatedAt: new Date('2026-10-01T00:00:00.000Z')
      };

      jest.spyOn(HealthReport, 'findOne').mockResolvedValue(storedReport);

      const res = await request(app)
        .get(`/api/reports/personal/${reportId}`)
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.report.metrics.healthScore).toBe(75);
      expect(res.body.data.report.metrics.openIssuesCount).toBe(2);
      expect(res.body.data.report.generatedAt).toBe('2026-10-01T00:00:00.000Z');
    });
  });
});
