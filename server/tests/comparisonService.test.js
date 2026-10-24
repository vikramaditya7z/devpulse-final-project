const {
  compareReports,
  calculatePercentChange,
  getFindingKey
} = require('../services/comparisonService');

describe('Deterministic Snapshot Comparison Service', () => {
  const baseRepo = {
    fullName: 'facebook/react',
    owner: 'facebook',
    repo: 'react',
    url: 'https://github.com/facebook/react'
  };

  const createReport = (overrides = {}) => ({
    _id: 'report_1',
    repository: baseRepo,
    scope: 'personal',
    generatedAt: new Date('2026-10-01T12:00:00Z'),
    metrics: {
      healthScore: 70,
      healthStatus: 'Fair',
      scoringModelVersion: 'v2',
      openIssuesCount: 40,
      openPullRequestsCount: 20,
      mergedPullRequestsCount: 10,
      averagePRMergeTimeHours: 48.0,
      recentCommitsCount: 15,
      totalFindingsCount: 5,
      criticalFindingsCount: 2,
      warningFindingsCount: 3,
      dimensions: {
        prVelocity: { score: 65, status: 'Fair' },
        issueHygiene: { score: 70, status: 'Fair' },
        commitCadence: { score: 80, status: 'Optimal' },
        reviewResponsiveness: { score: 60, status: 'Fair' }
      }
    },
    findings: [
      {
        id: 'stale_issue-101',
        type: 'stale_issue',
        severity: 'critical',
        itemNumber: 101,
        title: 'Memory leak in hydration',
        daysInactive: 45
      },
      {
        id: 'old_open_pr-202',
        type: 'old_open_pr',
        severity: 'warning',
        itemNumber: 202,
        title: 'Add new hook useTransitionState',
        daysInactive: 18
      },
      {
        id: 'review_inactivity-303',
        type: 'review_inactivity',
        severity: 'warning',
        itemNumber: 303,
        title: 'Refactor reconcileChildren',
        daysInactive: 9
      }
    ],
    ...overrides
  });

  describe('Validation & Invariants', () => {
    it('throws when either report is missing', () => {
      expect(() => compareReports(null, createReport())).toThrow('Two report snapshots are required');
      expect(() => compareReports(createReport(), undefined)).toThrow('Two report snapshots are required');
    });

    it('throws when comparing identical report snapshots', () => {
      const rep = createReport({ _id: 'same_id_123' });
      expect(() => compareReports(rep, rep)).toThrow('Cannot compare a report snapshot with itself');
    });

    it('throws when comparing reports for different repositories', () => {
      const rep1 = createReport({
        _id: 'rep_1',
        repository: { fullName: 'facebook/react', owner: 'facebook', repo: 'react' }
      });
      const rep2 = createReport({
        _id: 'rep_2',
        repository: { fullName: 'expressjs/express', owner: 'expressjs', repo: 'express' }
      });

      expect(() => compareReports(rep1, rep2)).toThrow('Cannot compare reports from different repositories');
    });
  });

  describe('Chronological Ordering & Health Score Comparison', () => {
    it('automatically sorts snapshots chronologically regardless of argument order', () => {
      const older = createReport({
        _id: 'rep_older',
        generatedAt: new Date('2026-09-01T10:00:00Z'),
        metrics: { healthScore: 55, healthStatus: 'Fair' }
      });
      const newer = createReport({
        _id: 'rep_newer',
        generatedAt: new Date('2026-10-01T10:00:00Z'),
        metrics: { healthScore: 78, healthStatus: 'Healthy' }
      });

      // Pass newer first
      const result = compareReports(newer, older);
      expect(result.snapshots.earlier._id).toBe('rep_older');
      expect(result.snapshots.later._id).toBe('rep_newer');
      expect(result.snapshots.elapsedDays).toBe(30);

      expect(result.healthScoreComparison.earlierScore).toBe(55);
      expect(result.healthScoreComparison.laterScore).toBe(78);
      expect(result.healthScoreComparison.scoreDelta).toBe(23);
      expect(result.healthScoreComparison.scoreDirection).toBe('improved');
    });

    it('identifies score regression correctly', () => {
      const older = createReport({
        _id: 'rep_older',
        generatedAt: new Date('2026-09-01T10:00:00Z'),
        metrics: { healthScore: 82, healthStatus: 'Healthy' }
      });
      const newer = createReport({
        _id: 'rep_newer',
        generatedAt: new Date('2026-09-15T10:00:00Z'),
        metrics: { healthScore: 68, healthStatus: 'Fair' }
      });

      const result = compareReports(older, newer);
      expect(result.healthScoreComparison.scoreDelta).toBe(-14);
      expect(result.healthScoreComparison.scoreDirection).toBe('regressed');
    });
  });

  describe('Dimensional Comparisons', () => {
    it('compares all 4 dimensions when available', () => {
      const older = createReport({
        _id: 'rep_older',
        generatedAt: new Date('2026-09-01T10:00:00Z')
      });
      const newer = createReport({
        _id: 'rep_newer',
        generatedAt: new Date('2026-09-20T10:00:00Z'),
        metrics: {
          ...createReport().metrics,
          dimensions: {
            prVelocity: { score: 85, status: 'Optimal' }, // +20
            issueHygiene: { score: 60, status: 'Fair' }, // -10
            commitCadence: { score: 80, status: 'Optimal' }, // 0
            reviewResponsiveness: { score: 75, status: 'Optimal' } // +15
          }
        }
      });

      const result = compareReports(older, newer);
      expect(result.comparableDimensionsCount).toBe(4);

      expect(result.dimensionsComparison.prVelocity.delta).toBe(20);
      expect(result.dimensionsComparison.prVelocity.status).toBe('improved');

      expect(result.dimensionsComparison.issueHygiene.delta).toBe(-10);
      expect(result.dimensionsComparison.issueHygiene.status).toBe('regressed');

      expect(result.dimensionsComparison.commitCadence.delta).toBe(0);
      expect(result.dimensionsComparison.commitCadence.status).toBe('unchanged');
    });

    it('gracefully handles missing dimensions from legacy snapshot without substituting 0', () => {
      const olderWithoutDims = createReport({
        _id: 'rep_older',
        generatedAt: new Date('2026-09-01T10:00:00Z'),
        metrics: {
          healthScore: 60,
          healthStatus: 'Fair',
          scoringModelVersion: 'v1',
          dimensions: null
        }
      });
      const newer = createReport({
        _id: 'rep_newer',
        generatedAt: new Date('2026-09-20T10:00:00Z')
      });

      const result = compareReports(olderWithoutDims, newer);
      expect(result.comparableDimensionsCount).toBe(0);
      expect(result.dimensionsComparison.prVelocity.comparable).toBe(false);
      expect(result.dimensionsComparison.prVelocity.explanation).toContain('does not contain this dimensional breakdown');
      expect(result.healthScoreComparison.scoringModelsCompatible).toBe(false);
      expect(result.healthScoreComparison.compatibilityNote).toBeTruthy();
    });
  });

  describe('Key Repository Metrics Calculation', () => {
    it('calculates absolute deltas and handles non-zero and zero percentages', () => {
      const older = createReport({
        _id: 'rep_older',
        generatedAt: new Date('2026-09-01T10:00:00Z'),
        metrics: {
          ...createReport().metrics,
          openIssuesCount: 40,
          mergedPullRequestsCount: 10,
          averagePRMergeTimeHours: 48.0,
          criticalFindingsCount: 2
        }
      });
      const newer = createReport({
        _id: 'rep_newer',
        generatedAt: new Date('2026-09-20T10:00:00Z'),
        metrics: {
          ...createReport().metrics,
          openIssuesCount: 30, // -10 (improvement)
          mergedPullRequestsCount: 15, // +5 (improvement)
          averagePRMergeTimeHours: 24.0, // -24h (improvement)
          criticalFindingsCount: 4 // +2 (regression)
        }
      });

      const result = compareReports(older, newer);
      const m = result.metricsComparison;

      expect(m.openIssuesCount.delta).toBe(-10);
      expect(m.openIssuesCount.percentChange).toBe(-25.0);
      expect(m.openIssuesCount.isImprovement).toBe(true);

      expect(m.mergedPullRequestsCount.delta).toBe(5);
      expect(m.mergedPullRequestsCount.percentChange).toBe(50.0);
      expect(m.mergedPullRequestsCount.isImprovement).toBe(true);

      expect(m.averagePRMergeTimeHours.delta).toBe(-24.0);
      expect(m.averagePRMergeTimeHours.percentChange).toBe(-50.0);
      expect(m.averagePRMergeTimeHours.isImprovement).toBe(true);

      expect(m.criticalFindingsCount.delta).toBe(2);
      expect(m.criticalFindingsCount.percentChange).toBe(100.0);
      expect(m.criticalFindingsCount.isRegression).toBe(true);
    });

    it('safely handles zero denominator in calculatePercentChange', () => {
      expect(calculatePercentChange(0, 0)).toEqual({ percent: 0, note: '0.0%' });
      expect(calculatePercentChange(0, 5)).toEqual({
        percent: null,
        note: 'New occurrence from zero baseline'
      });
      expect(calculatePercentChange(10, 5)).toEqual({ percent: -50.0, note: '-50%' });
    });
  });

  describe('Bottlenecks Findings Classification', () => {
    it('classifies findings into newly detected, no longer detected, and persisting with severity changes', () => {
      const older = createReport({
        _id: 'rep_older',
        generatedAt: new Date('2026-09-01T10:00:00Z'),
        findings: [
          {
            id: 'stale_issue-101',
            type: 'stale_issue',
            severity: 'warning',
            itemNumber: 101,
            title: 'Issue 101',
            daysInactive: 32
          },
          {
            id: 'old_open_pr-202',
            type: 'old_open_pr',
            severity: 'warning',
            itemNumber: 202,
            title: 'PR 202',
            daysInactive: 15
          }
        ]
      });

      const newer = createReport({
        _id: 'rep_newer',
        generatedAt: new Date('2026-09-20T10:00:00Z'),
        findings: [
          // 101 persisted and was upgraded to critical!
          {
            id: 'stale_issue-101',
            type: 'stale_issue',
            severity: 'critical',
            itemNumber: 101,
            title: 'Issue 101',
            daysInactive: 51
          },
          // 404 is brand new!
          {
            id: 'review_inactivity-404',
            type: 'review_inactivity',
            severity: 'warning',
            itemNumber: 404,
            title: 'PR 404',
            daysInactive: 8
          }
          // 202 is absent (resolved/merged/closed)!
        ]
      });

      const result = compareReports(older, newer);
      const f = result.findingsComparison;

      // 1 newly detected (404)
      expect(f.newlyDetectedCount).toBe(1);
      expect(f.newlyDetected[0].itemNumber).toBe(404);

      // 1 no longer detected (202)
      expect(f.noLongerDetectedCount).toBe(1);
      expect(f.noLongerDetected[0].itemNumber).toBe(202);

      // 1 persisting (101) with severity upgrade
      expect(f.persistingCount).toBe(1);
      expect(f.persisting[0].itemNumber).toBe(101);
      expect(f.persisting[0].severityChanged).toBe(true);
      expect(f.persisting[0].severityUpgraded).toBe(true);
      expect(f.persisting[0].earlierSeverity).toBe('warning');
      expect(f.persisting[0].currentSeverity).toBe('critical');
      expect(f.persisting[0].daysInactiveDelta).toBe(19);
    });

    it('derives stable finding key fallback when id is omitted', () => {
      expect(getFindingKey({ type: 'stale_issue', itemNumber: 45 })).toBe('stale_issue-45');
      expect(getFindingKey({ type: 'review_inactivity', title: 'Review PR 99' })).toBe('review_inactivity-review pr 99');
    });
  });

  describe('Deterministic Change Summary Statements', () => {
    it('generates clear, balanced, evidence-based sentences', () => {
      const older = createReport({
        _id: 'rep_older',
        generatedAt: new Date('2026-09-01T10:00:00Z'),
        metrics: {
          ...createReport().metrics,
          healthScore: 60,
          healthStatus: 'Fair',
          openIssuesCount: 50,
          openPullRequestsCount: 20,
          mergedPullRequestsCount: 5,
          averagePRMergeTimeHours: 60.0
        }
      });

      const newer = createReport({
        _id: 'rep_newer',
        generatedAt: new Date('2026-09-20T10:00:00Z'),
        metrics: {
          ...createReport().metrics,
          healthScore: 74,
          healthStatus: 'Healthy',
          openIssuesCount: 42,
          openPullRequestsCount: 16,
          mergedPullRequestsCount: 12,
          averagePRMergeTimeHours: 36.0
        }
      });

      const result = compareReports(older, newer);
      expect(result.summaryStatements.length).toBeGreaterThan(0);
      expect(result.summaryStatements[0]).toContain('Repository health score improved by +14 points');
      expect(result.summaryStatements.some((s) => s.includes('Backlog issues reduced by 8'))).toBe(true);
      expect(result.summaryStatements.some((s) => s.includes('Average PR turnaround velocity accelerated'))).toBe(true);
    });

    it('explains unchanged metrics when snapshots are captured 2 hours apart with zero variance', () => {
      const older = createReport({
        _id: 'rep_older_2h',
        generatedAt: new Date('2026-10-24T08:00:00Z')
      });
      const newer = createReport({
        _id: 'rep_newer_2h',
        generatedAt: new Date('2026-10-24T10:00:00Z')
      });

      const result = compareReports(older, newer);
      expect(result.snapshots.elapsedHours).toBe(2);
      expect(result.snapshots.elapsedTimeFormatted).toBe('2 Hours Elapsed');
      expect(result.healthScoreComparison.scoreDelta).toBe(0);
      expect(result.summaryStatements.some((s) => s.includes('No repository activity or metric variance detected between snapshots (2 Hours Elapsed)'))).toBe(true);
    });
  });

  describe('Mongoose Subdocument & Finding Normalization', () => {
    it('correctly unwraps Mongoose subdocuments so itemNumber, title, and url are never lost', () => {
      // Simulate Mongoose subdocument objects that have _doc and internal properties
      const mockMongooseFinding = {
        $__: {},
        _doc: {
          id: 'stale_issue-999',
          type: 'stale_issue',
          severity: 'critical',
          itemNumber: 999,
          title: 'Critical DB Connection Timeout',
          daysInactive: 30,
          explanation: 'No activity in 30 days',
          ruleBasedAction: 'Investigate or close issue'
        },
        toObject() {
          return { ...this._doc };
        }
      };

      const older = createReport({
        _id: 'rep_doc_1',
        findings: [mockMongooseFinding]
      });

      const newer = createReport({
        _id: 'rep_doc_2',
        findings: [{
          ...mockMongooseFinding,
          _doc: {
            ...mockMongooseFinding._doc,
            daysInactive: 32
          }
        }]
      });

      const result = compareReports(older, newer);
      expect(result.findingsComparison.persistingCount).toBe(1);
      const persistingItem = result.findingsComparison.persisting[0];

      // Must be top-level properties, not buried in _doc
      expect(persistingItem.itemNumber).toBe(999);
      expect(persistingItem.title).toBe('Critical DB Connection Timeout');
      expect(persistingItem.severity).toBe('critical');
      expect(persistingItem.daysInactive).toBe(32);
      expect(persistingItem.daysInactiveDelta).toBe(2);
      // Valid GitHub URL generated if missing
      expect(persistingItem.url).toBe('https://github.com/facebook/react/issues/999');
    });

    it('falls back gracefully when title or itemNumber is missing on older finding records', () => {
      const older = createReport({
        _id: 'rep_legacy_1',
        findings: [{
          type: 'old_open_pr',
          severity: 'warning',
          itemNumber: null,
          explanation: 'Overdue open pull request awaiting review'
        }]
      });

      const newer = createReport({
        _id: 'rep_legacy_2',
        findings: [{
          type: 'old_open_pr',
          severity: 'critical',
          itemNumber: null,
          explanation: 'Overdue open pull request awaiting review',
          daysInactive: 25
        }]
      });

      const result = compareReports(older, newer);
      expect(result.findingsComparison.persistingCount).toBe(1);
      const item = result.findingsComparison.persisting[0];
      expect(item.itemNumber).toBeNull();
      expect(item.title).toBe('Overdue open pull request awaiting review');
      expect(item.severityUpgraded).toBe(true);
    });
  });
});
