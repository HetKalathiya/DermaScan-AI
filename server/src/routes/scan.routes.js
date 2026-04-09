const express = require('express');
const router = express.Router();
const { uploadScan, getUserScans, deleteScan } = require('../controllers/scan.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.post('/upload', uploadScan);
router.get('/:userId', getUserScans);
router.delete('/:id', deleteScan);

module.exports = router;
