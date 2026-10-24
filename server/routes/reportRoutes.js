const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middlewares/authMiddleware');

// All report routes require user authentication
router.use(requireAuth);

// Snapshot-to-snapshot comparison routes
router.get('/compare', reportController.compareReportsEndpoint);
router.post('/compare', reportController.compareReportsEndpoint);

// Query available snapshots for a specific repository
router.get('/repository-snapshots', reportController.getRepositorySnapshots);

// Personal persistent reports
router.post('/personal', reportController.generatePersonalReport);
router.get('/personal', reportController.getPersonalReports);
router.get('/personal/:id', reportController.getPersonalReportById);
router.delete('/personal/:id', reportController.deletePersonalReport);
router.put('/personal/:id', reportController.rejectReportMutation);
router.patch('/personal/:id', reportController.rejectReportMutation);

// Unified report view by ID (verifies personal privacy or workspace membership)
router.get('/:id', reportController.getReportById);

// Immutability protection: strictly reject mutation attempts
router.put('/:id', reportController.rejectReportMutation);
router.patch('/:id', reportController.rejectReportMutation);

module.exports = router;
