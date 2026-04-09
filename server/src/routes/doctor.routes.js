const express = require('express');
const router = express.Router();
const { getDoctors, verifyDoctor } = require('../controllers/doctor.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/', getDoctors);
module.exports = router;
