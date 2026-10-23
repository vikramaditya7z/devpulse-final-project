const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/inviteController');
const { requireAuth } = require('../middlewares/authMiddleware');

// Public preview & validation of invitation token
router.get('/validate/:token', inviteController.validateInvitationToken);

// Accept invitation (requires authenticated session)
router.post('/accept', requireAuth, inviteController.acceptInvitation);

module.exports = router;
