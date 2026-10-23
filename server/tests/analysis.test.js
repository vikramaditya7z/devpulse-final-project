const { analyzeRepository } = require('../services/analysisService');

describe('Analysis Service - Deterministic Health & Bottleneck Rules', () => {
  const referenceDate = new Date('2026-10-23T12:00:00.000Z');

  const baseMetadata = {
    owner: 'octocat',
    repo: 'hello-world',
    fullName: 'octocat/hello-world',
    description: 'A test repository',
    stars: 100,
    forks: 20,
    defaultBranch: 'main',
    url: 'https://github.com/octocat/hello-world'
  };

  test('flags stale issue when open > 30 days with no activity', () => {
    const rawData = {
      metadata: baseMetadata,
      issues: [
        {
          number: 10,
          title: 'Old lingering bug',
          html_url: 'https://github.com/octocat/hello-world/issues/10',
          created_at: '2026-08-01T00:00:00.000Z',
          updated_at: '2026-08-10T00:00:00.000Z' // ~74 days inactive relative to referenceDate
        },
        {
          number: 11,
          title: 'Recent issue',
          html_url: 'https://github.com/octocat/hello-world/issues/11',
          created_at: '2026-10-20T00:00:00.000Z',
          updated_at: '2026-10-22T00:00:00.000Z' // 1 day inactive
        }
      ],
      openPullRequests: [],
      closedPullRequests: [],
      recentCommits: []
    };

    const result = analyzeRepository(rawData, referenceDate);

    expect(result.metrics.openIssuesCount).toBe(2);
    expect(result.findings.length).toBe(1);
    expect(result.findings[0]).toMatchObject({
      type: 'stale_issue',
      itemNumber: 10,
      severity: 'critical'
    });
    expect(result.findings[0].daysInactive).toBeGreaterThanOrEqual(70);
  });

  test('flags old open PR when created > 14 days ago without merge', () => {
    const rawData = {
      metadata: baseMetadata,
      issues: [],
      openPullRequests: [
        {
          number: 42,
          title: 'Refactor auth module',
          html_url: 'https://github.com/octocat/hello-world/pull/42',
          created_at: '2026-10-01T00:00:00.000Z', // 22 days old
          updated_at: '2026-10-05T00:00:00.000Z',
          reviewsAvailable: false
        },
        {
          number: 43,
          title: 'Fix typo',
          html_url: 'https://github.com/octocat/hello-world/pull/43',
          created_at: '2026-10-21T00:00:00.000Z', // 2 days old
          updated_at: '2026-10-21T00:00:00.000Z',
          reviewsAvailable: false
        }
      ],
      closedPullRequests: [],
      recentCommits: []
    };

    const result = analyzeRepository(rawData, referenceDate);

    expect(result.metrics.openPullRequestsCount).toBe(2);
    expect(result.findings.length).toBe(1);
    expect(result.findings[0]).toMatchObject({
      type: 'old_open_pr',
      itemNumber: 42,
      severity: 'warning'
    });
    expect(result.findings[0].daysInactive).toBe(22);
  });

  test('CRITICAL RULE: review inactivity is ONLY flagged when review data is explicitly available', () => {
    // Case A: reviewsAvailable is FALSE -> MUST NOT flag review inactivity
    const rawDataNoReviews = {
      metadata: baseMetadata,
      issues: [],
      openPullRequests: [
        {
          number: 101,
          title: 'PR with reviewers requested but reviews unavailable',
          html_url: 'https://github.com/octocat/hello-world/pull/101',
          created_at: '2026-10-01T00:00:00.000Z',
          updated_at: '2026-10-01T00:00:00.000Z',
          requested_reviewers: [{ login: 'reviewer1' }],
          reviewsAvailable: false, // Review data could not be fetched
          reviews: []
        }
      ],
      closedPullRequests: [],
      recentCommits: []
    };

    const resultA = analyzeRepository(rawDataNoReviews, referenceDate);
    const reviewFindingsA = resultA.findings.filter((f) => f.type === 'review_inactivity');
    expect(reviewFindingsA.length).toBe(0); // Invariant upheld!

    // Case B: reviewsAvailable is TRUE, reviewers requested, but 0 reviews submitted in > 7 days -> SHOULD flag
    const rawDataWithReviews = {
      metadata: baseMetadata,
      issues: [],
      openPullRequests: [
        {
          number: 102,
          title: 'PR with verified review inactivity',
          html_url: 'https://github.com/octocat/hello-world/pull/102',
          created_at: '2026-10-10T00:00:00.000Z', // 13 days old
          updated_at: '2026-10-10T00:00:00.000Z',
          requested_reviewers: [{ login: 'reviewer1' }],
          reviewsAvailable: true,
          reviews: [] // Zero reviews recorded
        }
      ],
      closedPullRequests: [],
      recentCommits: []
    };

    const resultB = analyzeRepository(rawDataWithReviews, referenceDate);
    const reviewFindingsB = resultB.findings.filter((f) => f.type === 'review_inactivity');
    expect(reviewFindingsB.length).toBe(1);
    expect(reviewFindingsB[0].itemNumber).toBe(102);
  });

  test('correctly calculates average PR merge turnaround time in hours for merged PRs', () => {
    const rawData = {
      metadata: baseMetadata,
      issues: [],
      openPullRequests: [],
      closedPullRequests: [
        {
          number: 1,
          created_at: '2026-10-10T00:00:00.000Z',
          merged_at: '2026-10-11T12:00:00.000Z' // 36 hours
        },
        {
          number: 2,
          created_at: '2026-10-15T00:00:00.000Z',
          merged_at: '2026-10-15T12:00:00.000Z' // 12 hours
        },
        {
          number: 3,
          created_at: '2026-08-01T00:00:00.000Z',
          merged_at: '2026-08-02T00:00:00.000Z' // Merged > 30 days ago (should be excluded)
        },
        {
          number: 4,
          created_at: '2026-10-18T00:00:00.000Z',
          merged_at: null // Closed unmerged (should be excluded)
        }
      ],
      recentCommits: [{}, {}, {}]
    };

    const result = analyzeRepository(rawData, referenceDate);

    expect(result.metrics.mergedPullRequestsCount).toBe(2);
    // Average of 36h and 12h = 24.0h
    expect(result.metrics.averagePRMergeTimeHours).toBe(24.0);
  });
});
