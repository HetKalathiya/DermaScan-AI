import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Check
} from 'lucide-react';
import api from '../../services/api';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Multi-step state:
  // 1 = Enter Email
  // 2 = Enter & Verify OTP Code ONLY
  // 3 = Set & Confirm New Password ONLY
  // 4 = Success confirmation & redirect
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Step 2: OTP digits
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));

  // Step 3: Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Resend cooldown timer
  const [cooldown, setCooldown] = useState(0);

  // Input refs for 6-box OTP entry
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus the first empty digit box when step 2 is entered
  useEffect(() => {
    if (step === 2) {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  // Calculate password strength
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pass)) score += 25;
    return score;
  };

  const strength = calculateStrength(newPassword);

  const getStrengthLabel = (score: number) => {
    if (score <= 25) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-400' };
    if (score <= 50) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' };
    if (score <= 75) return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-400' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  // ─── STEP 1: Request Password Reset OTP ───────────────────────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      const { masked_email, message } = response.data;

      setMaskedEmail(masked_email || email);
      setSuccessMsg(message || 'A 6-digit verification code has been sent to your email.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── STEP 2: Handle 6-Box OTP Input ──────────────────────────────────────────
  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const updated = [...digits];
      updated[index] = '';
      setDigits(updated);
      return;
    }

    const char = clean.slice(-1);
    const updated = [...digits];
    updated[index] = char;
    setDigits(updated);
    setErrorMsg('');

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const updated = [...digits];
        updated[index - 1] = '';
        setDigits(updated);
      } else {
        const updated = [...digits];
        updated[index] = '';
        setDigits(updated);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const chars = pasted.split('');
    const updated = [...digits];
    chars.forEach((c, i) => {
      if (i < OTP_LENGTH) updated[i] = c;
    });
    setDigits(updated);
    setErrorMsg('');
    const targetIdx = Math.min(chars.length, OTP_LENGTH - 1);
    inputRefs.current[targetIdx]?.focus();
  };

  // ─── STEP 2 SUBMIT: Verify OTP Only ──────────────────────────────────────────
  const handleVerifyOtpOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');

    if (code.length !== OTP_LENGTH) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await api.post('/auth/verify-reset-otp', {
        email: email.trim().toLowerCase(),
        otp: code,
      });

      const { resetToken: token } = response.data;
      setResetToken(token);
      setSuccessMsg('Code verified successfully! Please set your new password.');
      setRemainingAttempts(null);
      setStep(3); // Advance to Set New Password screen
    } catch (err: any) {
      const errorText = err.response?.data?.error || 'Verification failed. Please check your code.';
      const rem = err.response?.data?.remaining_attempts;
      setErrorMsg(errorText);
      if (rem !== undefined) setRemainingAttempts(rem);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // ─── STEP 3 SUBMIT: Set New Password ─────────────────────────────────────────
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await api.post('/auth/reset-password', {
        resetToken,
        newPassword,
      });

      setStep(4); // Advance to Success screen
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg('');
    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSuccessMsg(response.data?.message || 'A fresh verification code has been dispatched.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setRemainingAttempts(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D1B] flex items-center justify-center p-4 text-white relative overflow-hidden selection:bg-[#06B6D4]/30">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#06B6D4 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#06B6D4]/10 rounded-full blur-[140px] pointer-events-none" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#06B6D4] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>

        {/* Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#0D172E]/90 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-cyan-950/20"
        >
          {/* Header Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#06B6D4]/20 to-[#3B82F6]/20 border border-[#06B6D4]/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.25)]">
              {step === 4 ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              ) : step === 3 ? (
                <Lock className="w-7 h-7 text-[#06B6D4]" />
              ) : (
                <KeyRound className="w-7 h-7 text-[#06B6D4]" />
              )}
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-[#06B6D4]' : 'w-4 bg-white/20'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-[#06B6D4]' : 'w-4 bg-white/20'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'w-8 bg-[#06B6D4]' : 'w-4 bg-white/20'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 4 ? 'w-8 bg-emerald-500' : 'w-4 bg-white/20'}`} />
          </div>

          {/* Step Titles */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              {step === 1 && 'Forgot Password'}
              {step === 2 && 'Enter Verification Code'}
              {step === 3 && 'Create New Password'}
              {step === 4 && 'Password Changed!'}
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              {step === 1 && 'Enter your registered email address and we will send you a 6-digit verification code to reset your password.'}
              {step === 2 && (
                <>
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-cyan-400">{maskedEmail || email}</span>.
                  Please enter the code to verify your identity.
                </>
              )}
              {step === 3 && 'Your code has been verified. Create a secure new password for your account.'}
              {step === 4 && 'Your password has been successfully updated. Redirecting you to login...'}
            </p>
          </div>

          {/* Feedback alerts */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (step === 2 || step === 3) && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-5 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-sm flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── STEP 1: Enter Email ────────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#081022] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4] transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#06B6D4] to-[#2563EB] hover:from-[#22d3ee] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ─── STEP 2: Enter & Verify OTP Code ONLY ─────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtpOnly} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 text-center">
                  Enter 6-Digit Code
                </label>
                <div className="flex justify-center gap-2.5">
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className="w-11 h-12 text-center text-xl font-bold bg-[#081022] border border-white/15 focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/30 rounded-xl text-cyan-400 transition-all outline-none"
                    />
                  ))}
                </div>
                {remainingAttempts !== null && (
                  <p className="text-center text-xs text-amber-400 mt-2">
                    {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining
                  </p>
                )}
              </div>

              {/* Verify OTP Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#06B6D4] to-[#2563EB] hover:from-[#22d3ee] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Verify Code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend Code & Back to Step 1 */}
              <div className="pt-2 flex items-center justify-between text-xs text-gray-400">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="hover:text-gray-200 transition-colors"
                >
                  Change email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isResending}
                  className="text-[#06B6D4] hover:text-white transition-colors disabled:text-gray-600 disabled:cursor-not-allowed flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* ─── STEP 3: Set & Confirm New Password ONLY ─────────────────── */}
          {step === 3 && (
            <form onSubmit={handleSetNewPassword} className="space-y-5">
              {/* Verified Identity Badge */}
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center gap-2 text-cyan-300 text-xs">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Verified account: <strong>{email}</strong></span>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-11 py-3 bg-[#081022] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4] transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2.5">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-gray-400">Strength:</span>
                      <span className={`font-semibold ${getStrengthLabel(strength).text}`}>
                        {getStrengthLabel(strength).label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${getStrengthLabel(strength).color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${strength}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-11 py-3 bg-[#081022] border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4] transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#06B6D4] to-[#2563EB] hover:from-[#22d3ee] hover:to-[#3b82f6] text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Update Password
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ─── STEP 4: Success Screen ─────────────────────────────────────── */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-4"
            >
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-sm">
                Your password has been changed successfully. You can now sign in with your new password.
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2"
              >
                Sign In Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
