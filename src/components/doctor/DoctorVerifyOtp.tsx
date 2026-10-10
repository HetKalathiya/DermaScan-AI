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
  Stethoscope,
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

const DoctorVerifyOtp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const stateEmail = (location.state as { email?: string; role?: string; masked_email?: string; purpose?: string } | null)?.email || '';
  const stateMasked = (location.state as { email?: string; role?: string; masked_email?: string; purpose?: string } | null)?.masked_email || '';
  const statePurpose = (location.state as { email?: string; role?: string; masked_email?: string; purpose?: string } | null)?.purpose || '';

  const [email, setEmail] = useState<string>(() => {
    return stateEmail || localStorage.getItem('pending_doctor_email') || localStorage.getItem('pending_verify_email') || '';
  });
  const [purpose, setPurpose] = useState<string>(() => {
    return statePurpose || localStorage.getItem('pending_doctor_purpose') || 'registration';
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
      localStorage.setItem('pending_doctor_email', email);
      localStorage.setItem('pending_verify_email', email);
      localStorage.setItem('pending_verify_role', 'doctor');
      localStorage.setItem('pending_doctor_purpose', purpose);
    }
  }, [email, purpose]);

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

  const handleDigitChange = (index: number, value: string) => {
    if (isLockedOut) return;
    const numericChar = value.replace(/\D/g, '').slice(-1);

    const updated = [...digits];
    updated[index] = numericChar;
    setDigits(updated);
    setErrorMsg('');

    // If typed a digit and not the last box, advance focus
    if (numericChar && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits filled
    if (numericChar && index === OTP_LENGTH - 1 && updated.every((d) => d !== '')) {
      triggerVerify(updated.join(''));
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

    const nextIdx = Math.min(chars.length, OTP_LENGTH - 1);
    inputRefs.current[nextIdx]?.focus();

    if (updated.join('').length === OTP_LENGTH) {
      triggerVerify(updated.join(''));
    }
  };

  const triggerVerify = async (codeToVerify: string) => {
    if (!email) {
      setErrorMsg('Please specify the doctor email address registered with your account.');
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
      localStorage.removeItem('pending_doctor_email');
      localStorage.removeItem('pending_doctor_purpose');

      // Check if doctor requires medical credential review
      const isDoctorApproved = response.data?.doctor?.verified === true;

      if (isDoctorApproved) {
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }

      // Smooth redirection
      setTimeout(() => {
        if (!isDoctorApproved) {
          navigate('/doctor/pending-approval', {
            state: {
              email: user?.email || email,
              doctor: response.data?.doctor,
              message: 'Your email is verified. Medical credentials are now awaiting administrative board review.',
            }
          });
        } else {
          navigate('/doctor-dashboard');
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
    <div className="min-h-screen bg-[#07071A] flex items-center justify-center p-4 sm:p-6 text-white font-sans relative overflow-hidden selection:bg-[#818CF8]/30 w-full">
      {/* Background elements matching Doctor Portal */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at center, #818CF8 2px, transparent 2px)`,
            backgroundSize: '30px 30px',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-[#6366F1]/5 rounded-full blur-[160px] mix-blend-screen pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[-20%] left-[-10%] w-[55vw] h-[55vw] bg-[#818CF8]/5 rounded-full blur-[160px] pointer-events-none"
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#818CF8]/20 to-[#6366F1]/20 border border-[#818CF8]/30 flex items-center justify-center shadow-[0_0_20px_rgba(129,140,248,0.2)]">
            <ShieldCheck className="w-5 h-5 text-[#818CF8]" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            DermaScan <span className="text-[#818CF8]">AI</span>
          </span>
        </div>

        {/* Card Container matching DoctorLogin/Register card */}
        <div className="bg-[#0D0D20]/80 backdrop-blur-2xl border border-white/10 rounded-[28px] p-7 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(129,140,248,0.08)] relative overflow-hidden">
          {/* Subtle glowing accent line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#818CF8]/60 to-transparent" />

          {/* Role badge */}
          <div className="flex justify-center mb-6">
            <span className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#818CF8]/10 border border-[#818CF8]/25 text-[#818CF8]">
              Doctor Security Verification
            </span>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#181830] border border-[#818CF8]/30 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(129,140,248,0.2)]">
              <Stethoscope className="w-7 h-7 text-[#818CF8]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
              {purpose === '2fa' ? 'Two-Factor Authentication' : 'Enter Verification Code'}
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
              {purpose === '2fa'
                ? 'We sent a 6-digit medical authorization code to verify your physician login.'
                : 'We sent a 6-digit medical authorization code to verify your physician account.'}
            </p>
          </div>

          {/* Email Target Indicator & Switcher */}
          <div className="bg-[#181830]/60 border border-white/10 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Mail className="w-4 h-4 text-[#818CF8] shrink-0" />
              {isEditingEmail ? (
                <form onSubmit={handleSaveCustomEmail} className="flex items-center gap-2 w-full">
                  <input
                    type="email"
                    value={customEmailInput}
                    onChange={(e) => setCustomEmailInput(e.target.value)}
                    placeholder="Enter your doctor email"
                    className="bg-transparent text-xs sm:text-sm text-white focus:outline-none border-b border-[#818CF8] pb-0.5 w-full"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="text-xs font-bold text-[#818CF8] hover:underline px-1.5 py-0.5"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <div className="truncate text-xs sm:text-sm">
                  <span className="text-gray-400">Code sent to: </span>
                  <span className="font-semibold text-gray-200">{maskedDisplay}</span>
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
                className="text-gray-400 hover:text-[#818CF8] p-1 transition-colors text-xs flex items-center gap-1 shrink-0 ml-2"
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
                <div className="text-xs sm:text-sm text-emerald-200 leading-snug">{successMsg}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 6-Box OTP Inputs */}
          <form onSubmit={handleManualSubmit}>
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
              {digits.map((digit, index) => {
                const isFocused = inputRefs.current[index] === document.activeElement;
                return (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    disabled={isLoading || isLockedOut}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold font-mono rounded-xl bg-[#181830]/60 border transition-all text-white focus:outline-none ${
                      isLockedOut
                        ? 'opacity-40 border-gray-700 bg-gray-900 cursor-not-allowed'
                        : digit
                        ? 'border-[#818CF8]/50 bg-[#181830] shadow-[0_0_15px_rgba(129,140,248,0.2)]'
                        : 'border-white/10 hover:border-white/20'
                    } focus:border-[#818CF8] focus:ring-2 focus:ring-[#818CF8]/30 focus:bg-[#181830]`}
                    autoComplete="one-time-code"
                  />
                );
              })}
            </div>

            {/* Countdown & Resend Options */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 mb-6 pt-1 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#818CF8]" />
                {expirySeconds > 0 ? (
                  <span>
                    Expires in:{' '}
                    <strong className="font-mono text-gray-200">
                      {Math.floor(expirySeconds / 60)
                        .toString()
                        .padStart(2, '0')}
                      :{(expirySeconds % 60).toString().padStart(2, '0')}
                    </strong>
                  </span>
                ) : (
                  <span className="text-red-400 font-semibold">Code expired</span>
                )}
              </div>

              <div>
                {cooldownSeconds > 0 ? (
                  <span className="text-gray-500">Resend in {cooldownSeconds}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending || isLockedOut}
                    className="text-[#818CF8] hover:text-white transition-colors font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    <span>{isResending ? 'Sending...' : 'Resend Code'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit Verification Button matching Doctor Theme */}
            <button
              type="submit"
              disabled={isLoading || isLockedOut || digits.some((d) => !d)}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#818CF8] to-[#6366F1] hover:from-[#a5b4fc] hover:to-[#818CF8] focus:outline-none focus:ring-2 focus:ring-[#818CF8]/50 focus:ring-offset-2 focus:ring-offset-[#0D0D20] shadow-[0_0_20px_rgba(129,140,248,0.35)] hover:shadow-[0_0_30px_rgba(129,140,248,0.55)] transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 text-[#a5b4fc]" />
                  <span>Verify Physician Account</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Navigation Links */}
          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <Link
              to="/register-doctor"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Registration</span>
            </Link>
            <Link
              to="/login/doctor"
              className="font-semibold text-[#818CF8] hover:text-white transition-colors"
            >
              Doctor Sign In
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Shimmer animation config */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default DoctorVerifyOtp;
