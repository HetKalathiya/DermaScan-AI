const express = require('express');
const router = express.Router();
const { createConsultation } = require('../controllers/consultation.controller');
const { protect, requireVerified } = require('../middlewares/auth.middleware');

router.post('/', protect, requireVerified, createConsultation);

module.exports = router;
