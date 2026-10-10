const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const OtpVerification = require('../models/OtpVerification');
const { generateOtp, hashOtp, verifyOtpHash, maskEmail } = require('../utils/otp.util');
const { sendOtpEmail } = require('../services/email.service');
const logger = require('../utils/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

/**
 * Invalidate previous OTPs, generates a fresh 6-digit OTP, saves SHA-256 hash, and emails it.
 */
const issueAndSendOtp = async (user, purpose = 'registration') => {
  // Invalidate any existing active OTPs for this user and purpose
  await OtpVerification.deleteMany({ user_id: user._id, purpose });

  const rawOtp = generateOtp();
  const otp_hash = hashOtp(rawOtp);
  const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await OtpVerification.create({
    user_id: user._id,
    email: user.email.toLowerCase(),
    otp_hash,
    purpose,
    expires_at,
    attempts_count: 0,
    last_sent_at: new Date(),
  });

  // Dispatch email
  await sendOtpEmail(user.email, rawOtp, purpose);

  return {
    masked_email: maskEmail(user.email),
    expires_at,
  };
};

const register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      role,
      name,
      dob,
      gender,
      skin_type,
      phone,
      country,
      primary_concern,
      had_skin_cancer,
    } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Calculate age if dob provided
    let age = undefined;
    if (dob) {
      const birthDate = new Date(dob);
      if (!isNaN(birthDate.getTime())) {
        const diffMs = Date.now() - birthDate.getTime();
        age = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
      }
    }

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      if (userExists.is_verified) {
        return res.status(400).json({ success: false, error: 'Email already exists. Please log in.' });
      }

      // If user exists but is not verified, update credentials and re-issue OTP
      const salt = await bcrypt.genSalt(10);
      userExists.password_hash = await bcrypt.hash(password, salt);
      if (name) userExists.name = name;
      if (dob) userExists.dob = dob;
      if (age !== undefined) userExists.age = age;
      if (gender) userExists.gender = gender;
      if (phone) userExists.phone = phone;
      if (country) userExists.country = country;
      userExists.role = role || 'patient';
      await userExists.save();

      // Upsert patient health intake record
      await Patient.findOneAndUpdate(
        { user_id: userExists._id },
        {
          skin_type,
          primary_concern,
          had_skin_cancer: Boolean(had_skin_cancer),
        },
        { upsert: true, new: true }
      );

      await issueAndSendOtp(userExists, 'registration');

      return res.status(200).json({
        success: true,
        requires_verification: true,
        email: userExists.email,
        masked_email: maskEmail(userExists.email),
        role: userExists.role,
        message: 'Account pending verification. A fresh 6-digit code has been sent to your email.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: normalizedEmail,
      password_hash,
      role: role || 'patient',
      name,
      dob,
      age,
      gender,
      phone,
      country,
      is_verified: false,
    });

    await Patient.create({
      user_id: user._id,
      skin_type,
      primary_concern,
      had_skin_cancer: Boolean(had_skin_cancer),
    });

    await issueAndSendOtp(user, 'registration');

    res.status(201).json({
      success: true,
      requires_verification: true,
      email: user.email,
      masked_email: maskEmail(user.email),
      role: user.role,
      message: 'Registration successful. A 6-digit verification code was sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

const registerDoctor = async (req, res, next) => {
  try {
    const { name, email, password, specialization, license_number, hospital_name, experience } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      if (userExists.is_verified) {
        return res.status(400).json({ success: false, error: 'Email already exists. Please log in.' });
      }

      const salt = await bcrypt.genSalt(10);
      userExists.password_hash = await bcrypt.hash(password, salt);
      if (name) userExists.name = name;
      userExists.role = 'doctor';
      await userExists.save();

      await Doctor.findOneAndUpdate(
        { user_id: userExists._id },
        { specialization, license_number, hospital_name, experience },
        { upsert: true, new: true }
      );

      await issueAndSendOtp(userExists, 'registration');

      return res.status(200).json({
        success: true,
        requires_verification: true,
        email: userExists.email,
        masked_email: maskEmail(userExists.email),
        role: 'doctor',
        message: 'Doctor account pending verification. A 6-digit verification code was sent to your email.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: normalizedEmail,
      password_hash,
      role: 'doctor',
      name,
      is_verified: false,
    });

    await Doctor.create({
      user_id: user._id,
      specialization,
      license_number,
      hospital_name,
      experience,
    });

    await issueAndSendOtp(user, 'registration');

    res.status(201).json({
      success: true,
      requires_verification: true,
      email: user.email,
      masked_email: maskEmail(user.email),
      role: 'doctor',
      message: 'Doctor registered successfully. A 6-digit verification code was sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.findOne({ email: normalizedEmail });

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      // Role validation for frontend matching
      if (role && user.role !== role) {
        return res.status(403).json({ success: false, error: `Access denied. Not a ${role} account.` });
      }

      // Check account active status
      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          error: 'Your account has been suspended. Please contact DermaScan AI support.',
        });
      }

      // Auto-verify admin account; exempt admin from OTP verification
      if (user.role === 'admin') {
        if (!user.is_verified) {
          user.is_verified = true;
          await user.save();
        }
      } else if (!user.is_verified) {
        // Enforce email verification for non-admin accounts
        await issueAndSendOtp(user, 'registration');
        return res.status(403).json({
          success: false,
          requires_verification: true,
          email: user.email,
          masked_email: maskEmail(user.email),
          role: user.role,
          message: 'Your email address has not been verified yet. A fresh 6-digit verification code has been sent to your email.',
        });
      }

      // Enforce Doctor Credential Approval Gate
      if (user.role === 'doctor') {
        const doctorRecord = await Doctor.findOne({ user_id: user._id });
        if (!doctorRecord || !doctorRecord.verified) {
          return res.status(403).json({
            success: false,
            code: 'DOCTOR_PENDING_APPROVAL',
            requires_approval: true,
            message: 'Your medical credentials are under administrative review. Once verified by our medical board, your account will be activated.',
            doctor: doctorRecord ? {
              license_number: doctorRecord.license_number,
              hospital_name: doctorRecord.hospital_name,
              specialization: doctorRecord.specialization,
              experience: doctorRecord.experience,
              verified: false,
            } : null,
          });
        }
      }

      // Enforce Two-Factor Authentication if enabled
      if (user.two_factor_enabled && user.role !== 'admin') {
        const otpInfo = await issueAndSendOtp(user, '2fa');
        return res.status(200).json({
          success: true,
          requires_2fa: true,
          email: user.email,
          masked_email: otpInfo.masked_email,
          role: user.role,
          message: 'Two-Factor Authentication code sent to your email.',
        });
      }

      res.json({
        success: true,
        auth: true,
        message: 'Login successful',
        token: generateToken(user._id),
        user: { 
          id: user._id, 
          email: user.email, 
          role: user.role, 
          name: user.name, 
          is_verified: user.is_verified,
          two_factor_enabled: Boolean(user.two_factor_enabled),
        },
        data: {
          _id: user._id,
          email: user.email,
          role: user.role,
          is_verified: user.is_verified,
          two_factor_enabled: Boolean(user.two_factor_enabled),
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (error) {
    next(error);
  }
};

// Dedicated patient login — always enforces role === 'patient'
const loginPatient = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        error: `This email is registered as a ${user.role} account. Please use the correct login page.`,
      });
    }

    // Check account active status
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended. Please contact DermaScan AI support.',
      });
    }

    // Enforce email verification
    if (!user.is_verified) {
      await issueAndSendOtp(user, 'registration');
      return res.status(403).json({
        success: false,
        requires_verification: true,
        email: user.email,
        masked_email: maskEmail(user.email),
        role: 'patient',
        message: 'Your email address has not been verified yet. A fresh 6-digit verification code has been sent to your email.',
      });
    }

      // Enforce Two-Factor Authentication if enabled
      if (user.two_factor_enabled) {
        const otpInfo = await issueAndSendOtp(user, '2fa');
        return res.status(200).json({
          success: true,
          requires_2fa: true,
          email: user.email,
          masked_email: otpInfo.masked_email,
          role: 'patient',
          message: 'Two-Factor Authentication code sent to your email.',
        });
      }

      res.json({
        success: true,
        auth: true,
        message: 'Patient login successful',
        token: generateToken(user._id),
        user: { 
          id: user._id, 
          email: user.email, 
          role: user.role, 
          name: user.name, 
          is_verified: user.is_verified,
          two_factor_enabled: Boolean(user.two_factor_enabled),
        },
        data: { 
          _id: user._id, 
          email: user.email, 
          role: user.role, 
          is_verified: user.is_verified, 
          two_factor_enabled: Boolean(user.two_factor_enabled),
          token: generateToken(user._id) 
        },
      });
  } catch (error) {
    next(error);
  }
};

// Dedicated doctor login — always enforces role === 'doctor'
const loginDoctor = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: `This email is registered as a ${user.role} account. Please use the correct login page.`,
      });
    }

    // Check account active status
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended. Please contact DermaScan AI support.',
      });
    }

    // Enforce email verification
    if (!user.is_verified) {
      await issueAndSendOtp(user, 'registration');
      return res.status(403).json({
        success: false,
        requires_verification: true,
        email: user.email,
        masked_email: maskEmail(user.email),
        role: 'doctor',
        message: 'Your email address has not been verified yet. A fresh 6-digit verification code has been sent to your email.',
      });
    }

    // Enforce Doctor Credential Approval Gate
    const doctorRecord = await Doctor.findOne({ user_id: user._id });
    if (!doctorRecord || !doctorRecord.verified) {
      return res.status(403).json({
        success: false,
        code: 'DOCTOR_PENDING_APPROVAL',
        requires_approval: true,
        message: 'Your medical credentials are under administrative review. Once verified by our medical board, your account will be activated.',
        doctor: doctorRecord ? {
          license_number: doctorRecord.license_number,
          hospital_name: doctorRecord.hospital_name,
          specialization: doctorRecord.specialization,
          experience: doctorRecord.experience,
          verified: false,
        } : null,
      });
    }

    // Enforce Two-Factor Authentication if enabled
    if (user.two_factor_enabled) {
      const otpInfo = await issueAndSendOtp(user, '2fa');
      return res.status(200).json({
        success: true,
        requires_2fa: true,
        email: user.email,
        masked_email: otpInfo.masked_email,
        role: 'doctor',
        message: 'Two-Factor Authentication code sent to your email.',
      });
    }

    res.json({
      success: true,
      auth: true,
      message: 'Doctor login successful',
      token: generateToken(user._id),
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role, 
        name: user.name, 
        is_verified: user.is_verified,
        two_factor_enabled: Boolean(user.two_factor_enabled),
      },
      doctor: {
        id: doctorRecord._id,
        specialization: doctorRecord.specialization,
        license_number: doctorRecord.license_number,
        hospital_name: doctorRecord.hospital_name,
        verified: doctorRecord.verified,
      },
      data: { 
        _id: user._id, 
        email: user.email, 
        role: user.role, 
        is_verified: user.is_verified, 
        two_factor_enabled: Boolean(user.two_factor_enabled),
        token: generateToken(user._id) 
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify 6-digit OTP endpoint
 * Body: { email, otp, purpose = 'registration' }
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, purpose = 'registration' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        error: 'Email and 6-digit verification code are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_FORMAT',
        error: 'Please enter a valid 6-digit numeric verification code.',
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({
        success: false,
        code: 'OTP_INVALID',
        error: 'Invalid or expired verification code.',
      });
    }

    if (purpose === 'registration' && user.is_verified) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_VERIFIED',
        error: 'Your email is already verified. Please sign in.',
      });
    }

    const otpRecord = await OtpVerification.findOne({
      user_id: user._id,
      purpose,
    }).sort({ created_at: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        code: 'OTP_NOT_FOUND',
        error: 'No active verification code found. Please request a new code.',
      });
    }

    // Check maximum attempts (5 failed attempts)
    if (otpRecord.attempts_count >= 5) {
      return res.status(429).json({
        success: false,
        code: 'MAX_ATTEMPTS_EXCEEDED',
        error: 'Too many incorrect attempts. For security, this code is locked. Please request a new verification code.',
      });
    }

    // Check expiration (10 minutes)
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({
        success: false,
        code: 'OTP_EXPIRED',
        error: 'This verification code has expired. Please click resend to get a new code.',
      });
    }

    // Validate hash
    const isMatch = verifyOtpHash(cleanOtp, otpRecord.otp_hash);

    if (!isMatch) {
      otpRecord.attempts_count += 1;
      await otpRecord.save();

      const remaining = 5 - otpRecord.attempts_count;

      if (remaining <= 0) {
        return res.status(429).json({
          success: false,
          code: 'MAX_ATTEMPTS_EXCEEDED',
          error: 'Too many incorrect attempts. This code is now invalid. Please request a new verification code.',
          remaining_attempts: 0,
        });
      }

      return res.status(400).json({
        success: false,
        code: 'OTP_INVALID',
        error: `Incorrect verification code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`,
        remaining_attempts: remaining,
      });
    }

    // Success: Mark verified and clear OTP records
    user.is_verified = true;
    await user.save();

    await OtpVerification.deleteMany({ user_id: user._id, purpose });

    let doctorData = null;
    if (user.role === 'doctor') {
      const doctorRecord = await Doctor.findOne({ user_id: user._id });
      if (doctorRecord) {
        doctorData = {
          id: doctorRecord._id,
          verified: doctorRecord.verified,
          specialization: doctorRecord.specialization,
          license_number: doctorRecord.license_number,
          hospital_name: doctorRecord.hospital_name,
        };
      }
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: purpose === '2fa' ? 'Two-Factor Authentication verified successfully!' : 'Email successfully verified!',
      token,
      doctor: doctorData,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        is_verified: true,
        two_factor_enabled: Boolean(user.two_factor_enabled),
        doctor: doctorData,
      },
      data: {
        _id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        is_verified: true,
        two_factor_enabled: Boolean(user.two_factor_enabled),
        doctor: doctorData,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend OTP endpoint
 * Body: { email, purpose = 'registration' }
 */
const resendOtp = async (req, res, next) => {
  try {
    const { email, purpose = 'registration' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_EMAIL',
        error: 'Email is required to resend verification code.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Generic response if user not found to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification code has been sent.',
      });
    }

    if (purpose === 'registration' && user.is_verified) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_VERIFIED',
        error: 'Your email is already verified. You can sign in directly.',
      });
    }

    // Check 30-second cooldown between resend requests
    const latestOtp = await OtpVerification.findOne({
      user_id: user._id,
      purpose,
    }).sort({ last_sent_at: -1 });

    if (latestOtp) {
      const elapsedMs = Date.now() - new Date(latestOtp.last_sent_at).getTime();
      const cooldownMs = 30 * 1000;
      if (elapsedMs < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
        return res.status(429).json({
          success: false,
          code: 'RESEND_COOLDOWN',
          error: `Please wait ${remainingSec}s before requesting another verification code.`,
          retry_after: remainingSec,
        });
      }
    }

    const { masked_email } = await issueAndSendOtp(user, purpose);

    return res.status(200).json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email.',
      masked_email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot Password endpoint
 * Body: { email }
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Generic response to prevent email enumeration if user does not exist
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a 6-digit password reset code has been sent.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended. Please contact DermaScan AI support.',
      });
    }

    const { masked_email } = await issueAndSendOtp(user, 'password_reset');

    return res.status(200).json({
      success: true,
      message: 'A 6-digit password reset code has been sent to your email.',
      email: user.email,
      masked_email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Reset Password OTP endpoint (Step 2: OTP verification only)
 * Body: { email, otp }
 * Returns a short-lived resetToken upon success
 */
const verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and 6-digit verification code are required.',
      });
    }

    const cleanOtp = String(otp).trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 6-digit numeric verification code.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification request.',
      });
    }

    const otpRecord = await OtpVerification.findOne({
      user_id: user._id,
      purpose: 'password_reset',
    }).sort({ created_at: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'No active password reset code found. Please request a new code.',
      });
    }

    if (otpRecord.attempts_count >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Too many incorrect attempts. For security, this code is locked. Please request a new password reset code.',
      });
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({
        success: false,
        error: 'This verification code has expired. Please request a new code.',
      });
    }

    const isMatch = verifyOtpHash(cleanOtp, otpRecord.otp_hash);
    if (!isMatch) {
      otpRecord.attempts_count += 1;
      await otpRecord.save();
      const remaining = 5 - otpRecord.attempts_count;
      return res.status(400).json({
        success: false,
        error: `Incorrect verification code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`,
        remaining_attempts: remaining,
      });
    }

    // OTP is valid — remove it so it cannot be reused
    await OtpVerification.deleteMany({ user_id: user._id, purpose: 'password_reset' });

    // Issue a single-use, 15-minute reset token
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email, purpose: 'password_reset' },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      success: true,
      message: 'Verification code confirmed. You can now set your new password.',
      resetToken,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password endpoint (Step 3: New password submission)
 * Body: { resetToken, newPassword } or legacy { email, otp, newPassword }
 */
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, email, otp, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password is required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.',
      });
    }

    let user = null;

    // Pattern 1: Using secure resetToken (post-OTP verification)
    if (resetToken) {
      let decoded;
      try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'secret123');
      } catch (jwtErr) {
        return res.status(400).json({
          success: false,
          error: 'Your password reset session has expired or is invalid. Please request a new code.',
        });
      }

      if (decoded.purpose !== 'password_reset') {
        return res.status(400).json({
          success: false,
          error: 'Invalid reset token purpose.',
        });
      }

      user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found.',
        });
      }
    } 
    // Pattern 2: Legacy fallback with email & otp in a single call
    else if (email && otp) {
      const cleanOtp = String(otp).trim();
      if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid 6-digit numeric verification code.',
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired password reset request.',
        });
      }

      const otpRecord = await OtpVerification.findOne({
        user_id: user._id,
        purpose: 'password_reset',
      }).sort({ created_at: -1 });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          error: 'No active password reset code found. Please request a new code.',
        });
      }

      if (otpRecord.attempts_count >= 5) {
        return res.status(429).json({
          success: false,
          error: 'Too many incorrect attempts. For security, this code is locked. Please request a new password reset code.',
        });
      }

      if (new Date() > new Date(otpRecord.expires_at)) {
        return res.status(400).json({
          success: false,
          error: 'This verification code has expired. Please request a new code.',
        });
      }

      const isMatch = verifyOtpHash(cleanOtp, otpRecord.otp_hash);
      if (!isMatch) {
        otpRecord.attempts_count += 1;
        await otpRecord.save();
        const remaining = 5 - otpRecord.attempts_count;
        return res.status(400).json({
          success: false,
          error: `Incorrect verification code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`,
          remaining_attempts: remaining,
        });
      }

      await OtpVerification.deleteMany({ user_id: user._id, purpose: 'password_reset' });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Reset token or verification credentials are required.',
      });
    }

    // Success: Hash new password, update user, mark verified
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(newPassword, salt);
    user.is_verified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

const checkDoctorStatus = async (req, res, next) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Doctor email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail, role: 'doctor' });

    if (!user) {
      return res.status(404).json({ success: false, error: 'No doctor account found with this email.' });
    }

    const doctorRecord = await Doctor.findOne({ user_id: user._id });

    return res.status(200).json({
      success: true,
      email: user.email,
      name: user.name,
      is_verified: user.is_verified,
      is_active: user.isActive !== false,
      approved: doctorRecord ? Boolean(doctorRecord.verified) : false,
      doctor: doctorRecord ? {
        specialization: doctorRecord.specialization,
        license_number: doctorRecord.license_number,
        hospital_name: doctorRecord.hospital_name,
        verified: doctorRecord.verified,
      } : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
