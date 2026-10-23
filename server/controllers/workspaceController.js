const mongoose = require('mongoose');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const WorkspaceInvitation = require('../models/WorkspaceInvitation');
const SavedRepository = require('../models/SavedRepository');
const HealthReport = require('../models/HealthReport');

/**
 * Create a new workspace
 * POST /api/workspaces
 */
const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WORKSPACE_NAME',
          message: 'Workspace name is required and must be at least 2 characters.'
        }
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WORKSPACE_NAME_LENGTH',
          message: 'Workspace name must be between 2 and 80 characters long.'
        }
      });
    }

    // 1. Create Workspace
    const workspace = await Workspace.create({
      name: trimmedName,
      owner: req.user.id,
      description: typeof description === 'string' ? description.trim() : ''
    });

    // 2. Establish Owner Membership record
    await WorkspaceMember.create({
      workspace: workspace._id,
      user: req.user.id,
      role: 'owner',
      joinedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      data: {
        workspace
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * List all workspaces accessible to the authenticated user
 * GET /api/workspaces
 */
const getUserWorkspaces = async (req, res, next) => {
  try {
    const memberships = await WorkspaceMember.find({ user: req.user.id })
      .populate('workspace')
      .sort({ createdAt: -1 });

    // Filter out any orphaned memberships if a workspace was deleted
    const validMemberships = memberships.filter((m) => m.workspace != null);

    const workspaces = await Promise.all(
      validMemberships.map(async (m) => {
        const memberCount = await WorkspaceMember.countDocuments({ workspace: m.workspace._id });
        return {
          _id: m.workspace._id,
          name: m.workspace.name,
          description: m.workspace.description,
          owner: m.workspace.owner,
          role: m.role,
          memberCount,
          joinedAt: m.joinedAt,
          createdAt: m.workspace.createdAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        workspaces
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get details and members for a specific workspace
 * GET /api/workspaces/:id
 */
const getWorkspaceDetails = async (req, res, next) => {
  try {
    // req.workspace and req.membership attached by requireWorkspaceMember
    const members = await WorkspaceMember.find({ workspace: req.workspace._id })
      .populate('user', 'name email')
      .sort({ role: -1, joinedAt: 1 });

    return res.status(200).json({
      success: true,
      data: {
        workspace: req.workspace,
        role: req.membership.role,
        members
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Rename workspace
 * PATCH /api/workspaces/:id
 */
const renameWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WORKSPACE_NAME',
          message: 'Workspace name is required.'
        }
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WORKSPACE_NAME_LENGTH',
          message: 'Workspace name must be between 2 and 80 characters long.'
        }
      });
    }

    req.workspace.name = trimmedName;
    if (description !== undefined && typeof description === 'string') {
      req.workspace.description = description.trim();
    }
    await req.workspace.save();

    return res.status(200).json({
      success: true,
      data: {
        workspace: req.workspace
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete workspace and cascade-delete memberships and invitations
 * DELETE /api/workspaces/:id
 */
const deleteWorkspace = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;

    // 1. Delete Workspace
    await Workspace.findByIdAndDelete(workspaceId);

    // 2. Cascade delete memberships
    await WorkspaceMember.deleteMany({ workspace: workspaceId });

    // 3. Cascade delete invitations
    await WorkspaceInvitation.deleteMany({ workspace: workspaceId });

    // 4. Cascade delete workspace repositories
    await SavedRepository.deleteMany({ workspace: workspaceId, scope: 'workspace' });

    // 5. Cascade delete workspace health reports
    await HealthReport.deleteMany({ workspace: workspaceId, scope: 'workspace' });

    return res.status(200).json({
      success: true,
      data: {
        message: `Workspace "${req.workspace.name}" and associated resources deleted successfully.`
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Remove a member from the workspace
 * DELETE /api/workspaces/:id/members/:userId
 */
const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Invalid user identifier format.'
        }
      });
    }

    // Prevent removing the workspace owner
    if (userId === req.user.id || userId === req.workspace.owner.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_REMOVE_OWNER',
          message: 'The workspace owner cannot be removed. To delete the workspace, use Delete Workspace.'
        }
      });
    }

    const deleted = await WorkspaceMember.findOneAndDelete({
      workspace: req.workspace._id,
      user: userId
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'The specified member was not found in this workspace.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        message: 'Member removed from workspace successfully.'
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Leave workspace (regular members only)
 * POST /api/workspaces/:id/leave
 */
const leaveWorkspace = async (req, res, next) => {
  try {
    if (req.membership.role === 'owner') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'OWNER_CANNOT_LEAVE',
          message: 'Workspace owners cannot leave their workspace. You must delete the workspace instead.'
        }
      });
    }

    await WorkspaceMember.findOneAndDelete({
      workspace: req.workspace._id,
      user: req.user.id
    });

    return res.status(200).json({
      success: true,
      data: {
        message: `You have successfully left "${req.workspace.name}".`
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * List workspace members
 * GET /api/workspaces/:id/members
 */
const listMembers = async (req, res, next) => {
  try {
    const members = await WorkspaceMember.find({ workspace: req.workspace._id })
      .populate('user', 'name email')
      .sort({ role: -1, joinedAt: 1 });

    return res.status(200).json({
      success: true,
      data: {
        members
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceDetails,
  renameWorkspace,
  deleteWorkspace,
  removeMember,
  leaveWorkspace,
  listMembers
};
