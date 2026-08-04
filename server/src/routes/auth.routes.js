const express = require('express');
const router = express.Router();
const { register, registerDoctor, login, loginPatient, loginDoctor } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/register-doctor', registerDoctor);
router.post('/login', login);
router.post('/login/patient', loginPatient);
router.post('/login/doctor', loginDoctor);

module.exports = router;
