/**
 * DevPulse - Deterministic Snapshot-to-Snapshot Comparison Service
 * Compares two persistent health reports for the same repository with mathematical precision,
 * stable finding identifier matching, and neutral, evidence-based change summarization.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Metric direction semantics:
 * 'lower_is_better': open issues, open PRs, avg merge time, findings
 * 'higher_is_better': merged PRs, recent commits, health score
 */
const METRIC_SPECS = [
  {
    key: 'openIssuesCount',
    label: 'Open Issues',
    unit: 'issues',
    desiredDirection: 'lower_is_better'
  },
  {
    key: 'openPullRequestsCount',
    label: 'Open Pull Requests',
    unit: 'PRs',
    desiredDirection: 'lower_is_better'
  },
  {
    key: 'mergedPullRequestsCount',
    label: 'Merged PRs (30d)',
    unit: 'PRs',
    desiredDirection: 'higher_is_better'
  },
  {
    key: 'averagePRMergeTimeHours',
    label: 'Average PR Merge Time',
    unit: 'hours',
    desiredDirection: 'lower_is_better'
  },
  {
    key: 'recentCommitsCount',
    label: 'Recent Commits',
    unit: 'commits',
    desiredDirection: 'higher_is_better'
  },
  {
    key: 'criticalFindingsCount',
    label: 'Critical Bottlenecks',
    unit: 'findings',
    desiredDirection: 'lower_is_better'
  },
  {
    key: 'totalFindingsCount',
    label: 'Total Bottlenecks Flagged',
    unit: 'findings',
    desiredDirection: 'lower_is_better'
  }
];

const DIMENSION_KEYS = [
  { key: 'prVelocity', label: 'Pull Request Velocity', weight: 30 },
  { key: 'issueHygiene', label: 'Backlog Hygiene', weight: 25 },
  { key: 'commitCadence', label: 'Commit Cadence', weight: 25 },
  { key: 'reviewResponsiveness', label: 'Review Responsiveness', weight: 20 }
];

/**
 * Safely unwrap and normalize finding objects, handling Mongoose subdocuments
 * or plain JSON objects, ensuring essential fields like itemNumber, title, and url
 * are cleanly accessible and never undefined.
 */
const normalizeFinding = (finding, repoFullName = '') => {
  if (!finding) return {};
  const obj = typeof finding.toObject === 'function' ? finding.toObject() : (finding._doc || finding);
  const type = obj.type || 'stale_issue';

  let itemNumber = null;
  if (typeof obj.itemNumber === 'number' && !isNaN(obj.itemNumber)) {
    itemNumber = obj.itemNumber;
  } else if (obj.itemNumber !== undefined && obj.itemNumber !== null && !isNaN(parseInt(obj.itemNumber, 10))) {
    itemNumber = parseInt(obj.itemNumber, 10);
  }

  // Guaranteed readable title
  let title = (obj.title && typeof obj.title === 'string' && obj.title.trim()) ? obj.title.trim() : '';
  if (!title) {
    if (itemNumber) {
      title = `${type.replace(/_/g, ' ')} #${itemNumber}`;
    } else {
      title = obj.explanation || 'Identified Collaboration Bottleneck';
    }
  }

  // Construct fallback URL if missing
  let url = obj.url || '';
  if (!url && repoFullName && itemNumber) {
    const section = type === 'stale_issue' ? 'issues' : 'pull';
    url = `https://github.com/${repoFullName}/${section}/${itemNumber}`;
  }

  return {
    id: obj.id || (obj._id ? obj._id.toString() : ''),
    type,
    severity: obj.severity || 'warning',
    itemNumber,
    title,
    url,
    thresholdDays: obj.thresholdDays,
    relevantDates: obj.relevantDates,
    daysInactive: typeof obj.daysInactive === 'number' ? obj.daysInactive : 0,
    explanation: obj.explanation || '',
    ruleBasedAction: obj.ruleBasedAction || ''
  };
};

/**
 * Derives a stable identifier for a finding.
 */
const getFindingKey = (finding) => {
  if (finding.id && typeof finding.id === 'string' && finding.id.trim()) {
    return finding.id.trim();
  }
  const type = finding.type || 'finding';
  const item = finding.itemNumber !== undefined && finding.itemNumber !== null && finding.itemNumber !== ''
    ? finding.itemNumber
    : (finding.title || '');
  return `${type}-${item}`.toLowerCase();
};

/**
 * Safe percentage calculation with zero denominator handling.
 */
const calculatePercentChange = (earlierVal, laterVal) => {
  if (typeof earlierVal !== 'number' || typeof laterVal !== 'number') {
    return { percent: null, note: 'Incomparable' };
  }
  if (earlierVal === 0) {
    if (laterVal === 0) {
      return { percent: 0, note: '0.0%' };
    }
    return { percent: null, note: 'New occurrence from zero baseline' };
  }
  const pct = parseFloat((((laterVal - earlierVal) / earlierVal) * 100).toFixed(1));
  return { percent: pct, note: `${pct > 0 ? '+' : ''}${pct}%` };
};

/**
 * Compares two HealthReport documents or plain objects.
 * @param {Object} reportA
 * @param {Object} reportB
 * @returns {Object} comparison result
 */
const compareReports = (reportA, reportB) => {
  if (!reportA || !reportB) {
    const err = new Error('Two report snapshots are required for historical comparison.');
    err.code = 'INVALID_COMPARISON_INPUT';
    err.statusCode = 400;
    throw err;
  }

  const idA = (reportA._id || reportA.id || '').toString();
  const idB = (reportB._id || reportB.id || '').toString();

  if (idA && idB && idA === idB) {
    const err = new Error('Cannot compare a report snapshot with itself. Please select two distinct snapshots.');
    err.code = 'IDENTICAL_REPORTS';
    err.statusCode = 400;
    throw err;
  }

  const repoA = reportA.repository?.fullName || `${reportA.repository?.owner}/${reportA.repository?.repo}`;
  const repoB = reportB.repository?.fullName || `${reportB.repository?.owner}/${reportB.repository?.repo}`;

  if (!repoA || !repoB || repoA.toLowerCase() !== repoB.toLowerCase()) {
    const err = new Error(
      `Cannot compare reports from different repositories ("${repoA || 'Unknown'}" vs "${repoB || 'Unknown'}"). Snapshots must belong to the same repository.`
    );
    err.code = 'DIFFERENT_REPOSITORIES';
    err.statusCode = 400;
    throw err;
  }

  // Chronologically order snapshots: earlier vs later
  const dateA = new Date(reportA.generatedAt || reportA.createdAt || Date.now()).getTime();
  const dateB = new Date(reportB.generatedAt || reportB.createdAt || Date.now()).getTime();

  const earlier = dateA <= dateB ? reportA : reportB;
  const later = earlier === reportA ? reportB : reportA;

  const earlierTime = new Date(earlier.generatedAt || earlier.createdAt || Date.now());
  const laterTime = new Date(later.generatedAt || later.createdAt || Date.now());
  const elapsedMs = Math.max(0, laterTime.getTime() - earlierTime.getTime());
  const elapsedDays = Math.round(elapsedMs / MS_PER_DAY);
  const elapsedHours = Math.round(elapsedMs / (1000 * 60 * 60));
  const elapsedMinutes = Math.round(elapsedMs / (1000 * 60));

  let elapsedTimeFormatted = `${elapsedDays} Days Elapsed`;
  if (elapsedDays === 0) {
    if (elapsedHours >= 1) {
      elapsedTimeFormatted = `${elapsedHours} ${elapsedHours === 1 ? 'Hour' : 'Hours'} Elapsed`;
    } else {
      elapsedTimeFormatted = `${Math.max(1, elapsedMinutes)} ${elapsedMinutes <= 1 ? 'Min' : 'Mins'} Elapsed`;
    }
  }

  // 1. Overall Health Comparison
  const earlierScore = earlier.metrics?.healthScore ?? 0;
  const laterScore = later.metrics?.healthScore ?? 0;
  const scoreDelta = laterScore - earlierScore;
  let scoreDirection = 'unchanged';
  if (scoreDelta > 0) scoreDirection = 'improved';
  else if (scoreDelta < 0) scoreDirection = 'regressed';

  const earlierStatus = earlier.metrics?.healthStatus || 'Unknown';
  const laterStatus = later.metrics?.healthStatus || 'Unknown';

  const earlierModelVersion = earlier.metrics?.scoringModelVersion || 'v1';
  const laterModelVersion = later.metrics?.scoringModelVersion || 'v2';
  const scoringModelsCompatible = earlierModelVersion === laterModelVersion;

  // 2. Dimensional Health Comparison
  const earlierDims = earlier.metrics?.dimensions || null;
  const laterDims = later.metrics?.dimensions || null;
  const dimensionsComparison = {};
  let comparableDimensionsCount = 0;

  DIMENSION_KEYS.forEach(({ key, label, weight }) => {
    const eDim = earlierDims ? earlierDims[key] : null;
    const lDim = laterDims ? laterDims[key] : null;

    if (eDim && lDim && typeof eDim.score === 'number' && typeof lDim.score === 'number') {
      comparableDimensionsCount++;
      const eScore = Math.round(eDim.score);
      const lScore = Math.round(lDim.score);
      const delta = lScore - eScore;
      let status = 'unchanged';
      if (delta > 0) status = 'improved';
      else if (delta < 0) status = 'regressed';

      dimensionsComparison[key] = {
        label,
        weight,
        earlierScore: eScore,
        laterScore: lScore,
        delta,
        status,
        earlierStatus: eDim.status || 'Fair',
        laterStatus: lDim.status || 'Fair',
        comparable: true,
        interpretation:
          delta > 0
            ? `${label} score improved by +${delta} points.`
            : delta < 0
            ? `${label} score decreased by ${delta} points.`
            : `${label} score remained unchanged at ${eScore}/100.`
      };
    } else {
      dimensionsComparison[key] = {
        label,
        weight,
        comparable: false,
        explanation: 'Historical snapshot does not contain this dimensional breakdown.'
      };
    }
  });

  // 3. Key Metrics Comparison
  const metricsComparison = {};
  METRIC_SPECS.forEach(({ key, label, unit, desiredDirection }) => {
    const eVal = earlier.metrics?.[key] !== undefined ? earlier.metrics[key] : 0;
    const lVal = later.metrics?.[key] !== undefined ? later.metrics[key] : 0;
    const delta = typeof lVal === 'number' && typeof eVal === 'number' ? parseFloat((lVal - eVal).toFixed(1)) : 0;
    const { percent, note } = calculatePercentChange(eVal, lVal);

    let isImprovement = false;
    let isRegression = false;

    if (delta !== 0) {
      if (desiredDirection === 'lower_is_better') {
        isImprovement = delta < 0;
        isRegression = delta > 0;
      } else {
        isImprovement = delta > 0;
        isRegression = delta < 0;
      }
    }

    metricsComparison[key] = {
      label,
      unit,
      earlierValue: eVal,
      laterValue: lVal,
      delta,
      percentChange: percent,
      percentFormatted: note,
      desiredDirection,
      isImprovement,
      isRegression,
      isUnchanged: delta === 0
    };
  });

  // 4. Bottleneck Findings Transition Analysis
  const earlierFindingsRaw = Array.isArray(earlier.findings) ? earlier.findings : [];
  const laterFindingsRaw = Array.isArray(later.findings) ? later.findings : [];
  const repoFullName = earlier.repository?.fullName || repoA;

  const earlierFindings = earlierFindingsRaw.map((f) => normalizeFinding(f, repoFullName));
  const laterFindings = laterFindingsRaw.map((f) => normalizeFinding(f, repoFullName));

  const earlierMap = new Map();
  earlierFindings.forEach((f) => {
    const key = getFindingKey(f);
    earlierMap.set(key, f);
  });

  const laterMap = new Map();
  laterFindings.forEach((f) => {
    const key = getFindingKey(f);
    laterMap.set(key, f);
  });

  const newlyDetected = [];
  const persisting = [];
  const noLongerDetected = [];

  // Identify new and persisting
  laterFindings.forEach((lFinding) => {
    const key = getFindingKey(lFinding);
    if (earlierMap.has(key)) {
      const eFinding = earlierMap.get(key);
      const severityChanged = eFinding.severity !== lFinding.severity;
      const daysInactiveDelta = (lFinding.daysInactive || 0) - (eFinding.daysInactive || 0);

      persisting.push({
        ...lFinding,
        findingKey: key,
        earlierSeverity: eFinding.severity,
        currentSeverity: lFinding.severity,
        severityChanged,
        severityUpgraded: eFinding.severity === 'warning' && lFinding.severity === 'critical',
        severityDowngraded: eFinding.severity === 'critical' && lFinding.severity === 'warning',
        daysInactiveDelta
      });
    } else {
      newlyDetected.push({
        ...lFinding,
        findingKey: key
      });
    }
  });

  // Identify resolved / no longer detected
  earlierFindings.forEach((eFinding) => {
    const key = getFindingKey(eFinding);
    if (!laterMap.has(key)) {
      noLongerDetected.push({
        ...eFinding,
        findingKey: key
      });
    }
  });

  // Sort persisting findings: upgraded or critical first
  persisting.sort((a, b) => {
    if (a.severityUpgraded && !b.severityUpgraded) return -1;
    if (!a.severityUpgraded && b.severityUpgraded) return 1;
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return (b.daysInactive || 0) - (a.daysInactive || 0);
  });

  // 5. Deterministic, Neutral, Evidence-Based Summary Statements
  const summaryStatements = [];

  // Score statement
  if (scoreDelta > 0) {
    summaryStatements.push(
      `Repository health score improved by +${scoreDelta} points (${earlierScore}/100 "${earlierStatus}" → ${laterScore}/100 "${laterStatus}").`
    );
  } else if (scoreDelta < 0) {
    summaryStatements.push(
      `Repository health score regressed by ${scoreDelta} points (${earlierScore}/100 "${earlierStatus}" → ${laterScore}/100 "${laterStatus}").`
    );
  } else {
    summaryStatements.push(`Repository health score remained unchanged at ${earlierScore}/100 ("${earlierStatus}").`);
  }

  // Pull request velocity statement
  const openPrMetric = metricsComparison.openPullRequestsCount;
  const mergedPrMetric = metricsComparison.mergedPullRequestsCount;
  const avgMergeMetric = metricsComparison.averagePRMergeTimeHours;

  if (mergedPrMetric.delta !== 0 || openPrMetric.delta !== 0) {
    const prParts = [];
    if (openPrMetric.delta < 0) {
      prParts.push(`open pull request backlog decreased by ${Math.abs(openPrMetric.delta)} (${openPrMetric.earlierValue} → ${openPrMetric.laterValue})`);
    } else if (openPrMetric.delta > 0) {
      prParts.push(`open pull request backlog grew by +${openPrMetric.delta} (${openPrMetric.earlierValue} → ${openPrMetric.laterValue})`);
    }

    if (mergedPrMetric.delta > 0) {
      prParts.push(`30-day merged turnaround increased by +${mergedPrMetric.delta} PRs (${mergedPrMetric.earlierValue} → ${mergedPrMetric.laterValue})`);
    } else if (mergedPrMetric.delta < 0) {
      prParts.push(`30-day merged turnaround decreased by ${Math.abs(mergedPrMetric.delta)} PRs (${mergedPrMetric.earlierValue} → ${mergedPrMetric.laterValue})`);
    }

    if (prParts.length > 0) {
      summaryStatements.push(`PR throughput: ${prParts.join(', ')}.`);
    }
  }

  // Turnaround velocity statement
  if (avgMergeMetric.delta !== 0 && avgMergeMetric.earlierValue > 0 && avgMergeMetric.laterValue > 0) {
    if (avgMergeMetric.delta < 0) {
      summaryStatements.push(
        `Average PR turnaround velocity accelerated by ${Math.abs(avgMergeMetric.delta)} hours (${avgMergeMetric.earlierValue}h → ${avgMergeMetric.laterValue}h).`
      );
    } else {
      summaryStatements.push(
        `Average PR turnaround velocity lengthened by +${avgMergeMetric.delta} hours (${avgMergeMetric.earlierValue}h → ${avgMergeMetric.laterValue}h).`
      );
    }
  }

  // Issues backlog statement
  const issuesMetric = metricsComparison.openIssuesCount;
  if (issuesMetric.delta !== 0) {
    if (issuesMetric.delta < 0) {
      summaryStatements.push(
        `Backlog issues reduced by ${Math.abs(issuesMetric.delta)} (${issuesMetric.earlierValue} → ${issuesMetric.laterValue}).`
      );
    } else {
      summaryStatements.push(
        `Backlog issues increased by +${issuesMetric.delta} (${issuesMetric.earlierValue} → ${issuesMetric.laterValue}).`
      );
    }
  }

  // Bottlenecks transition statement
  const transitionParts = [];
  if (newlyDetected.length > 0) {
    transitionParts.push(`${newlyDetected.length} newly detected`);
  }
  if (noLongerDetected.length > 0) {
    transitionParts.push(`${noLongerDetected.length} no longer detected`);
  }
  if (persisting.length > 0) {
    const criticalPersisting = persisting.filter((p) => p.currentSeverity === 'critical').length;
    transitionParts.push(`${persisting.length} persisting (${criticalPersisting} critical)`);
  }

  if (transitionParts.length > 0) {
    summaryStatements.push(`Bottlenecks transition: ${transitionParts.join(', ')}.`);
  }

  // Activity unchanged notice when metrics and findings show no movement
  if (scoreDelta === 0 && newlyDetected.length === 0 && noLongerDetected.length === 0) {
    summaryStatements.push(
      `No repository activity or metric variance detected between snapshots (${elapsedTimeFormatted}). Both snapshots capture identical states.`
    );
  }

  // Model compatibility notice
  let compatibilityNote = null;
  if (!scoringModelsCompatible) {
    compatibilityNote = `Earlier snapshot used scoring model ${earlierModelVersion} while later snapshot used ${laterModelVersion}. Absolute score delta should be evaluated with consideration of scoring model updates.`;
  }

  return {
    repository: {
      fullName: earlier.repository?.fullName || repoA,
      owner: earlier.repository?.owner,
      repo: earlier.repository?.repo,
      url: earlier.repository?.url,
      description: earlier.repository?.description
    },
    snapshots: {
      earlier: {
        _id: earlier._id,
        generatedAt: earlierTime.toISOString(),
        createdBy: earlier.createdBy,
        scope: earlier.scope,
        workspace: earlier.workspace,
        scoringModelVersion: earlierModelVersion,
        healthScore: earlierScore,
        healthStatus: earlierStatus
      },
      later: {
        _id: later._id,
        generatedAt: laterTime.toISOString(),
        createdBy: later.createdBy,
        scope: later.scope,
        workspace: later.workspace,
        scoringModelVersion: laterModelVersion,
        healthScore: laterScore,
        healthStatus: laterStatus
      },
      elapsedDays,
      elapsedHours,
      elapsedMinutes,
      elapsedTimeFormatted
    },
    healthScoreComparison: {
      earlierScore,
      laterScore,
      scoreDelta,
      scoreDirection,
      earlierStatus,
      laterStatus,
      scoringModelsCompatible,
      compatibilityNote
    },
    dimensionsComparison,
    comparableDimensionsCount,
    metricsComparison,
    findingsComparison: {
      newlyDetected,
      newlyDetectedCount: newlyDetected.length,
      noLongerDetected,
      noLongerDetectedCount: noLongerDetected.length,
      persisting,
      persistingCount: persisting.length,
      persistingCriticalCount: persisting.filter((p) => p.currentSeverity === 'critical').length,
      earlierTotalCount: earlierFindings.length,
      laterTotalCount: laterFindings.length,
      laterCriticalCount: laterFindings.filter((f) => f.severity === 'critical').length,
      laterWarningCount: laterFindings.filter((f) => f.severity === 'warning').length
    },
    summaryStatements
  };
};

module.exports = {
  compareReports,
  calculatePercentChange,
  getFindingKey,
  normalizeFinding,
  METRIC_SPECS,
  DIMENSION_KEYS
};
