const express = require('express');
const router = express.Router();
const { createConsultation } = require('../controllers/consultation.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createConsultation);

module.exports = router;
