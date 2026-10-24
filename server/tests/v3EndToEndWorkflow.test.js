const request = require('supertest');
const app = require('../app');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const WorkspaceInvitation = require('../models/WorkspaceInvitation');
const SavedRepository = require('../models/SavedRepository');
const HealthReport = require('../models/HealthReport');
const { generateToken } = require('../utils/jwt');
const { compareReports } = require('../services/comparisonService');

describe('DevPulse V3 End-to-End Collaborative Intelligence Workflow', () => {
  const user1Id = '507f1f77bcf86cd799439011';
  const user2Id = '507f1f77bcf86cd799439022';
  const user3Id = '507f1f77bcf86cd799439033'; // Outlier
  const workspaceId = '607f1f77bcf86cd799439033';
  const repoId = '707f1f77bcf86cd799439044';
  const report1Id = '807f1f77bcf86cd799439055';
  const report2Id = '807f1f77bcf86cd799439066';

  const user1Token = generateToken({ id: user1Id, email: 'lead@university.edu' });
  const user2Token = generateToken({ id: user2Id, email: 'teammate@university.edu' });
  const user3Token = generateToken({ id: user3Id, email: 'outsider@university.edu' });

  const mockWorkspace = {
    _id: workspaceId,
    name: 'Distributed Systems Capstone',
    description: 'Shared engineering collaboration',
    owner: user1Id
  };

  const mockMembershipOwner = {
    _id: 'mem_1',
    workspace: workspaceId,
    user: { _id: user1Id, name: 'Lead Student' },
    role: 'owner'
  };

  const mockMembershipCollab = {
    _id: 'mem_2',
    workspace: workspaceId,
    user: { _id: user2Id, name: 'Teammate Student' },
    role: 'member'
  };

  const mockSavedRepo = {
    _id: repoId,
    owner: 'facebook',
    repo: 'react',
    fullName: 'facebook/react',
    url: 'https://github.com/facebook/react',
    workspace: workspaceId,
    scope: 'workspace'
  };

  // Earlier snapshot (Report 1)
  const snapshot1 = {
    _id: report1Id,
    repository: {
      owner: 'facebook',
      repo: 'react',
      fullName: 'facebook/react',
      url: 'https://github.com/facebook/react'
    },
    scope: 'workspace',
    workspace: workspaceId,
    createdBy: { _id: user1Id, name: 'Lead Student' },
    generatedAt: new Date('2026-09-01T10:00:00.000Z'),
    metrics: {
      healthScore: 62,
      healthStatus: 'Fair',
      scoringModelVersion: 'v2',
      openIssuesCount: 45,
      openPullRequestsCount: 22,
      mergedPullRequestsCount: 8,
      averagePRMergeTimeHours: 52.0,
      recentCommitsCount: 15,
      criticalFindingsCount: 2,
      totalFindingsCount: 3,
      dimensions: {
        prVelocity: { score: 60, status: 'Fair' },
        issueHygiene: { score: 65, status: 'Fair' },
        commitCadence: { score: 70, status: 'Fair' },
        reviewResponsiveness: { score: 55, status: 'Fair' }
      }
    },
    findings: [
      {
        id: 'stale_issue-10',
        type: 'stale_issue',
        severity: 'critical',
        itemNumber: 10,
        title: 'Memory leak in scheduler',
        daysInactive: 62
      },
      {
        id: 'old_open_pr-20',
        type: 'old_open_pr',
        severity: 'warning',
        itemNumber: 20,
        title: 'Concurrent mode fix',
        daysInactive: 19
      },
      {
        id: 'review_inactivity-30',
        type: 'review_inactivity',
        severity: 'critical',
        itemNumber: 30,
        title: 'Profiler review deadlock',
        daysInactive: 15
      }
    ]
  };

  // Later snapshot (Report 2: improvements in PR velocity, 1 resolved bottleneck, 1 new, 1 persisting)
  const snapshot2 = {
    _id: report2Id,
    repository: {
      owner: 'facebook',
      repo: 'react',
      fullName: 'facebook/react',
      url: 'https://github.com/facebook/react'
    },
    scope: 'workspace',
    workspace: workspaceId,
    createdBy: { _id: user2Id, name: 'Teammate Student' },
    generatedAt: new Date('2026-10-01T10:00:00.000Z'),
    metrics: {
      healthScore: 78,
      healthStatus: 'Healthy',
      scoringModelVersion: 'v2',
      openIssuesCount: 35, // -10 (improvement)
      openPullRequestsCount: 14, // -8 (improvement)
      mergedPullRequestsCount: 20, // +12 (improvement)
      averagePRMergeTimeHours: 22.0, // -30h (improvement)
      recentCommitsCount: 28, // +13 (improvement)
      criticalFindingsCount: 1, // -1 (improvement)
      totalFindingsCount: 3,
      dimensions: {
        prVelocity: { score: 85, status: 'Optimal' },
        issueHygiene: { score: 75, status: 'Optimal' },
        commitCadence: { score: 85, status: 'Optimal' },
        reviewResponsiveness: { score: 70, status: 'Fair' }
      }
    },
    findings: [
      // 10 persisted
      {
        id: 'stale_issue-10',
        type: 'stale_issue',
        severity: 'critical',
        itemNumber: 10,
        title: 'Memory leak in scheduler',
        daysInactive: 92
      },
      // 20 was resolved/closed!
      // 30 persisted and upgraded/remained
      {
        id: 'review_inactivity-30',
        type: 'review_inactivity',
        severity: 'critical',
        itemNumber: 30,
        title: 'Profiler review deadlock',
        daysInactive: 45
      },
      // 40 is newly detected
      {
        id: 'old_open_pr-40',
        type: 'old_open_pr',
        severity: 'warning',
        itemNumber: 40,
        title: 'Docs update',
        daysInactive: 15
      }
    ]
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('Step 1: Outlier user cannot access workspace report or overview', async () => {
    jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
    jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(null); // User 3 is not a member

    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/overview`)
      .set('Cookie', [`token=${user3Token}`]);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('NOT_A_WORKSPACE_MEMBER');
  });

  test('Step 2: Both workspace members can access saved report snapshot', async () => {
    jest.spyOn(HealthReport, 'findById').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(snapshot1)
      })
    });
    jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(mockMembershipCollab);

    // Teammate accessing snapshot 1 generated by Lead
    const res = await request(app)
      .get(`/api/reports/${report1Id}`)
      .set('Cookie', [`token=${user2Token}`]);

    expect(res.status).toBe(200);
    expect(res.body.data.report.repository.fullName).toBe('facebook/react');
    expect(res.body.data.report.metrics.healthScore).toBe(62);
  });

  test('Step 3: Snapshot immutability holds under mutation requests', async () => {
    // Attempting to mutate report 1
    const res = await request(app)
      .put(`/api/reports/${report1Id}`)
      .send({ 'metrics.healthScore': 99 })
      .set('Cookie', [`token=${user1Token}`]);

    expect(res.status).toBe(405);
    expect(res.body.error.code).toBe('REPORT_IMMUTABLE');
  });

  test('Step 4: Snapshot comparison reveals health trajectory, metric transitions, and bottleneck changes', async () => {
    jest.spyOn(HealthReport, 'findById')
      .mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(snapshot1)
        })
      })
      .mockReturnValueOnce({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(snapshot2)
        })
      });

    jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(mockMembershipCollab);

    const res = await request(app)
      .get(`/api/reports/compare?baseReportId=${report1Id}&targetReportId=${report2Id}`)
      .set('Cookie', [`token=${user2Token}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const cmp = res.body.data.comparison;

    // 1. Health score comparison
    expect(cmp.healthScoreComparison.earlierScore).toBe(62);
    expect(cmp.healthScoreComparison.laterScore).toBe(78);
    expect(cmp.healthScoreComparison.scoreDelta).toBe(16); // +16 improvement
    expect(cmp.healthScoreComparison.scoreDirection).toBe('improved');

    // 2. Dimensional improvements
    expect(cmp.dimensionsComparison.prVelocity.delta).toBe(25); // 85 - 60
    expect(cmp.dimensionsComparison.prVelocity.status).toBe('improved');
    expect(cmp.dimensionsComparison.issueHygiene.delta).toBe(10); // 75 - 65

    // 3. Key metric transitions
    expect(cmp.metricsComparison.mergedPullRequestsCount.delta).toBe(12); // 8 -> 20
    expect(cmp.metricsComparison.mergedPullRequestsCount.percentChange).toBe(150.0);
    expect(cmp.metricsComparison.averagePRMergeTimeHours.delta).toBe(-30.0); // 52h -> 22h turnaround
    expect(cmp.metricsComparison.openIssuesCount.delta).toBe(-10); // 45 -> 35

    // 4. Bottlenecks transition
    expect(cmp.findingsComparison.newlyDetectedCount).toBe(1); // PR 40
    expect(cmp.findingsComparison.newlyDetected[0].itemNumber).toBe(40);

    expect(cmp.findingsComparison.noLongerDetectedCount).toBe(1); // PR 20 resolved!
    expect(cmp.findingsComparison.noLongerDetected[0].itemNumber).toBe(20);

    expect(cmp.findingsComparison.persistingCount).toBe(2); // Issues 10 and 30
    expect(cmp.findingsComparison.persistingCriticalCount).toBe(2);

    // 5. Change summary statements
    expect(cmp.summaryStatements.length).toBeGreaterThan(0);
    expect(cmp.summaryStatements[0]).toContain('Repository health score improved by +16 points');
  });

  test('Step 5: Workspace Overview surfaces project pulse, shared repo status, and prioritized bottlenecks', async () => {
    jest.spyOn(Workspace, 'findById').mockResolvedValue(mockWorkspace);
    jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(mockMembershipCollab);

    jest.spyOn(WorkspaceMember, 'find').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockMembershipOwner, mockMembershipCollab])
      })
    });

    jest.spyOn(SavedRepository, 'find').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockSavedRepo])
      })
    });

    jest.spyOn(WorkspaceInvitation, 'countDocuments').mockResolvedValue(1);
    jest.spyOn(HealthReport, 'countDocuments').mockResolvedValue(2); // 2 snapshots saved!

    jest.spyOn(HealthReport, 'findOne').mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(snapshot2)
      })
    });

    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/overview`)
      .set('Cookie', [`token=${user2Token}`]);

    expect(res.status).toBe(200);
    const { stats, repositories, teamPriorities } = res.body.data;

    expect(stats.totalRepositories).toBe(1);
    expect(stats.totalReports).toBe(2);
    expect(stats.memberCount).toBe(2);

    expect(repositories.length).toBe(1);
    expect(repositories[0].canCompare).toBe(true);
    expect(repositories[0].reportCount).toBe(2);
    expect(repositories[0].latestReport.healthScore).toBe(78);

    // Team Priorities prioritized by critical severity and days inactive
    expect(teamPriorities.length).toBe(3);
    // Issue 10 is critical with 92 days inactive
    expect(teamPriorities[0].id).toBe('stale_issue-10');
    expect(teamPriorities[0].severity).toBe('critical');
    expect(teamPriorities[0].daysInactive).toBe(92);
  });
});
