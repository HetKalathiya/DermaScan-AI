const express = require('express');
const router = express.Router();
const { bookAppointment } = require('../controllers/consultation.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, bookAppointment);

module.exports = router;
