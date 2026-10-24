const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const workspaceRepoController = require('../controllers/workspaceRepoController');
const inviteController = require('../controllers/inviteController');
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireWorkspaceMember, requireWorkspaceOwner } = require('../middlewares/rbacMiddleware');

// All workspace operations require user authentication
router.use(requireAuth);

// Base workspace collections
router.post('/', workspaceController.createWorkspace);
router.get('/', workspaceController.getUserWorkspaces);

// Single workspace operations (require active membership)
router.get('/:id/overview', requireWorkspaceMember, workspaceController.getWorkspaceOverview);
router.get('/:id', requireWorkspaceMember, workspaceController.getWorkspaceDetails);
router.get('/:id/members', requireWorkspaceMember, workspaceController.listMembers);
router.post('/:id/leave', requireWorkspaceMember, workspaceController.leaveWorkspace);

// Owner-only workspace management
router.patch('/:id', requireWorkspaceMember, requireWorkspaceOwner, workspaceController.renameWorkspace);
router.delete('/:id', requireWorkspaceMember, requireWorkspaceOwner, workspaceController.deleteWorkspace);
router.delete('/:id/members/:userId', requireWorkspaceMember, requireWorkspaceOwner, workspaceController.removeMember);

// Owner-only invitation management
router.post('/:id/invitations', requireWorkspaceMember, requireWorkspaceOwner, inviteController.createInvitation);
router.get('/:id/invitations', requireWorkspaceMember, requireWorkspaceOwner, inviteController.listPendingInvitations);
router.delete('/:id/invitations/:inviteId', requireWorkspaceMember, requireWorkspaceOwner, inviteController.revokeInvitation);

// Workspace Repositories Management
router.get('/:id/repos', requireWorkspaceMember, workspaceRepoController.getWorkspaceRepos);
router.post('/:id/repos', requireWorkspaceMember, workspaceRepoController.addWorkspaceRepo);
router.get('/:id/repos/:repoId/health', requireWorkspaceMember, workspaceRepoController.getWorkspaceRepoHealth);
router.delete('/:id/repos/:repoId', requireWorkspaceMember, requireWorkspaceOwner, workspaceRepoController.deleteWorkspaceRepo);

// Workspace Persistent Health Reports
router.post('/:id/reports', requireWorkspaceMember, reportController.generateWorkspaceReport);
router.get('/:id/reports', requireWorkspaceMember, reportController.getWorkspaceReports);
router.get('/:id/reports/:reportId', requireWorkspaceMember, reportController.getWorkspaceReportById);
router.delete('/:id/reports/:reportId', requireWorkspaceMember, requireWorkspaceOwner, reportController.deleteWorkspaceReport);
router.put('/:id/reports/:reportId', requireWorkspaceMember, reportController.rejectReportMutation);
router.patch('/:id/reports/:reportId', requireWorkspaceMember, reportController.rejectReportMutation);

module.exports = router;
