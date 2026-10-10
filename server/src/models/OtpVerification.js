const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const OtpVerificationSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  user_id: { type: String, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  otp_hash: { type: String, required: true },
  purpose: {
    type: String,
    enum: ['registration', 'password_reset', '2fa'],
    default: 'registration',
  },
  expires_at: { type: Date, required: true },
  attempts_count: { type: Number, default: 0 },
  last_sent_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
});

// TTL index to automatically remove documents when expires_at timestamp has passed
OtpVerificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpVerification', OtpVerificationSchema);
