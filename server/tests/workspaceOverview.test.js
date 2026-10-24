const request = require('supertest');
const app = require('../app');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const WorkspaceInvitation = require('../models/WorkspaceInvitation');
const SavedRepository = require('../models/SavedRepository');
const HealthReport = require('../models/HealthReport');
const { generateToken } = require('../utils/jwt');

describe('Workspace Project Overview & Team Priorities Tests', () => {
  const user1Id = '507f1f77bcf86cd799439011';
  const user2Id = '507f1f77bcf86cd799439022';
  const workspaceId = '607f1f77bcf86cd799439033';
  const repo1Id = '707f1f77bcf86cd799439044';
  const repo2Id = '707f1f77bcf86cd799439045';

  const user1Token = generateToken({ id: user1Id, email: 'user1@university.edu' });
  const user2Token = generateToken({ id: user2Id, email: 'user2@university.edu' });

  const mockWorkspace = {
    _id: workspaceId,
    name: 'Capstone Core Team',
    description: 'Shared engineering collaboration',
    owner: user1Id,
    createdAt: new Date('2026-09-01T00:00:00.000Z')
  };

  const mockMembership = {
    _id: 'mem_1',
    workspace: workspaceId,
    user: { _id: user1Id, name: 'User One', email: 'user1@university.edu' },
    role: 'owner',
    joinedAt: new Date('2026-09-01T00:00:00.000Z')
  };

  const mockSavedRepos = [
    {
      _id: repo1Id,
      owner: 'facebook',
      repo: 'react',
      fullName: 'facebook/react',
      stars: 220000,
      forks: 45000,
      defaultBranch: 'main',
      url: 'https://github.com/facebook/react',
      description: 'UI library',
      addedBy: { _id: user1Id, name: 'User One' },
      createdAt: new Date('2026-09-02T00:00:00.000Z')
    },
    {
      _id: repo2Id,
      owner: 'expressjs',
      repo: 'express',
      fullName: 'expressjs/express',
      stars: 65000,
      forks: 14000,
      defaultBranch: 'master',
      url: 'https://github.com/expressjs/express',
      description: 'Node framework',
      addedBy: { _id: user1Id, name: 'User One' },
      createdAt: new Date('2026-09-03T00:00:00.000Z')
    }
  ];

  const mockLatestReport1 = {
    _id: 'report_react_1',
    repository: { fullName: 'facebook/react' },
    scope: 'workspace',
    workspace: workspaceId,
    createdBy: { _id: user1Id, name: 'User One' },
    generatedAt: new Date('2026-10-10T12:00:00.000Z'),
    metrics: {
      healthScore: 82,
      healthStatus: 'Healthy',
      scoringModelVersion: 'v2',
      openIssuesCount: 30,
      openPullRequestsCount: 12,
      mergedPullRequestsCount: 20,
      averagePRMergeTimeHours: 20,
      recentCommitsCount: 35,
      criticalFindingsCount: 1,
      warningFindingsCount: 1,
      dimensions: {
        prVelocity: { score: 90 },
        issueHygiene: { score: 80 },
        commitCadence: { score: 85 },
        reviewResponsiveness: { score: 75 }
      }
    },
    findings: [
      {
        id: 'stale_issue-10',
        type: 'stale_issue',
        severity: 'critical',
        itemNumber: 10,
        title: 'Renderer deadlock',
        url: 'https://github.com/facebook/react/issues/10',
        daysInactive: 65,
        explanation: 'Issue #10 inactive for 65 days',
        ruleBasedAction: 'Triage backlog'
      },
      {
        id: 'old_open_pr-20',
        type: 'old_open_pr',
        severity: 'warning',
        itemNumber: 20,
        title: 'Add docs update',
        url: 'https://github.com/facebook/react/pull/20',
        daysInactive: 15,
        explanation: 'PR #20 open for 15 days',
        ruleBasedAction: 'Accelerate turnaround'
      }
    ]
  };

  const mockLatestReport2 = {
    _id: 'report_express_1',
    repository: { fullName: 'expressjs/express' },
    scope: 'workspace',
    workspace: workspaceId,
    createdBy: { _id: user1Id, name: 'User One' },
    generatedAt: new Date('2026-10-12T12:00:00.000Z'),
    metrics: {
      healthScore: 68,
      healthStatus: 'Fair',
      scoringModelVersion: 'v2',
      openIssuesCount: 45,
      openPullRequestsCount: 10,
      mergedPullRequestsCount: 8,
      averagePRMergeTimeHours: 50,
      recentCommitsCount: 12,
      criticalFindingsCount: 1,
      warningFindingsCount: 0,
      dimensions: {
        prVelocity: { score: 60 },
        issueHygiene: { score: 70 },
        commitCadence: { score: 70 },
        reviewResponsiveness: { score: 70 }
      }
    },
    findings: [
      {
        id: 'review_inactivity-30',
        type: 'review_inactivity',
        severity: 'critical',
        itemNumber: 30,
        title: 'Router refactor deadlock',
        url: 'https://github.com/expressjs/express/pull/30',
        daysInactive: 80,
        explanation: 'No reviews in 80 days',
        ruleBasedAction: 'Resolve deadlock'
      }
    ]
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication and RBAC', () => {
    test('requires authentication to access workspace overview', async () => {
      const res = await request(app).get(`/api/workspaces/${workspaceId}/overview`);
      expect(res.status).toBe(401);
    });

    test('denies non-member access to workspace overview with 403', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(null); // Not a member

      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/overview`)
        .set('Cookie', [`token=${user2Token}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NOT_A_WORKSPACE_MEMBER');
    });
  });

  describe('Successful Overview Aggregation', () => {
    test('aggregates workspace pulse, repositories, reports, and team priorities correctly', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(mockMembership);

      // WorkspaceMember.find query chain
      jest.spyOn(WorkspaceMember, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockMembership])
        })
      });

      // SavedRepository.find query chain
      jest.spyOn(SavedRepository, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSavedRepos)
        })
      });

      jest.spyOn(WorkspaceInvitation, 'countDocuments').mockResolvedValue(2);
      jest.spyOn(HealthReport, 'countDocuments').mockImplementation(async (query) => {
        if (query && query['repository.fullName']) {
          return 3; // repoReportsCount
        }
        return 5; // totalReportsCount
      });

      // HealthReport.findOne mock per repo
      jest.spyOn(HealthReport, 'findOne').mockImplementation((query) => {
        const repoName = query['repository.fullName'];
        const report = repoName.test('facebook/react') ? mockLatestReport1 : mockLatestReport2;
        return {
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(report)
          })
        };
      });

      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/overview`)
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { workspace, stats, repositories, teamPriorities } = res.body.data;

      // Workspace info
      expect(workspace.name).toBe('Capstone Core Team');
      expect(workspace.role).toBe('owner');

      // Stats
      expect(stats.totalRepositories).toBe(2);
      expect(stats.totalReports).toBe(5);
      expect(stats.memberCount).toBe(1);
      expect(stats.pendingInviteCount).toBe(2);
      expect(stats.healthyReposCount).toBe(1); // React 82
      expect(stats.fairReposCount).toBe(1); // Express 68

      // Repositories
      expect(repositories.length).toBe(2);
      expect(repositories[0].canCompare).toBe(true);
      expect(repositories[0].latestReport.healthScore).toBe(82);

      // Team Priorities (critical bottlenecks sorted first, highest days inactive)
      expect(teamPriorities.length).toBe(3);
      // Express review_inactivity-30 has 80 days critical
      expect(teamPriorities[0].id).toBe('review_inactivity-30');
      expect(teamPriorities[0].severity).toBe('critical');
      // React stale_issue-10 has 65 days critical
      expect(teamPriorities[1].id).toBe('stale_issue-10');
      expect(teamPriorities[1].severity).toBe('critical');
      // React old_open_pr-20 has 15 days warning
      expect(teamPriorities[2].id).toBe('old_open_pr-20');
      expect(teamPriorities[2].severity).toBe('warning');
    });

    test('handles empty workspace with zero repositories and zero reports gracefully', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(mockMembership);

      jest.spyOn(WorkspaceMember, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([mockMembership])
        })
      });

      jest.spyOn(SavedRepository, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([])
        })
      });

      jest.spyOn(WorkspaceInvitation, 'countDocuments').mockResolvedValue(0);
      jest.spyOn(HealthReport, 'countDocuments').mockResolvedValue(0);

      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/overview`)
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(200);
      expect(res.body.data.stats.totalRepositories).toBe(0);
      expect(res.body.data.stats.totalReports).toBe(0);
      expect(res.body.data.repositories).toEqual([]);
      expect(res.body.data.teamPriorities).toEqual([]);
    });
  });

  describe('Workspace Report Immutability', () => {
    test('rejects PUT request on workspace report with 405', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(mockMembership);

      const res = await request(app)
        .put(`/api/workspaces/${workspaceId}/reports/report_123`)
        .send({ 'metrics.healthScore': 100 })
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(405);
      expect(res.body.error.code).toBe('REPORT_IMMUTABLE');
    });

    test('rejects PATCH request on workspace report with 405', async () => {
      jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(mockMembership);

      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}/reports/report_123`)
        .send({ findings: [] })
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(405);
      expect(res.body.error.code).toBe('REPORT_IMMUTABLE');
    });
  });
});
