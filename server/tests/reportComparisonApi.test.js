const request = require('supertest');
const app = require('../app');
const HealthReport = require('../models/HealthReport');
const WorkspaceMember = require('../models/WorkspaceMember');
const { generateToken } = require('../utils/jwt');

describe('Snapshot Comparison API & Immutability Integration Tests', () => {
  const user1Id = '507f1f77bcf86cd799439011';
  const user2Id = '507f1f77bcf86cd799439022';
  const workspaceId = '607f1f77bcf86cd799439033';
  const report1Id = '807f1f77bcf86cd799439055';
  const report2Id = '807f1f77bcf86cd799439066';
  const reportDiffRepoId = '807f1f77bcf86cd799439077';

  const user1Token = generateToken({ id: user1Id, email: 'user1@university.edu' });
  const user2Token = generateToken({ id: user2Id, email: 'user2@university.edu' });

  const mockReport1 = {
    _id: report1Id,
    repository: {
      owner: 'facebook',
      repo: 'react',
      fullName: 'facebook/react',
      url: 'https://github.com/facebook/react'
    },
    scope: 'personal',
    user: user1Id,
    createdBy: { _id: user1Id, name: 'User One', email: 'user1@university.edu' },
    generatedAt: new Date('2026-09-01T12:00:00.000Z'),
    metrics: {
      healthScore: 65,
      healthStatus: 'Fair',
      scoringModelVersion: 'v2',
      openIssuesCount: 40,
      openPullRequestsCount: 20,
      mergedPullRequestsCount: 10,
      averagePRMergeTimeHours: 48,
      recentCommitsCount: 15,
      totalFindingsCount: 3,
      criticalFindingsCount: 1,
      warningFindingsCount: 2,
      dimensions: {
        prVelocity: { score: 65, status: 'Fair' },
        issueHygiene: { score: 70, status: 'Fair' },
        commitCadence: { score: 80, status: 'Optimal' },
        reviewResponsiveness: { score: 60, status: 'Fair' }
      }
    },
    findings: [
      {
        id: 'stale_issue-1',
        type: 'stale_issue',
        severity: 'critical',
        itemNumber: 1,
        title: 'Memory leak in render',
        daysInactive: 45
      }
    ]
  };

  const mockReport2 = {
    _id: report2Id,
    repository: {
      owner: 'facebook',
      repo: 'react',
      fullName: 'facebook/react',
      url: 'https://github.com/facebook/react'
    },
    scope: 'personal',
    user: user1Id,
    createdBy: { _id: user1Id, name: 'User One', email: 'user1@university.edu' },
    generatedAt: new Date('2026-10-01T12:00:00.000Z'),
    metrics: {
      healthScore: 78,
      healthStatus: 'Healthy',
      scoringModelVersion: 'v2',
      openIssuesCount: 32,
      openPullRequestsCount: 15,
      mergedPullRequestsCount: 18,
      averagePRMergeTimeHours: 24,
      recentCommitsCount: 25,
      totalFindingsCount: 2,
      criticalFindingsCount: 0,
      warningFindingsCount: 2,
      dimensions: {
        prVelocity: { score: 85, status: 'Optimal' },
        issueHygiene: { score: 80, status: 'Optimal' },
        commitCadence: { score: 90, status: 'Optimal' },
        reviewResponsiveness: { score: 75, status: 'Optimal' }
      }
    },
    findings: [
      {
        id: 'stale_issue-2',
        type: 'stale_issue',
        severity: 'warning',
        itemNumber: 2,
        title: 'Docs typo',
        daysInactive: 31
      }
    ]
  };

  const mockReportDiffRepo = {
    _id: reportDiffRepoId,
    repository: {
      owner: 'expressjs',
      repo: 'express',
      fullName: 'expressjs/express',
      url: 'https://github.com/expressjs/express'
    },
    scope: 'personal',
    user: user1Id,
    createdBy: { _id: user1Id, name: 'User One' },
    generatedAt: new Date('2026-10-02T12:00:00.000Z'),
    metrics: {
      healthScore: 72,
      healthStatus: 'Fair'
    },
    findings: []
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('Authentication & Input Validation', () => {
    test('requires authentication for snapshot comparison', async () => {
      const res = await request(app)
        .get(`/api/reports/compare?baseReportId=${report1Id}&targetReportId=${report2Id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('rejects request with missing report IDs', async () => {
      const res = await request(app)
        .get('/api/reports/compare')
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_REPORT_IDS');
    });

    test('rejects invalid MongoDB ObjectId format', async () => {
      const res = await request(app)
        .get('/api/reports/compare?baseReportId=invalid-id&targetReportId=invalid-2')
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_REPORT_ID');
    });

    test('rejects comparing identical reports', async () => {
      const res = await request(app)
        .get(`/api/reports/compare?baseReportId=${report1Id}&targetReportId=${report1Id}`)
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('IDENTICAL_REPORTS');
    });

    test('returns 404 when base report does not exist', async () => {
      jest.spyOn(HealthReport, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      const res = await request(app)
        .get(`/api/reports/compare?baseReportId=${report1Id}&targetReportId=${report2Id}`)
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('BASE_REPORT_NOT_FOUND');
    });
  });

  describe('Authorization & Isolation Rules', () => {
    test('denies access if user is not authorized to view base report (personal isolation)', async () => {
      // User 2 trying to compare User 1's personal report
      jest.spyOn(HealthReport, 'findById')
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockReport1)
          })
        })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockReport2)
          })
        });

      const res = await request(app)
        .get(`/api/reports/compare?baseReportId=${report1Id}&targetReportId=${report2Id}`)
        .set('Cookie', [`token=${user2Token}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('denies access if user is not a member of the workspace for workspace reports', async () => {
      const mockWorkspaceReport = {
        ...mockReport1,
        scope: 'workspace',
        workspace: workspaceId
      };

      jest.spyOn(HealthReport, 'findById')
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockWorkspaceReport)
          })
        })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue({ ...mockReport2, scope: 'workspace', workspace: workspaceId })
          })
        });

      // User 2 is NOT a member of workspaceId
      jest.spyOn(WorkspaceMember, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/reports/compare?baseReportId=${report1Id}&targetReportId=${report2Id}`)
        .set('Cookie', [`token=${user2Token}`]);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Successful Comparison Execution', () => {
    test('returns 200 with full comparative data when authorized', async () => {
      jest.spyOn(HealthReport, 'findById')
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockReport1)
          })
        })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockReport2)
          })
        });

      const res = await request(app)
        .get(`/api/reports/compare?baseReportId=${report1Id}&targetReportId=${report2Id}`)
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cmp = res.body.data.comparison;
      expect(cmp.repository.fullName).toBe('facebook/react');
      expect(cmp.healthScoreComparison.scoreDelta).toBe(13); // 78 - 65
      expect(cmp.healthScoreComparison.scoreDirection).toBe('improved');
      expect(cmp.dimensionsComparison.prVelocity.delta).toBe(20);
      expect(cmp.metricsComparison.openIssuesCount.delta).toBe(-8);
      expect(cmp.findingsComparison.newlyDetectedCount).toBe(1);
      expect(cmp.findingsComparison.newlyDetected[0].itemNumber).toBe(2);
      expect(cmp.findingsComparison.newlyDetected[0].title).toBe('Docs typo');
      expect(cmp.findingsComparison.noLongerDetectedCount).toBe(1);
      expect(cmp.findingsComparison.noLongerDetected[0].itemNumber).toBe(1);
      expect(cmp.findingsComparison.noLongerDetected[0].title).toBe('Memory leak in render');
      expect(cmp.findingsComparison.laterTotalCount).toBe(1);
      expect(cmp.snapshots.elapsedTimeFormatted).toBeDefined();
      expect(cmp.summaryStatements.length).toBeGreaterThan(0);
    });

    test('rejects comparison when reports belong to different repositories', async () => {
      jest.spyOn(HealthReport, 'findById')
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockReport1)
          })
        })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockReportDiffRepo)
          })
        });

      const res = await request(app)
        .get(`/api/reports/compare?baseReportId=${report1Id}&targetReportId=${reportDiffRepoId}`)
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('DIFFERENT_REPOSITORIES');
    });
  });

  describe('Repository Snapshots List API', () => {
    test('lists available snapshots for a repository', async () => {
      const mockQueryChain = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockReport2, mockReport1])
      };
      jest.spyOn(HealthReport, 'find').mockReturnValue(mockQueryChain);

      const res = await request(app)
        .get('/api/reports/repository-snapshots?fullName=facebook/react')
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.snapshots.length).toBe(2);
    });

    test('validates required repository fullName', async () => {
      const res = await request(app)
        .get('/api/reports/repository-snapshots')
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_REPOSITORY');
    });
  });

  describe('Snapshot Immutability Enforcement', () => {
    test('strictly rejects PUT requests on reports with 405 Method Not Allowed', async () => {
      const res = await request(app)
        .put(`/api/reports/${report1Id}`)
        .send({ 'metrics.healthScore': 99 })
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(405);
      expect(res.body.error.code).toBe('REPORT_IMMUTABLE');
    });

    test('strictly rejects PATCH requests on reports with 405 Method Not Allowed', async () => {
      const res = await request(app)
        .patch(`/api/reports/${report1Id}`)
        .send({ findings: [] })
        .set('Cookie', [`token=${user1Token}`]);

      expect(res.status).toBe(405);
      expect(res.body.error.code).toBe('REPORT_IMMUTABLE');
    });
  });
});
