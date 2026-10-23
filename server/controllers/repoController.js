const mongoose = require('mongoose');
const SavedRepository = require('../models/SavedRepository');
const githubService = require('../services/githubService');
const analysisService = require('../services/analysisService');

/**
 * Parses repository identifier from input.
 * Accepts:
 * - "owner", "repo" separate strings
 * - "owner/repo" full name string
 * - "https://github.com/owner/repo" or "http://github.com/owner/repo"
 */
const parseRepoInput = (body = {}, query = {}) => {
  let owner = body.owner || query.owner;
  let repo = body.repo || query.repo;
  const input = body.url || body.repoIdentifier || query.url;

  if (input && typeof input === 'string') {
    const cleaned = input.trim().replace(/\/$/, ''); // Remove trailing slash
    // Check if it's a full GitHub URL
    const urlMatch = cleaned.match(/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
    if (urlMatch) {
      owner = urlMatch[1];
      repo = urlMatch[2];
    } else if (cleaned.includes('/')) {
      const parts = cleaned.split('/');
      if (parts.length === 2) {
        owner = parts[0];
        repo = parts[1];
      }
    }
  }

  return { owner, repo };
};

/**
 * Save a public repository to user's dashboard
 * POST /api/repos
 */
const saveRepo = async (req, res, next) => {
  try {
    const { owner, repo } = parseRepoInput(req.body);

    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REPO_INPUT',
          message: 'Repository owner and name are required. Provide { owner, repo } or a valid GitHub URL.'
        }
      });
    }

    // 1. Verify existence & accessibility on GitHub REST API
    let metadata;
    try {
      metadata = await githubService.getRepoMetadata(owner, repo);
    } catch (apiError) {
      return res.status(apiError.statusCode || 400).json({
        success: false,
        error: {
          code: apiError.code || 'GITHUB_ERROR',
          message: apiError.message,
          details: apiError.details
        }
      });
    }

    // 2. Check if already saved by this user in personal scope
    const existing = await SavedRepository.findOne({
      user: req.user.id,
      fullName: metadata.fullName,
      scope: 'personal'
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'REPO_ALREADY_SAVED',
          message: `Repository "${metadata.fullName}" is already saved to your dashboard.`
        }
      });
    }

    // 3. Save to database
    const saved = await SavedRepository.create({
      user: req.user.id,
      scope: 'personal',
      owner: metadata.owner,
      repo: metadata.repo,
      fullName: metadata.fullName,
      url: metadata.url,
      description: metadata.description,
      stars: metadata.stars,
      forks: metadata.forks,
      openIssuesCount: metadata.openIssuesCount,
      defaultBranch: metadata.defaultBranch
    });

    return res.status(201).json({
      success: true,
      data: {
        repository: saved
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * List current user's saved repositories
 * GET /api/repos
 */
const getSavedRepos = async (req, res, next) => {
  try {
    const repos = await SavedRepository.find({
      user: req.user.id,
      scope: 'personal'
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        repositories: repos
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * View repository health analysis
 * GET /api/repos/:id/health
 */
const getSavedRepoHealth = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid repository identifier format.'
        }
      });
    }

    // Find saved repo ensuring strict personal ownership
    const savedRepo = await SavedRepository.findOne({
      _id: id,
      user: req.user.id,
      scope: 'personal'
    });

    if (!savedRepo) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPO_NOT_FOUND',
          message: 'Saved repository not found on your dashboard.'
        }
      });
    }

    // Fetch live GitHub data
    let rawData;
    try {
      rawData = await githubService.getRawRepoData(savedRepo.owner, savedRepo.repo);
    } catch (apiError) {
      return res.status(apiError.statusCode || 502).json({
        success: false,
        error: {
          code: apiError.code || 'GITHUB_ERROR',
          message: apiError.message,
          details: apiError.details
        }
      });
    }

    // Compute deterministic health & bottlenecks
    const analysis = analysisService.analyzeRepository(rawData);

    // Update cached metadata on the saved model
    savedRepo.stars = rawData.metadata.stars;
    savedRepo.forks = rawData.metadata.forks;
    savedRepo.openIssuesCount = rawData.metadata.openIssuesCount;
    savedRepo.description = rawData.metadata.description;
    await savedRepo.save();

    return res.status(200).json({
      success: true,
      data: {
        savedRepository: savedRepo,
        analysis
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Analyze any public repository directly without requiring saving
 * POST /api/repos/analyze
 */
const analyzeRepoDirect = async (req, res, next) => {
  try {
    const { owner, repo } = parseRepoInput(req.body, req.query);

    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REPO_INPUT',
          message: 'Repository owner and name are required.'
        }
      });
    }

    let rawData;
    try {
      rawData = await githubService.getRawRepoData(owner, repo);
    } catch (apiError) {
      return res.status(apiError.statusCode || 502).json({
        success: false,
        error: {
          code: apiError.code || 'GITHUB_ERROR',
          message: apiError.message,
          details: apiError.details
        }
      });
    }

    const analysis = analysisService.analyzeRepository(rawData);

    return res.status(200).json({
      success: true,
      data: {
        analysis
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a repository from user's saved list
 * DELETE /api/repos/:id
 */
const deleteSavedRepo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid repository identifier format.'
        }
      });
    }

    // Verify personal ownership before deleting
    const deleted = await SavedRepository.findOneAndDelete({
      _id: id,
      user: req.user.id,
      scope: 'personal'
    });

    if (!deleted) {
      // Check if it exists under another user or workspace to prevent leaking status
      const existsElsewhere = await SavedRepository.findById(id);
      if (existsElsewhere) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You are not authorized to delete this saved repository.'
          }
        });
      }

      return res.status(404).json({
        success: false,
        error: {
          code: 'REPO_NOT_FOUND',
          message: 'Saved repository not found.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        message: `Repository "${deleted.fullName}" removed from your dashboard.`
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  saveRepo,
  getSavedRepos,
  getSavedRepoHealth,
  analyzeRepoDirect,
  deleteSavedRepo
};
