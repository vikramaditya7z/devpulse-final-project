const mongoose = require('mongoose');
const WorkspaceInvitation = require('../models/WorkspaceInvitation');
const WorkspaceMember = require('../models/WorkspaceMember');
const { generateSecureToken, hashToken, INVITATION_EXPIRY_MS } = require('../utils/crypto');
const { buildInviteUrl } = require('../utils/urlHelper');

/**
 * Generate a single-use 48h invitation link
 * POST /api/workspaces/:id/invitations
 * Protected by requireWorkspaceMember + requireWorkspaceOwner
 */
const createInvitation = async (req, res, next) => {
  try {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);

    const invitation = await WorkspaceInvitation.create({
      workspace: req.workspace._id,
      invitedBy: req.user.id,
      tokenHash,
      expiresAt,
      status: 'pending'
    });

    const inviteUrl = buildInviteUrl(rawToken, req);

    return res.status(201).json({
      success: true,
      data: {
        invitation: {
          _id: invitation._id,
          workspaceId: req.workspace._id,
          workspaceName: req.workspace.name,
          expiresAt: invitation.expiresAt,
          status: invitation.status,
          inviteUrl,
          rawToken
        }
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * List active pending invitations for a workspace
 * GET /api/workspaces/:id/invitations
 * Protected by requireWorkspaceMember + requireWorkspaceOwner
 */
const listPendingInvitations = async (req, res, next) => {
  try {
    const invitations = await WorkspaceInvitation.find({
      workspace: req.workspace._id,
      status: 'pending'
    })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });

    const now = new Date();
    const formatted = invitations.map((inv) => ({
      _id: inv._id,
      workspace: inv.workspace,
      invitedBy: inv.invitedBy,
      expiresAt: inv.expiresAt,
      status: inv.expiresAt < now ? 'expired' : inv.status,
      isExpired: inv.expiresAt < now,
      createdAt: inv.createdAt
    }));

    return res.status(200).json({
      success: true,
      data: {
        invitations: formatted
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Revoke an active invitation
 * DELETE /api/workspaces/:id/invitations/:inviteId
 * Protected by requireWorkspaceMember + requireWorkspaceOwner
 */
const revokeInvitation = async (req, res, next) => {
  try {
    const { inviteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(inviteId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INVITE_ID',
          message: 'Invalid invitation identifier format.'
        }
      });
    }

    const invitation = await WorkspaceInvitation.findOne({
      _id: inviteId,
      workspace: req.workspace._id
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INVITATION_NOT_FOUND',
          message: 'Invitation not found in this workspace.'
        }
      });
    }

    if (invitation.status === 'accepted') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVITATION_ALREADY_ACCEPTED',
          message: 'Cannot revoke an invitation that has already been accepted.'
        }
      });
    }

    invitation.status = 'revoked';
    invitation.revokedAt = new Date();
    await invitation.save();

    return res.status(200).json({
      success: true,
      data: {
        message: 'Invitation link has been revoked successfully.'
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Preview / validate an invitation token
 * GET /api/invitations/validate/:token
 */
const validateInvitationToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Invitation token is missing or malformed.'
        }
      });
    }

    const tokenHash = hashToken(token.trim());

    // Search by SHA-256 hash (never query by raw token)
    const invitation = await WorkspaceInvitation.findOne({ tokenHash })
      .populate('workspace', 'name description')
      .populate('invitedBy', 'name');

    if (!invitation || !invitation.workspace) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INVALID_INVITATION',
          message: 'This invitation link is invalid or does not exist.'
        }
      });
    }

    if (invitation.status === 'revoked') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVITATION_REVOKED',
          message: 'This invitation link has been revoked by the workspace owner.'
        }
      });
    }

    if (invitation.status === 'accepted') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVITATION_ALREADY_USED',
          message: 'This single-use invitation link has already been accepted.'
        }
      });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVITATION_EXPIRED',
          message: 'This invitation link has expired (48-hour limit exceeded). Please request a new invitation.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        valid: true,
        workspace: {
          _id: invitation.workspace._id,
          name: invitation.workspace.name,
          description: invitation.workspace.description
        },
        invitedBy: {
          name: invitation.invitedBy?.name || 'A team member'
        },
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Accept an invitation and join workspace
 * POST /api/invitations/accept
 * Protected by requireAuth
 */
const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_INVITATION_TOKEN',
          message: 'Invitation token is required.'
        }
      });
    }

    const tokenHash = hashToken(token.trim());

    const invitation = await WorkspaceInvitation.findOne({ tokenHash });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INVALID_INVITATION',
          message: 'This invitation link is invalid.'
        }
      });
    }

    if (invitation.status === 'revoked') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVITATION_REVOKED',
          message: 'This invitation link has been revoked by the workspace owner.'
        }
      });
    }

    if (invitation.status === 'accepted') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVITATION_ALREADY_USED',
          message: 'This single-use invitation has already been accepted.'
        }
      });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVITATION_EXPIRED',
          message: 'This invitation link has expired (48-hour limit exceeded).'
        }
      });
    }

    // Check if user is already a member
    const existingMembership = await WorkspaceMember.findOne({
      workspace: invitation.workspace,
      user: req.user.id
    });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_MEMBER',
          message: 'You are already an active member of this workspace.'
        }
      });
    }

    // Add user as Member
    await WorkspaceMember.create({
      workspace: invitation.workspace,
      user: req.user.id,
      role: 'member',
      joinedAt: new Date()
    });

    // Mark invitation accepted and record user
    invitation.status = 'accepted';
    invitation.acceptedBy = req.user.id;
    invitation.acceptedAt = new Date();
    await invitation.save();

    return res.status(200).json({
      success: true,
      data: {
        message: 'You have successfully joined the workspace.',
        workspaceId: invitation.workspace
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createInvitation,
  listPendingInvitations,
  revokeInvitation,
  validateInvitationToken,
  acceptInvitation
};
