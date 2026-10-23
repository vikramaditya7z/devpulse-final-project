const express = require('express');
const router = express.Router();
const repoController = require('../controllers/repoController');
const { requireAuth } = require('../middlewares/authMiddleware');

// All repository routes require authentication
router.use(requireAuth);

router.post('/', repoController.saveRepo);
router.get('/', repoController.getSavedRepos);
router.post('/analyze', repoController.analyzeRepoDirect);
router.get('/:id/health', repoController.getSavedRepoHealth);
router.delete('/:id', repoController.deleteSavedRepo);

module.exports = router;
