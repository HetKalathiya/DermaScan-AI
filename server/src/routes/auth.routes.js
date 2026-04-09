const express = require('express');
const router = express.Router();
const { register, registerDoctor, login } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/register-doctor', registerDoctor);
router.post('/login', login);

module.exports = router;
