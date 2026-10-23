/**
 * DevPulse - GitHub REST API Service
 * Integrates directly with https://api.github.com to fetch real public repository data.
 */

// Simple in-memory cache with TTL (5 minutes)
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

class GitHubApiError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.name = 'GitHubApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Validates owner and repository names.
 * Standard GitHub username/org rules: alphanumeric, hyphens (no consecutive hyphens, no start/end with hyphen).
 * Repo name: alphanumeric, hyphens, underscores, dots.
 */
const validateRepoIdentifier = (owner, repo) => {
  if (!owner || typeof owner !== 'string' || !owner.trim()) {
    throw new GitHubApiError('Repository owner is required', 400, 'INVALID_OWNER');
  }
  if (!repo || typeof repo !== 'string' || !repo.trim()) {
    throw new GitHubApiError('Repository name is required', 400, 'INVALID_REPO');
  }

  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();

  // Basic sanity check to prevent path traversal or invalid characters
  const validOwnerRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  const validRepoRegex = /^[a-zA-Z0-9_.-]+$/;

  if (!validOwnerRegex.test(cleanOwner)) {
    throw new GitHubApiError(`Invalid repository owner format: "${cleanOwner}"`, 400, 'INVALID_OWNER_FORMAT');
  }
  if (!validRepoRegex.test(cleanRepo)) {
    throw new GitHubApiError(`Invalid repository name format: "${cleanRepo}"`, 400, 'INVALID_REPO_FORMAT');
  }

  return { owner: cleanOwner.toLowerCase(), repo: cleanRepo.toLowerCase() };
};

/**
 * Performs an HTTP request to the GitHub REST API v3 with timeout and rate limit checks.
 */
const fetchFromGitHub = async (endpoint, options = {}) => {
  const baseUrl = 'https://api.github.com';
  const url = `${baseUrl}${endpoint}`;

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'DevPulse-Health-Platform'
  };

  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken && githubToken.trim()) {
    headers['Authorization'] = `Bearer ${githubToken.trim()}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Extract rate limit metadata
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    const rateLimitReset = response.headers.get('x-ratelimit-reset');

    if (response.status === 404) {
      throw new GitHubApiError(
        'Public repository not found on GitHub. Verify that the owner and repository name are correct.',
        404,
        'REPO_NOT_FOUND'
      );
    }

    if (response.status === 403 || response.status === 429) {
      const resetDate = rateLimitReset ? new Date(parseInt(rateLimitReset, 10) * 1000).toISOString() : null;
      throw new GitHubApiError(
        `GitHub API rate limit exceeded. Limit resets at ${resetDate || 'a later time'}.`,
        429,
        'RATE_LIMIT_EXCEEDED',
        { rateLimitRemaining, resetAt: resetDate }
      );
    }

    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (e) {
        // ignore JSON parse error for error body
      }
      throw new GitHubApiError(
        errorBody?.message || `GitHub API request failed with status ${response.status}`,
        response.status,
        'GITHUB_API_ERROR',
        errorBody
      );
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new GitHubApiError('GitHub API request timed out (8s limit exceeded)', 504, 'TIMEOUT_ERROR');
    }
    if (err instanceof GitHubApiError) {
      throw err;
    }
    throw new GitHubApiError(`Failed to connect to GitHub API: ${err.message}`, 502, 'NETWORK_ERROR');
  }
};

/**
 * Fetches basic repository metadata and verifies public accessibility.
 */
const getRepoMetadata = async (owner, repo) => {
  const { owner: validOwner, repo: validRepo } = validateRepoIdentifier(owner, repo);
  const data = await fetchFromGitHub(`/repos/${validOwner}/${validRepo}`);

  if (data.private) {
    throw new GitHubApiError('DevPulse only supports public repositories in V1.', 400, 'PRIVATE_REPO_NOT_SUPPORTED');
  }

  return {
    owner: data.owner.login.toLowerCase(),
    repo: data.name.toLowerCase(),
    fullName: data.full_name.toLowerCase(),
    description: data.description || '',
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssuesCount: data.open_issues_count,
    defaultBranch: data.default_branch || 'main',
    url: data.html_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    pushedAt: data.pushed_at
  };
};

/**
 * Fetches full raw activity data for a repository:
 * - Metadata
 * - Open Issues (filtered from /issues)
 * - Open Pull Requests
 * - Closed/Merged Pull Requests
 * - Recent Commits (past 30 days)
 */
const getRawRepoData = async (owner, repo) => {
  const { owner: validOwner, repo: validRepo } = validateRepoIdentifier(owner, repo);
  const cacheKey = `${validOwner}/${validRepo}`;

  // Check TTL cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Fetch Repository Metadata
  const metadata = await getRepoMetadata(validOwner, validRepo);

  // 2. Fetch Open Issues & PRs in parallel
  // Calculate date 30 days ago for commit activity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [rawIssues, openPulls, closedPulls, commits] = await Promise.all([
    // Issues: max 100 per page, state open
    fetchFromGitHub(`/repos/${validOwner}/${validRepo}/issues?state=open&per_page=100`).catch((err) => {
      console.warn(`[GitHubService] Could not fetch open issues for ${validOwner}/${validRepo}: ${err.message}`);
      return [];
    }),
    // Open Pull Requests
    fetchFromGitHub(`/repos/${validOwner}/${validRepo}/pulls?state=open&per_page=100`).catch((err) => {
      console.warn(`[GitHubService] Could not fetch open PRs for ${validOwner}/${validRepo}: ${err.message}`);
      return [];
    }),
    // Closed Pull Requests (contains merged and unmerged)
    fetchFromGitHub(`/repos/${validOwner}/${validRepo}/pulls?state=closed&per_page=100`).catch((err) => {
      console.warn(`[GitHubService] Could not fetch closed PRs for ${validOwner}/${validRepo}: ${err.message}`);
      return [];
    }),
    // Recent default-branch Commits
    fetchFromGitHub(`/repos/${validOwner}/${validRepo}/commits?since=${thirtyDaysAgo}&per_page=100`).catch((err) => {
      console.warn(`[GitHubService] Could not fetch commits for ${validOwner}/${validRepo}: ${err.message}`);
      return [];
    })
  ]);

  // GitHub returns PRs in the issues endpoint; filter strictly for real issues
  const pureIssues = Array.isArray(rawIssues) ? rawIssues.filter((issue) => !issue.pull_request) : [];

  // For open pull requests, fetch review data for the oldest 5 PRs to check review inactivity
  // (Limiting to 5 avoids hitting rate limits when analyzing large repos)
  const openPullsWithReviews = await Promise.all(
    (Array.isArray(openPulls) ? openPulls.slice(0, 5) : []).map(async (pr) => {
      try {
        const reviews = await fetchFromGitHub(`/repos/${validOwner}/${validRepo}/pulls/${pr.number}/reviews`);
        return {
          ...pr,
          reviews: Array.isArray(reviews) ? reviews : [],
          reviewsAvailable: true
        };
      } catch (err) {
        // If reviews fail or rate limit hits, do not fail entire analysis; mark reviews as unavailable
        return {
          ...pr,
          reviews: [],
          reviewsAvailable: false
        };
      }
    })
  );

  // Combine fetched reviews with remaining open PRs (which have reviewsAvailable: false)
  const remainingOpenPulls = Array.isArray(openPulls)
    ? openPulls.slice(5).map((pr) => ({ ...pr, reviews: [], reviewsAvailable: false }))
    : [];
  const fullOpenPulls = [...openPullsWithReviews, ...remainingOpenPulls];

  const result = {
    metadata,
    issues: pureIssues,
    openPullRequests: fullOpenPulls,
    closedPullRequests: Array.isArray(closedPulls) ? closedPulls : [],
    recentCommits: Array.isArray(commits) ? commits : []
  };

  // Cache valid result
  cache.set(cacheKey, {
    timestamp: Date.now(),
    data: result
  });

  return result;
};

/**
 * Clear cache helper for testing
 */
const clearCache = () => {
  cache.clear();
};

module.exports = {
  GitHubApiError,
  validateRepoIdentifier,
  getRepoMetadata,
  getRawRepoData,
  clearCache
};
