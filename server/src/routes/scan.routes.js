const express = require('express');
const router = express.Router();
const { uploadScan, getUserScans, deleteScan } = require('../controllers/scan.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.post('/upload', uploadScan);

// /me → returns scans for the logged-in patient (uses JWT, secure)
router.get('/me', (req, res, next) => {
  req.params.userId = req.user._id.toString();
  return getUserScans(req, res, next);
});

// /:userId kept for backward compat but now enforces ownership
router.get('/:userId', (req, res, next) => {
  // Only allow a user to fetch their own scans (or a doctor to fetch any)
  if (req.user.role !== 'doctor' && req.params.userId !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  return getUserScans(req, res, next);
});

// DELETE: only scan owner can delete
router.delete('/:id', deleteScan);

module.exports = router;
