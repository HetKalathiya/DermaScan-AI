const crypto = require('crypto');

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 * Range: 100000 to 999999 (always 6 digits)
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Computes a SHA-256 hash of the OTP.
 * Fast, secure, non-reversible, and avoids plaintext storage.
 */
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
};

/**
 * Verifies if provided plain OTP matches the stored SHA-256 hash using constant-time comparison.
 */
const verifyOtpHash = (otp, storedHash) => {
  if (!otp || !storedHash) return false;
  const computedHash = hashOtp(otp);
  const bufA = Buffer.from(computedHash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Masks an email for safe display on the frontend (e.g. 'j***e@gmail.com')
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  const first = localPart[0];
  const last = localPart[localPart.length - 1];
  return `${first}***${last}@${domain}`;
};

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  maskEmail,
};
