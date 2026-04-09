const express = require('express');
const router = express.Router();
const { getDoctorConsultations, updateDoctorConsultation } = require('../controllers/consultation.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, getDoctorConsultations);
router.put('/:id', protect, updateDoctorConsultation);

module.exports = router;
