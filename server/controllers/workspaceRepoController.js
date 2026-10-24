const mongoose = require('mongoose');
const SavedRepository = require('../models/SavedRepository');
const HealthReport = require('../models/HealthReport');
const githubService = require('../services/githubService');
const analysisService = require('../services/analysisService');

/**
 * Parses repository identifier from input body or query.
 */
const parseRepoInput = (body = {}, query = {}) => {
  let owner = body.owner || query.owner;
  let repo = body.repo || query.repo;
  const input = body.url || body.repoIdentifier || query.url;

  if (input && typeof input === 'string') {
    const cleaned = input.trim().replace(/\/$/, '');
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
 * List all repositories shared with a workspace
 * GET /api/workspaces/:id/repos
 * Protected by requireWorkspaceMember
 */
const getWorkspaceRepos = async (req, res, next) => {
  try {
    const repos = await SavedRepository.find({
      workspace: req.workspace._id,
      scope: 'workspace'
    })
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 });

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
 * Add a public GitHub repository to the workspace
 * POST /api/workspaces/:id/repos
 * Protected by requireWorkspaceMember (Any member can add repos)
 */
const addWorkspaceRepo = async (req, res, next) => {
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

    // 2. Prevent duplicate entries in the same workspace
    const existing = await SavedRepository.findOne({
      workspace: req.workspace._id,
      fullName: metadata.fullName,
      scope: 'workspace'
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'REPO_ALREADY_IN_WORKSPACE',
          message: `Repository "${metadata.fullName}" is already added to this workspace.`
        }
      });
    }

    // 3. Save workspace repository
    const saved = await SavedRepository.create({
      workspace: req.workspace._id,
      scope: 'workspace',
      addedBy: req.user.id,
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
 * Remove a repository from the workspace
 * DELETE /api/workspaces/:id/repos/:repoId
 * Protected by requireWorkspaceMember + requireWorkspaceOwner (Owner manages workspace resources)
 */
const deleteWorkspaceRepo = async (req, res, next) => {
  try {
    const { repoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(repoId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REPO_ID',
          message: 'Invalid repository identifier format.'
        }
      });
    }

    const deleted = await SavedRepository.findOneAndDelete({
      _id: repoId,
      workspace: req.workspace._id,
      scope: 'workspace'
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPO_NOT_FOUND',
          message: 'Repository not found in this workspace.'
        }
      });
    }

    // Cascade delete any persistent health reports associated with this repository in this workspace
    await HealthReport.deleteMany({
      workspace: req.workspace._id,
      scope: 'workspace',
      'repository.fullName': new RegExp(`^${deleted.fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    });

    return res.status(200).json({
      success: true,
      data: {
        message: `Repository "${deleted.fullName}" and its associated workspace reports removed from workspace.`
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * View live health analysis for a workspace repository
 * GET /api/workspaces/:id/repos/:repoId/health
 * Protected by requireWorkspaceMember
 */
const getWorkspaceRepoHealth = async (req, res, next) => {
  try {
    const { repoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(repoId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REPO_ID',
          message: 'Invalid repository identifier format.'
        }
      });
    }

    const repo = await SavedRepository.findOne({
      _id: repoId,
      workspace: req.workspace._id,
      scope: 'workspace'
    });

    if (!repo) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPO_NOT_FOUND',
          message: 'Repository not found in this workspace.'
        }
      });
    }

    // Fetch live GitHub data
    let rawData;
    try {
      rawData = await githubService.getRawRepoData(repo.owner, repo.repo);
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

    // Deterministic analysis
    const analysis = analysisService.analyzeRepository(rawData);

    // Update cached repository vitals
    repo.stars = rawData.metadata.stars;
    repo.forks = rawData.metadata.forks;
    repo.openIssuesCount = rawData.metadata.openIssuesCount;
    repo.description = rawData.metadata.description;
    await repo.save();

    return res.status(200).json({
      success: true,
      data: {
        repository: repo,
        analysis
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getWorkspaceRepos,
  addWorkspaceRepo,
  deleteWorkspaceRepo,
  getWorkspaceRepoHealth
};
