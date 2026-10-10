import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Mail,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  KeyRound,
  Sparkles,
  ArrowRight,
  Edit3
} from 'lucide-react';
import api from '../../services/api';

const OTP_LENGTH = 6;
const EXPIRATION_SECONDS = 600; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 30; // 30s resend cooldown

const maskEmailLocal = (emailStr: string): string => {
  if (!emailStr || !emailStr.includes('@')) return emailStr;
  const [user, domain] = emailStr.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
};

const VerifyOtp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Location state can pass email, role, masked_email, purpose
  const stateEmail = (location.state as { email?: string; role?: string; masked_email?: string; purpose?: string } | null)?.email || '';
  const stateRole = (location.state as { email?: string; role?: string; masked_email?: string; purpose?: string } | null)?.role || 'patient';
  const stateMasked = (location.state as { email?: string; role?: string; masked_email?: string; purpose?: string } | null)?.masked_email || '';
  const statePurpose = (location.state as { email?: string; role?: string; masked_email?: string; purpose?: string } | null)?.purpose || '';

  const [email, setEmail] = useState<string>(() => {
    return stateEmail || localStorage.getItem('pending_verify_email') || '';
  });
  const [role] = useState<string>(() => {
    return stateRole || localStorage.getItem('pending_verify_role') || 'patient';
  });
  const [purpose, setPurpose] = useState<string>(() => {
    return statePurpose || localStorage.getItem('pending_verify_purpose') || 'registration';
  });
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(!email);
  const [customEmailInput, setCustomEmailInput] = useState<string>(email);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);

  // Timers
  const [expirySeconds, setExpirySeconds] = useState<number>(EXPIRATION_SECONDS);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(RESEND_COOLDOWN_SECONDS);

  // Input refs for the 6 boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Keep email in localStorage temporarily in case page refreshes
  useEffect(() => {
    if (email) {
      localStorage.setItem('pending_verify_email', email);
      localStorage.setItem('pending_verify_role', role);
      localStorage.setItem('pending_verify_purpose', purpose);
    }
  }, [email, role, purpose]);

  // If this is a doctor verification, seamlessly forward to dedicated doctor OTP portal
  useEffect(() => {
    if (role === 'doctor') {
      navigate('/doctor/verify-otp', {
        state: { email, masked_email: stateMasked, role: 'doctor', purpose },
        replace: true
      });
    }
  }, [role, email, stateMasked, purpose, navigate]);

  // Expiration countdown
  useEffect(() => {
    if (expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [expirySeconds]);

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Focus the first empty digit input on load
  useEffect(() => {
    if (!isEditingEmail) {
      const firstEmptyIndex = digits.findIndex((d) => !d);
      const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      inputRefs.current[targetIndex]?.focus();
    }
  }, [isEditingEmail]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digits
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const updated = [...digits];
      updated[index] = '';
      setDigits(updated);
      return;
    }

    // Handle single digit entry
    const char = cleanVal.slice(-1);
    const updated = [...digits];
    updated[index] = char;
    setDigits(updated);
    setErrorMsg('');

    // Advance to next box if available
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // If this entry completes all 6 digits, auto-submit
    const fullCode = updated.join('');
    if (fullCode.length === OTP_LENGTH && !updated.some((d) => !d)) {
      triggerVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move to previous box if current is empty
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
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pastedData) return;

    const chars = pastedData.split('');
    const updated = [...digits];
    chars.forEach((ch, idx) => {
      if (idx < OTP_LENGTH) {
        updated[idx] = ch;
      }
    });
    setDigits(updated);
    setErrorMsg('');

    // Focus on the next available box or the last one
    const nextIdx = Math.min(chars.length, OTP_LENGTH - 1);
    inputRefs.current[nextIdx]?.focus();

    // Auto submit if full 6 digits were pasted
    if (updated.join('').length === OTP_LENGTH) {
      triggerVerify(updated.join(''));
    }
  };

  const triggerVerify = async (codeToVerify: string) => {
    if (!email) {
      setErrorMsg('Please specify the email address registered with your account.');
      setIsEditingEmail(true);
      return;
    }

    if (codeToVerify.length !== OTP_LENGTH) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    if (expirySeconds <= 0) {
      setErrorMsg('This verification code has expired. Please click "Resend Code" below.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await api.post('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: codeToVerify,
        purpose: purpose || 'registration',
      });

      const { token, user, message } = response.data;
      setSuccessMsg(message || (purpose === '2fa' ? '2FA verification successful!' : 'Email verified successfully!'));
      setIsLockedOut(false);
      setRemainingAttempts(null);

      // Clean pending state
      localStorage.removeItem('pending_verify_email');
      localStorage.removeItem('pending_verify_role');
      localStorage.removeItem('pending_verify_purpose');

      // If doctor is pending admin approval, do NOT persist active session that bypasses the gate
      const isDoctor = user?.role === 'doctor' || role === 'doctor';
      const isDoctorApproved = response.data?.doctor?.verified === true;

      if (!isDoctor || isDoctorApproved) {
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }

      // Smooth redirection to corresponding dashboard or pending screen after brief success animation
      setTimeout(() => {
        if (isDoctor) {
          if (!isDoctorApproved) {
            navigate('/doctor/pending-approval', {
              state: {
                email: user?.email || email,
                doctor: response.data?.doctor,
                message: 'Your email is verified. Medical credentials are now awaiting administrative review.',
              }
            });
          } else {
            navigate('/doctor-dashboard');
          }
        } else {
          navigate('/dashboard');
        }
      }, 1200);
    } catch (err: any) {
      const serverCode = err.response?.data?.code;
      const errorText = err.response?.data?.error || 'Verification failed. Please try again.';
      const rem = err.response?.data?.remaining_attempts;

      setErrorMsg(errorText);

      if (rem !== undefined) {
        setRemainingAttempts(rem);
      }

      if (serverCode === 'MAX_ATTEMPTS_EXCEEDED' || serverCode === 'RATE_LIMIT_EXCEEDED') {
        setIsLockedOut(true);
      }

      // Clear the digit fields on failure to allow clean re-entry
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerVerify(digits.join(''));
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || isResending) return;

    if (!email) {
      setErrorMsg('Please specify your account email address first.');
      setIsEditingEmail(true);
      return;
    }

    setIsResending(true);
    setErrorMsg('');

    try {
      const response = await api.post('/auth/resend-otp', {
        email: email.trim().toLowerCase(),
        purpose: purpose || 'registration',
      });

      setSuccessMsg(response.data?.message || 'A new verification code has been dispatched to your email.');
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
      setExpirySeconds(EXPIRATION_SECONDS);
      setIsLockedOut(false);
      setRemainingAttempts(null);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();

      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to resend code. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSaveCustomEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmailInput || !customEmailInput.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setEmail(customEmailInput);
    setIsEditingEmail(false);
    setErrorMsg('');
  };

  const maskedDisplay = stateMasked || (email ? maskEmailLocal(email) : 'your email');

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 sm:p-6 text-white font-sans relative overflow-hidden selection:bg-[#06B6D4]/30">
      {/* Bioluminescent Background Lights */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-[45vw] h-[45vw] rounded-full bg-[#06B6D4] blur-[140px] mix-blend-screen"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-32 -right-32 w-[45vw] h-[45vw] rounded-full bg-[#3B82F6] blur-[140px] mix-blend-screen"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            DermaScan <span className="text-[#06B6D4]">AI</span>
          </span>
        </div>

        {/* Card Container */}
        <div className="bg-[#1E293B]/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 sm:p-10 shadow-[0_25px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
          {/* Subtle glowing accent line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#06B6D4]/60 to-transparent" />

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0F172A] border border-[#06B6D4]/30 flex items-center justify-center mb-4 shadow-[inset_0_0_15px_rgba(6,182,212,0.15)]">
              <KeyRound className="w-7 h-7 text-[#06B6D4]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              {purpose === '2fa' ? 'Two-Factor Authentication' : 'Enter Verification Code'}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
              {purpose === '2fa'
                ? 'We sent a 6-digit numeric security code to verify your account login.'
                : 'We sent a 6-digit numeric security code to verify your account registration.'}
            </p>
          </div>

          {/* Email Target Indicator & Switcher */}
          <div className="bg-[#0F172A]/80 border border-slate-700/60 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Mail className="w-4 h-4 text-[#06B6D4] shrink-0" />
              {isEditingEmail ? (
                <form onSubmit={handleSaveCustomEmail} className="flex items-center gap-2 w-full">
                  <input
                    type="email"
                    value={customEmailInput}
                    onChange={(e) => setCustomEmailInput(e.target.value)}
                    placeholder="Enter your registered email"
                    className="bg-transparent text-xs sm:text-sm text-white focus:outline-none border-b border-[#06B6D4] pb-0.5 w-full"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="text-xs font-bold text-[#06B6D4] hover:underline px-1.5 py-0.5"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <div className="truncate text-xs sm:text-sm">
                  <span className="text-slate-400">Code sent to: </span>
                  <span className="font-semibold text-slate-200">{maskedDisplay}</span>
                </div>
              )}
            </div>
            {!isEditingEmail && (
              <button
                type="button"
                onClick={() => {
                  setCustomEmailInput(email);
                  setIsEditingEmail(true);
                }}
                className="text-slate-400 hover:text-[#06B6D4] p-1 transition-colors text-xs flex items-center gap-1 shrink-0 ml-2"
                title="Change Email"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Change</span>
              </button>
            )}
          </div>

          {/* Notification / Error / Success Badges */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-red-200 leading-snug">
                  {errorMsg}
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <div className="mt-1 font-semibold text-red-300">
                      Remaining attempts: {remainingAttempts} / 5
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-emerald-200 leading-snug font-medium">
                  {successMsg}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 6 Digit Input Form */}
          <form onSubmit={handleManualSubmit}>
            <div className="flex justify-between items-center gap-2 sm:gap-3 mb-6">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={isLoading || isLockedOut}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold rounded-xl bg-[#0F172A] border transition-all duration-200 focus:outline-none shadow-inner ${
                    digit
                      ? 'border-[#06B6D4] text-[#06B6D4] shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'border-slate-700 text-white hover:border-slate-500'
                  } focus:border-[#06B6D4] focus:ring-2 focus:ring-[#06B6D4]/30 disabled:opacity-50 disabled:cursor-not-allowed`}
                />
              ))}
            </div>

            {/* Expiry Timer Indicator */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 mb-8 px-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#06B6D4]" />
                {expirySeconds > 0 ? (
                  <span>
                    Expires in:{' '}
                    <span className="font-mono font-bold text-slate-200">
                      {formatTime(expirySeconds)}
                    </span>
                  </span>
                ) : (
                  <span className="text-red-400 font-semibold">Code has expired</span>
                )}
              </div>

              {/* Resend Action */}
              <div>
                {cooldownSeconds > 0 ? (
                  <span className="text-slate-500">
                    Resend in <span className="font-mono font-semibold">{cooldownSeconds}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-[#06B6D4] hover:text-white font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    Resend code
                  </button>
                )}
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading || isLockedOut || digits.some((d) => !d) || expirySeconds <= 0}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] hover:from-[#0891b2] hover:to-[#2563eb] shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden relative group"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-white/20" />
                  Verify & Continue
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Navigation Links */}
          <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-400">
            <Link
              to={role === 'doctor' ? '/register-doctor' : '/register'}
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Registration
            </Link>
            <Link
              to={role === 'doctor' ? '/login/doctor' : '/login'}
              className="text-[#06B6D4] hover:text-white font-medium transition-colors"
            >
              Already verified? Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOtp;
