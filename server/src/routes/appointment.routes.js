const express = require('express');
const router = express.Router();
const { bookAppointment, getMyAppointments, cancelAppointment } = require('../controllers/consultation.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, bookAppointment);
router.get('/', protect, getMyAppointments);
router.delete('/:id', protect, cancelAppointment);

module.exports = router;
