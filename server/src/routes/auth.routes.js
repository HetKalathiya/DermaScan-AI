const express = require('express');
const router = express.Router();
const {
  register,
  registerDoctor,
  login,
  loginPatient,
  loginDoctor,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  checkDoctorStatus,
} = require('../controllers/auth.controller');
const {
  authRegisterLimiter,
  otpVerifyLimiter,
  otpResendLimiter,
} = require('../middlewares/rateLimiter');

router.post('/register', authRegisterLimiter, register);
router.post('/register-doctor', authRegisterLimiter, registerDoctor);
router.post('/login', login);
router.post('/login/patient', loginPatient);
router.post('/login/doctor', loginDoctor);

// OTP routes
router.post('/verify-otp', otpVerifyLimiter, verifyOtp);
router.post('/resend-otp', otpResendLimiter, resendOtp);

// Password recovery routes
router.post('/forgot-password', otpResendLimiter, forgotPassword);
router.post('/verify-reset-otp', otpVerifyLimiter, verifyResetOtp);
router.post('/reset-password', otpVerifyLimiter, resetPassword);

// Doctor status check route
router.get('/doctor-status/:email', checkDoctorStatus);

module.exports = router;
