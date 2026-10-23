const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middlewares/authMiddleware');

// All report routes require user authentication
router.use(requireAuth);

// Personal persistent reports
router.post('/personal', reportController.generatePersonalReport);
router.get('/personal', reportController.getPersonalReports);
router.get('/personal/:id', reportController.getPersonalReportById);
router.delete('/personal/:id', reportController.deletePersonalReport);

// Unified report view by ID (verifies personal privacy or workspace membership)
router.get('/:id', reportController.getReportById);

module.exports = router;
