/**
 * DevPulse - Deterministic Repository Health & Bottleneck Analysis Service
 * Pure business logic with explainable metrics, dimensional breakdowns, and rule-based actions.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

// Centralized threshold constants (in days)
const STALE_ISSUE_THRESHOLD_DAYS = 30;
const STALE_ISSUE_CRITICAL_DAYS = 60;

const OLD_OPEN_PR_THRESHOLD_DAYS = 14;
const OLD_OPEN_PR_CRITICAL_DAYS = 28;

const REVIEW_INACTIVITY_THRESHOLD_DAYS = 7;
const REVIEW_INACTIVITY_CRITICAL_DAYS = 14;

/**
 * Calculates deterministic health metrics and bottlenecks from raw GitHub data.
 * @param {Object} rawData - Object returned by githubService.getRawRepoData
 * @param {Date} [referenceDate] - Optional anchor date (defaults to new Date()) for deterministic testing
 */
const analyzeRepository = (rawData, referenceDate = new Date()) => {
  const now = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const nowMs = now.getTime();

  const {
    metadata = {},
    issues = [],
    openPullRequests = [],
    closedPullRequests = [],
    recentCommits = []
  } = rawData;

  const defaultBranch = metadata.defaultBranch || 'main';

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
    mergedPullRequests.length > 0
      ? parseFloat((totalMergeDurationHours / mergedPullRequests.length).toFixed(1))
      : 0;

  // 2. Deterministic Bottleneck Detection
  const findings = [];

  // Check 1: Stale Issues (open > 30 days with no comments or updates)
  issues.forEach((issue) => {
    const updatedAtMs = new Date(issue.updated_at).getTime();
    const daysInactive = Math.floor((nowMs - updatedAtMs) / MS_PER_DAY);

    if (daysInactive >= STALE_ISSUE_THRESHOLD_DAYS) {
      const isCritical = daysInactive >= STALE_ISSUE_CRITICAL_DAYS;
      const severity = isCritical ? 'critical' : 'warning';

      findings.push({
        id: `stale_issue-${issue.number}`,
        type: 'stale_issue',
        severity,
        itemNumber: issue.number,
        title: issue.title,
        url: issue.html_url,
        thresholdDays: STALE_ISSUE_THRESHOLD_DAYS,
        relevantDates: {
          createdAt: issue.created_at,
          updatedAt: issue.updated_at
        },
        daysInactive,
        explanation: `Issue #${issue.number} has been inactive with no comments or updates for ${daysInactive} days (threshold: ${STALE_ISSUE_THRESHOLD_DAYS} days).`,
        ruleBasedAction: isCritical
          ? `Triage backlog: Inactive for ${daysInactive}d. Confirm bug status, ping author, or close if resolved.`
          : `Monitor issue: Inactive for ${daysInactive}d. Label for upcoming milestone or solicit updates.`
      });
    }
  });

  // Check 2: Old Open Pull Requests (open > 14 days without merge)
  openPullRequests.forEach((pr) => {
    const createdAtMs = new Date(pr.created_at).getTime();
    const daysOpen = Math.floor((nowMs - createdAtMs) / MS_PER_DAY);

    if (daysOpen >= OLD_OPEN_PR_THRESHOLD_DAYS) {
      const isCritical = daysOpen >= OLD_OPEN_PR_CRITICAL_DAYS;
      const severity = isCritical ? 'critical' : 'warning';

      findings.push({
        id: `old_open_pr-${pr.number}`,
        type: 'old_open_pr',
        severity,
        itemNumber: pr.number,
        title: pr.title,
        url: pr.html_url,
        thresholdDays: OLD_OPEN_PR_THRESHOLD_DAYS,
        relevantDates: {
          createdAt: pr.created_at,
          updatedAt: pr.updated_at
        },
        daysInactive: daysOpen,
        explanation: `Pull request #${pr.number} has been open for ${daysOpen} days without being merged (threshold: ${OLD_OPEN_PR_THRESHOLD_DAYS} days).`,
        ruleBasedAction: isCritical
          ? `Unblock velocity: PR open ${daysOpen}d. Rebase onto ${defaultBranch}, resolve conflicts, or close if abandoned.`
          : `Accelerate turnaround: PR open ${daysOpen}d. Ping submitter to complete pending tests or review comments.`
      });
    }

    // Check 3: Review Inactivity
    // STRICT INVARIANT: Only flag if review data is explicitly verified and reviewers were requested
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
          const isCritical = daysSinceCreated >= REVIEW_INACTIVITY_CRITICAL_DAYS;
          const severity = isCritical ? 'critical' : 'warning';

          findings.push({
            id: `review_inactivity-${pr.number}`,
            type: 'review_inactivity',
            severity,
            itemNumber: pr.number,
            title: pr.title,
            url: pr.html_url,
            thresholdDays: REVIEW_INACTIVITY_THRESHOLD_DAYS,
            relevantDates: {
              createdAt: pr.created_at,
              updatedAt: pr.updated_at
            },
            daysInactive: daysSinceCreated,
            explanation: `Pull request #${pr.number} has pending review requests, but no reviews have been submitted in over ${REVIEW_INACTIVITY_THRESHOLD_DAYS} days.`,
            ruleBasedAction: `Resolve deadlock: Reviews requested ${daysSinceCreated}d ago with no review submitted. Reassign reviewers or request team lead approval.`
          });
        }
      }
    }
  });

  // Sort findings deterministically: critical first, then warning, then highest daysInactive
  findings.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return b.daysInactive - a.daysInactive;
  });

  // 3. Multidimensional Bounded Health Scoring Engine (0 - 100)
  // Dimension A: PR Velocity & Turnaround (Weight: 30%)
  let prVelocityScore = 80;
  let prVelocityExplanation = 'No active or merged pull requests within the 30-day window.';

  const totalPRsEvaluated = mergedPullRequests.length + openPullRequests.length;
  if (totalPRsEvaluated > 0) {
    const mergeRatio = mergedPullRequests.length / totalPRsEvaluated;
    let throughputPts = 15;
    if (mergeRatio >= 0.7) throughputPts = 50;
    else if (mergeRatio >= 0.5) throughputPts = 42;
    else if (mergeRatio >= 0.3) throughputPts = 32;
    else if (mergeRatio >= 0.1) throughputPts = 22;

    let turnaroundPts = 25;
    if (mergedPullRequests.length > 0) {
      if (averagePRMergeTimeHours <= 24) turnaroundPts = 50;
      else if (averagePRMergeTimeHours <= 72) turnaroundPts = 42;
      else if (averagePRMergeTimeHours <= 168) turnaroundPts = 32;
      else if (averagePRMergeTimeHours <= 336) turnaroundPts = 22;
      else turnaroundPts = 15;
    }

    prVelocityScore = Math.max(15, Math.min(100, throughputPts + turnaroundPts));
    prVelocityExplanation = `${mergedPullRequests.length} merged vs ${openPullRequests.length} open PRs (${Math.round(mergeRatio * 100)}% throughput, avg turnaround: ${averagePRMergeTimeHours}h).`;
  }

  // Dimension B: Issue Backlog Hygiene (Weight: 25%)
  let issueHygieneScore = 100;
  let issueHygieneExplanation = 'Zero open issues in backlog.';

  const staleIssues = findings.filter((f) => f.type === 'stale_issue');
  if (issues.length > 0) {
    const staleRatio = staleIssues.length / issues.length;
    if (staleRatio === 0) {
      issueHygieneScore = 100;
      issueHygieneExplanation = `All ${issues.length} evaluated issues have recent activity within the past ${STALE_ISSUE_THRESHOLD_DAYS} days.`;
    } else if (staleRatio <= 0.2) {
      issueHygieneScore = 85;
      issueHygieneExplanation = `Low backlog staleness: ${staleIssues.length}/${issues.length} (${Math.round(staleRatio * 100)}%) issues are inactive > ${STALE_ISSUE_THRESHOLD_DAYS}d.`;
    } else if (staleRatio <= 0.4) {
      issueHygieneScore = 70;
      issueHygieneExplanation = `Moderate backlog staleness: ${staleIssues.length}/${issues.length} (${Math.round(staleRatio * 100)}%) issues are inactive > ${STALE_ISSUE_THRESHOLD_DAYS}d.`;
    } else if (staleRatio <= 0.6) {
      issueHygieneScore = 55;
      issueHygieneExplanation = `Elevated backlog staleness: ${staleIssues.length}/${issues.length} (${Math.round(staleRatio * 100)}%) issues are inactive > ${STALE_ISSUE_THRESHOLD_DAYS}d.`;
    } else if (staleRatio <= 0.8) {
      issueHygieneScore = 40;
      issueHygieneExplanation = `High backlog staleness: ${staleIssues.length}/${issues.length} (${Math.round(staleRatio * 100)}%) issues exceed ${STALE_ISSUE_THRESHOLD_DAYS}d inactivity.`;
    } else {
      issueHygieneScore = 25;
      issueHygieneExplanation = `Substantial backlog staleness: ${staleIssues.length}/${issues.length} (${Math.round(staleRatio * 100)}%) issues exceed ${STALE_ISSUE_THRESHOLD_DAYS}d inactivity.`;
    }

    if (staleIssues.length > 50) {
      issueHygieneScore = Math.max(10, issueHygieneScore - 10);
    }
  }

  // Dimension C: Default Branch Commit Cadence (Weight: 25%)
  let commitCadenceScore = 25;
  let commitCadenceExplanation = 'Dormant: No commits detected on default branch in the past 30 days.';

  const commitCount = recentCommits.length;
  if (commitCount >= 30) {
    commitCadenceScore = 100;
    commitCadenceExplanation = `High continuous delivery velocity with ${commitCount} commits in the past 30 days.`;
  } else if (commitCount >= 15) {
    commitCadenceScore = 85;
    commitCadenceExplanation = `Steady active commit cadence with ${commitCount} commits in the past 30 days.`;
  } else if (commitCount >= 5) {
    commitCadenceScore = 70;
    commitCadenceExplanation = `Moderate maintenance activity with ${commitCount} commits in the past 30 days.`;
  } else if (commitCount >= 1) {
    commitCadenceScore = 50;
    commitCadenceExplanation = `Low commit cadence with ${commitCount} commits in the past 30 days.`;
  }

  // Dimension D: Review & Collaboration Responsiveness (Weight: 20%)
  let reviewResponsivenessScore = 100;
  let reviewPenalties = 0;

  const reviewDeadlocks = findings.filter((f) => f.type === 'review_inactivity');
  const oldOpenPRs = findings.filter((f) => f.type === 'old_open_pr');

  reviewDeadlocks.forEach((f) => {
    reviewPenalties += f.severity === 'critical' ? 15 : 8;
  });
  oldOpenPRs.forEach((f) => {
    reviewPenalties += f.severity === 'critical' ? 10 : 5;
  });

  reviewResponsivenessScore = Math.max(15, Math.min(100, 100 - reviewPenalties));
  let reviewResponsivenessExplanation =
    reviewPenalties === 0
      ? 'Zero review deadlocks or overdue open pull requests identified.'
      : `${reviewDeadlocks.length} review deadlock(s) and ${oldOpenPRs.length} overdue PR(s) impacting velocity.`;

  // Compute Overall Weighted Score
  const weightedTotal =
    prVelocityScore * 0.3 +
    issueHygieneScore * 0.25 +
    commitCadenceScore * 0.25 +
    reviewResponsivenessScore * 0.2;

  const healthScore = Math.max(0, Math.min(100, Math.round(weightedTotal)));

  // Health Status label
  let healthStatus = 'Healthy';
  if (healthScore < 50) healthStatus = 'Needs Attention';
  else if (healthScore < 75) healthStatus = 'Fair';

  const insufficientData =
    issues.length === 0 &&
    openPullRequests.length === 0 &&
    closedPullRequests.length === 0 &&
    recentCommits.length === 0;

  const getDimensionStatus = (score) => {
    if (score >= 75) return 'Optimal';
    if (score >= 50) return 'Fair';
    return 'Critical';
  };

  const dimensions = {
    prVelocity: {
      score: prVelocityScore,
      weight: 30,
      status: getDimensionStatus(prVelocityScore),
      label: 'PR Velocity & Flow',
      explanation: prVelocityExplanation
    },
    issueHygiene: {
      score: issueHygieneScore,
      weight: 25,
      status: getDimensionStatus(issueHygieneScore),
      label: 'Issue Backlog Hygiene',
      explanation: issueHygieneExplanation
    },
    commitCadence: {
      score: commitCadenceScore,
      weight: 25,
      status: getDimensionStatus(commitCadenceScore),
      label: 'Default Branch Cadence',
      explanation: commitCadenceExplanation
    },
    reviewResponsiveness: {
      score: reviewResponsivenessScore,
      weight: 20,
      status: getDimensionStatus(reviewResponsivenessScore),
      label: 'Review Responsiveness',
      explanation: reviewResponsivenessExplanation
    }
  };

  return {
    repository: {
      owner: metadata.owner,
      repo: metadata.repo,
      fullName: metadata.fullName,
      description: metadata.description,
      stars: metadata.stars,
      forks: metadata.forks,
      defaultBranch,
      url: metadata.url
    },
    metrics: {
      healthScore,
      healthStatus,
      scoringModelVersion: 'v2',
      insufficientData,
      openIssuesCount: issues.length,
      openPullRequestsCount: openPullRequests.length,
      mergedPullRequestsCount: mergedPullRequests.length,
      averagePRMergeTimeHours,
      recentCommitsCount: recentCommits.length,
      totalFindingsCount: findings.length,
      criticalFindingsCount: findings.filter((f) => f.severity === 'critical').length,
      warningFindingsCount: findings.filter((f) => f.severity === 'warning').length,
      dimensions
    },
    findings,
    analyzedAt: now.toISOString(),
    reportingPeriodDays: 30
  };
};

module.exports = {
  analyzeRepository,
  STALE_ISSUE_THRESHOLD_DAYS,
  STALE_ISSUE_CRITICAL_DAYS,
  OLD_OPEN_PR_THRESHOLD_DAYS,
  OLD_OPEN_PR_CRITICAL_DAYS,
  REVIEW_INACTIVITY_THRESHOLD_DAYS,
  REVIEW_INACTIVITY_CRITICAL_DAYS
};
