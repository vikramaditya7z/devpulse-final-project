const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');

/**
 * Middleware ensuring the authenticated user is an active member of the target workspace.
 * Resolves workspace and membership from database and attaches them to `req.workspace` and `req.membership`.
 */
const requireWorkspaceMember = async (req, res, next) => {
  try {
    const workspaceId = req.params.id || req.params.workspaceId;

    if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WORKSPACE_ID',
          message: 'Invalid workspace identifier format.'
        }
      });
    }

    // 1. Verify workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WORKSPACE_NOT_FOUND',
          message: 'The requested workspace does not exist.'
        }
      });
    }

    // 2. Verify authenticated user has membership record
    const membership = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: req.user.id
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_A_WORKSPACE_MEMBER',
          message: 'You are not an authorized member of this workspace.'
        }
      });
    }

    // 3. Attach verified database records to request
    req.workspace = workspace;
    req.membership = membership;

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Middleware ensuring the authenticated user has the 'owner' role in the target workspace.
 * Must be preceded by `requireWorkspaceMember`.
 */
const requireWorkspaceOwner = (req, res, next) => {
  if (!req.membership || req.membership.role !== 'owner') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'OWNER_ROLE_REQUIRED',
        message: 'Only the workspace owner is authorized to perform this operation.'
      }
    });
  }
  return next();
};

module.exports = {
  requireWorkspaceMember,
  requireWorkspaceOwner
};
