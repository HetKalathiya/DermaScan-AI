const express = require('express');
const router = express.Router();
const { getAvailableSlots, bookAppointment, getMyAppointments, cancelAppointment } = require('../controllers/consultation.controller');
const { protect, requireVerified } = require('../middlewares/auth.middleware');

router.get('/slots/:doctorId', protect, getAvailableSlots);
router.post('/', protect, requireVerified, bookAppointment);
router.get('/', protect, getMyAppointments);
router.delete('/:id', protect, cancelAppointment);

module.exports = router;
