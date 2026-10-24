const { analyzeRepository } = require('../services/analysisService');

describe('Analysis Engine - Multidimensional Bounded Health & Rule Actions', () => {
  const referenceDate = new Date('2026-10-24T12:00:00.000Z');

  const sampleMetadata = {
    owner: 'expressjs',
    repo: 'express',
    fullName: 'expressjs/express',
    description: 'Fast, unopinionated, minimalist web framework for node.',
    stars: 62000,
    forks: 15000,
    defaultBranch: 'master',
    url: 'https://github.com/expressjs/express'
  };

  test('calculates bounded health score for high-stale-backlog repository like express without dropping to 0', () => {
    // Simulate 96 issues, 84 of which are >60d stale, but repo has 15 commits and 8 merged PRs
    const staleIssues = Array.from({ length: 84 }, (_, i) => ({
      number: 1000 + i,
      title: `Old backlog ticket ${i}`,
      html_url: `https://github.com/expressjs/express/issues/${1000 + i}`,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-06-01T00:00:00.000Z'
    }));

    const activeIssues = Array.from({ length: 12 }, (_, i) => ({
      number: 2000 + i,
      title: `Active ticket ${i}`,
      html_url: `https://github.com/expressjs/express/issues/${2000 + i}`,
      created_at: '2026-10-20T00:00:00.000Z',
      updated_at: '2026-10-22T00:00:00.000Z'
    }));

    const rawData = {
      metadata: sampleMetadata,
      issues: [...staleIssues, ...activeIssues],
      openPullRequests: [
        {
          number: 501,
          title: 'Update router middleware',
          html_url: 'https://github.com/expressjs/express/pull/501',
          created_at: '2026-10-20T00:00:00.000Z',
          updated_at: '2026-10-22T00:00:00.000Z',
          reviewsAvailable: false
        }
      ],
      closedPullRequests: [
        {
          number: 490,
          created_at: '2026-10-01T00:00:00.000Z',
          merged_at: '2026-10-02T12:00:00.000Z' // 36h
        },
        {
          number: 491,
          created_at: '2026-10-05T00:00:00.000Z',
          merged_at: '2026-10-06T00:00:00.000Z' // 24h
        }
      ],
      recentCommits: Array.from({ length: 18 }, (_, i) => ({ sha: `commit-${i}` }))
    };

    const result = analyzeRepository(rawData, referenceDate);

    // Score must be bounded, realistic, and NOT 0/100
    expect(result.metrics.healthScore).toBeGreaterThanOrEqual(45);
    expect(result.metrics.healthScore).toBeLessThanOrEqual(85);
    expect(['Fair', 'Healthy']).toContain(result.metrics.healthStatus);

    // Dimensions must be present and defined
    expect(result.metrics.dimensions).toBeDefined();
    expect(result.metrics.dimensions.prVelocity.score).toBeGreaterThan(0);
    expect(result.metrics.dimensions.commitCadence.score).toBe(85); // 18 commits
    expect(result.metrics.dimensions.issueHygiene.score).toBeLessThan(50); // High staleness penalizes hygiene

    // Findings must contain actionable rule-based next actions
    expect(result.findings.length).toBe(84);
    expect(result.findings[0].ruleBasedAction).toBeDefined();
    expect(result.findings[0].ruleBasedAction).toContain('Triage backlog');
  });

  test('handles completely empty repository with zero data gracefully', () => {
    const emptyRepo = {
      metadata: { ...sampleMetadata, fullName: 'test/empty-repo' },
      issues: [],
      openPullRequests: [],
      closedPullRequests: [],
      recentCommits: []
    };

    const result = analyzeRepository(emptyRepo, referenceDate);

    expect(result.metrics.insufficientData).toBe(true);
    expect(result.metrics.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.metrics.healthScore).toBeLessThanOrEqual(100);
    expect(result.findings.length).toBe(0);
  });

  test('scores a pristine, highly active repository close to 100', () => {
    const pristineRepo = {
      metadata: sampleMetadata,
      issues: [
        {
          number: 1,
          title: 'Recent question',
          html_url: 'https://github.com/expressjs/express/issues/1',
          created_at: '2026-10-23T00:00:00.000Z',
          updated_at: '2026-10-24T00:00:00.000Z'
        }
      ],
      openPullRequests: [
        {
          number: 2,
          title: 'Active feature',
          html_url: 'https://github.com/expressjs/express/pull/2',
          created_at: '2026-10-23T00:00:00.000Z',
          updated_at: '2026-10-23T12:00:00.000Z',
          reviewsAvailable: false
        }
      ],
      closedPullRequests: Array.from({ length: 10 }, (_, i) => ({
        number: 100 + i,
        created_at: '2026-10-10T00:00:00.000Z',
        merged_at: '2026-10-10T12:00:00.000Z' // 12h turnaround
      })),
      recentCommits: Array.from({ length: 35 }, (_, i) => ({ sha: `commit-${i}` }))
    };

    const result = analyzeRepository(pristineRepo, referenceDate);

    expect(result.metrics.healthScore).toBeGreaterThanOrEqual(90);
    expect(result.metrics.healthStatus).toBe('Healthy');
    expect(result.metrics.dimensions.commitCadence.score).toBe(100);
    expect(result.metrics.dimensions.issueHygiene.score).toBe(100);
    expect(result.findings.length).toBe(0);
  });
});
