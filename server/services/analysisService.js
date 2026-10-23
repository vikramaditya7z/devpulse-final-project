/**
 * DevPulse - Deterministic Repository Health & Bottleneck Analysis Service
 * Pure business logic with explainable metrics and zero hallucinated data.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

// Configurable threshold constants (in days)
const STALE_ISSUE_THRESHOLD_DAYS = 30;
const OLD_OPEN_PR_THRESHOLD_DAYS = 14;
const REVIEW_INACTIVITY_THRESHOLD_DAYS = 7;

/**
 * Calculates deterministic health metrics and bottlenecks from raw GitHub data.
 * @param {Object} rawData - Object returned by githubService.getRawRepoData
 * @param {Date} [referenceDate] - Optional anchor date (defaults to new Date()) for deterministic testing
 */
const analyzeRepository = (rawData, referenceDate = new Date()) => {
  const now = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const nowMs = now.getTime();

  const { metadata, issues = [], openPullRequests = [], closedPullRequests = [], recentCommits = [] } = rawData;

  // 1. Identify Merged Pull Requests within the reporting window (last 30 days)
  const thirtyDaysAgoMs = nowMs - 30 * MS_PER_DAY;

  const mergedPullRequests = closedPullRequests.filter((pr) => {
    if (!pr.merged_at) return false;
    const mergedTime = new Date(pr.merged_at).getTime();
    return mergedTime >= thirtyDaysAgoMs;
  });

  // Calculate Average PR Merge Turnaround Time (in hours)
  let totalMergeDurationHours = 0;
  mergedPullRequests.forEach((pr) => {
    const createdTime = new Date(pr.created_at).getTime();
    const mergedTime = new Date(pr.merged_at).getTime();
    const durationHours = Math.max(0, (mergedTime - createdTime) / MS_PER_HOUR);
    totalMergeDurationHours += durationHours;
  });

  const averagePRMergeTimeHours =
    mergedPullRequests.length > 0 ? parseFloat((totalMergeDurationHours / mergedPullRequests.length).toFixed(1)) : 0;

  // 2. Deterministic Bottleneck Detection
  const findings = [];

  // Check 1: Stale Issues (open > 30 days with no update activity)
  issues.forEach((issue) => {
    const updatedAtMs = new Date(issue.updated_at).getTime();
    const daysInactive = Math.floor((nowMs - updatedAtMs) / MS_PER_DAY);

    if (daysInactive >= STALE_ISSUE_THRESHOLD_DAYS) {
      findings.push({
        type: 'stale_issue',
        severity: daysInactive >= 60 ? 'critical' : 'warning',
        itemNumber: issue.number,
        title: issue.title,
        url: issue.html_url,
        relevantDates: {
          createdAt: issue.created_at,
          updatedAt: issue.updated_at
        },
        daysInactive,
        explanation: `Issue #${issue.number} has been inactive with no comments or updates for ${daysInactive} days (threshold: ${STALE_ISSUE_THRESHOLD_DAYS} days).`
      });
    }
  });

  // Check 2: Old Open Pull Requests (open > 14 days without merge)
  openPullRequests.forEach((pr) => {
    const createdAtMs = new Date(pr.created_at).getTime();
    const daysOpen = Math.floor((nowMs - createdAtMs) / MS_PER_DAY);

    if (daysOpen >= OLD_OPEN_PR_THRESHOLD_DAYS) {
      findings.push({
        type: 'old_open_pr',
        severity: daysOpen >= 28 ? 'critical' : 'warning',
        itemNumber: pr.number,
        title: pr.title,
        url: pr.html_url,
        relevantDates: {
          createdAt: pr.created_at,
          updatedAt: pr.updated_at
        },
        daysInactive: daysOpen,
        explanation: `Pull request #${pr.number} has been open for ${daysOpen} days without being merged (threshold: ${OLD_OPEN_PR_THRESHOLD_DAYS} days).`
      });
    }

    // Check 3: Review Inactivity
    // STRICT RULE: Only flag if review data is explicitly verified and reviews were requested
    const hasReviewersRequested =
      (Array.isArray(pr.requested_reviewers) && pr.requested_reviewers.length > 0) ||
      (Array.isArray(pr.requested_teams) && pr.requested_teams.length > 0);

    if (pr.reviewsAvailable && hasReviewersRequested) {
      const reviews = Array.isArray(pr.reviews) ? pr.reviews : [];
      const hasRecentReview = reviews.some((rev) => {
        const reviewTime = new Date(rev.submitted_at).getTime();
        return nowMs - reviewTime < REVIEW_INACTIVITY_THRESHOLD_DAYS * MS_PER_DAY;
      });

      if (!hasRecentReview) {
        const daysSinceCreated = Math.floor((nowMs - createdAtMs) / MS_PER_DAY);
        if (daysSinceCreated >= REVIEW_INACTIVITY_THRESHOLD_DAYS) {
          findings.push({
            type: 'review_inactivity',
            severity: 'warning',
            itemNumber: pr.number,
            title: pr.title,
            url: pr.html_url,
            relevantDates: {
              createdAt: pr.created_at,
              updatedAt: pr.updated_at
            },
            daysInactive: daysSinceCreated,
            explanation: `Pull request #${pr.number} has pending review requests, but no reviews have been submitted in over ${REVIEW_INACTIVITY_THRESHOLD_DAYS} days.`
          });
        }
      }
    }
  });

  // Sort findings: critical first, then warning, then highest daysInactive
  findings.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return b.daysInactive - a.daysInactive;
  });

  // 3. Compute Deterministic Health Score (0 - 100)
  // Base score is 100, deducted by severity of bottlenecks and stale backlog
  let healthScore = 100;

  findings.forEach((f) => {
    if (f.severity === 'critical') healthScore -= 12;
    else if (f.severity === 'warning') healthScore -= 5;
  });

  // Bonus for active merged PRs
  if (mergedPullRequests.length > 5) healthScore += 5;
  // Penalty if excessive open PRs backlog (> 15)
  if (openPullRequests.length > 15) healthScore -= 10;
  // Penalty if no recent commits
  if (recentCommits.length === 0) healthScore -= 10;

  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  // Health Status label
  let healthStatus = 'Healthy';
  if (healthScore < 50) healthStatus = 'Needs Attention';
  else if (healthScore < 75) healthStatus = 'Fair';

  return {
    repository: {
      owner: metadata.owner,
      repo: metadata.repo,
      fullName: metadata.fullName,
      description: metadata.description,
      stars: metadata.stars,
      forks: metadata.forks,
      defaultBranch: metadata.defaultBranch,
      url: metadata.url
    },
    metrics: {
      healthScore,
      healthStatus,
      openIssuesCount: issues.length,
      openPullRequestsCount: openPullRequests.length,
      mergedPullRequestsCount: mergedPullRequests.length,
      averagePRMergeTimeHours,
      recentCommitsCount: recentCommits.length,
      totalFindingsCount: findings.length,
      criticalFindingsCount: findings.filter((f) => f.severity === 'critical').length,
      warningFindingsCount: findings.filter((f) => f.severity === 'warning').length
    },
    findings,
    analyzedAt: now.toISOString(),
    reportingPeriodDays: 30
  };
};

module.exports = {
  analyzeRepository,
  STALE_ISSUE_THRESHOLD_DAYS,
  OLD_OPEN_PR_THRESHOLD_DAYS,
  REVIEW_INACTIVITY_THRESHOLD_DAYS
};
