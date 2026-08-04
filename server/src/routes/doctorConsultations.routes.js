const express = require('express');
const router = express.Router();
const {
    getDoctorConsultations,
    updateDoctorConsultation,
    claimConsultation,
    getConsultationMessages,
    getDoctorStats,
} = require('../controllers/consultation.controller');
const { protect, doctor } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/', getDoctorConsultations);
router.get('/stats', getDoctorStats);
router.put('/:id', updateDoctorConsultation);
router.post('/:id/claim', claimConsultation);
router.get('/:id/messages', getConsultationMessages);

module.exports = router;
