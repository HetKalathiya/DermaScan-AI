const express = require('express');
const router = express.Router();
const { getPatientHistory, getPatientDetail } = require('../controllers/patient.controller');
const { protect, doctor } = require('../middlewares/auth.middleware');

router.use(protect, doctor); // Only doctors can access patient data

router.get('/:id', getPatientDetail);           // GET /api/patients/:id
router.get('/:id/history', getPatientHistory);  // GET /api/patients/:id/history

module.exports = router;
