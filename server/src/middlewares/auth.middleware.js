const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      req.user = await User.findById(decoded.id).select('-password_hash');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user missing' });
      }
      if (req.user.isActive === false) {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended by administration. Please contact DermaScan AI support.',
        });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      req.user = await User.findById(decoded.id).select('-password_hash');
    } catch (e) {
      // Invalid/expired token — proceed as unauthenticated guest
    }
  }
  next();
};


const doctor = async (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    try {
      const doctorRecord = await Doctor.findOne({ user_id: req.user._id });
      if (!doctorRecord || !doctorRecord.verified) {
        return res.status(403).json({
          success: false,
          code: 'DOCTOR_PENDING_APPROVAL',
          requires_approval: true,
          message: 'Your medical credentials are under administrative review. Access to doctor clinical portals is restricted until approved.',
          doctor: doctorRecord ? {
            license_number: doctorRecord.license_number,
            hospital_name: doctorRecord.hospital_name,
            specialization: doctorRecord.specialization,
            verified: false,
          } : null,
        });
      }
      return next();
    } catch (err) {
      return next(err);
    }
  }
  return res.status(403).json({ success: false, message: 'Not authorized as a doctor' });
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Not authorized as an admin' });
};

const requireVerified = (req, res, next) => {
  if (req.user && req.user.is_verified) {
    return next();
  }
  return res.status(403).json({
    success: false,
    code: 'ACCOUNT_UNVERIFIED',
    error: 'Account email verification required to perform this action. Please verify your email.',
  });
};

module.exports = { protect, optionalAuth, doctor, admin, requireVerified };

