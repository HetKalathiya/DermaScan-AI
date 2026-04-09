const express = require('express');
const router = express.Router();
const { getUserConsultations } = require('../controllers/consultation.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, getUserConsultations);

module.exports = router;
