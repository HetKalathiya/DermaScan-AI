const express = require('express');
const router = express.Router();
const { getPatientHistory } = require('../controllers/patient.controller');
const { protect, doctor } = require('../middlewares/auth.middleware');

router.use(protect, doctor); // Assuming only doctors can see patient history

router.get('/:id/history', getPatientHistory);

module.exports = router;
