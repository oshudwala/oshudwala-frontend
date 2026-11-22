import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, ArrowRight, AlertCircle, ShieldCheck, CheckCircle2, RotateCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendOtp, verifyOtp } = useAuth();
  const { addToast } = useToast();

  const [step, setStep] = useState('phone'); // 'phone' | 'verify'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isNewUser, setIsNewUser] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Resend countdown timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Step 1: Send OTP to mobile
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendOtp(cleanPhone);
      const newUserFlag = Boolean(res.isNewUser);
      setIsNewUser(newUserFlag);
      setStep('verify');
      setResendTimer(30);
      setOtp('');

      if (newUserFlag) {
        addToast(`Verification OTP sent to +91 ${cleanPhone}. Please enter your name to register.`, 'success');
      } else {
        addToast(`Account already exists for +91 ${cleanPhone}. Login OTP sent!`, 'success');
      }
    } catch (err) {
      const msg = err.message || 'Failed to send verification code. Please check your number and try again.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Register or Login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const cleanOtp = otp.trim();

    if (isNewUser) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMessage('Please enter your full name (minimum 2 characters).');
        return;
      }
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErrorMessage('Please enter a valid email address or leave it blank.');
        return;
      }
      if (!agreeTerms) {
        setErrorMessage('You must agree to the Terms of Service and Privacy Policy to continue.');
        return;
      }
    }

    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit verification OTP received on your mobile.');
      return;
    }

    setIsLoading(true);
    try {
      if (isNewUser) {
        await verifyOtp({
          phone: cleanPhone,
          otp: cleanOtp,
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          isNewUser: true,
        });
        addToast('Account created and signed in successfully! Welcome to Oshud Wala.', 'success');
      } else {
        await verifyOtp({
          phone: cleanPhone,
          otp: cleanOtp,
          isNewUser: false,
        });
        addToast('Signed in successfully! Welcome back.', 'success');
      }

      const fromPath = location.state?.from?.pathname;
      navigate(fromPath && fromPath !== '/register' ? fromPath : '/', { replace: true });
    } catch (err) {
      const msg = err.message || 'Invalid or expired OTP code. Please verify and try again.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-card space-y-6">
        <div className="text-center space-y-2">
          <Logo className="justify-center" variant="light" />
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800 pt-2">
            {step === 'phone' ? 'Register with Mobile' : isNewUser ? 'Complete Registration' : 'Verify & Sign In'}
          </h1>
          <p className="text-xs text-brandText-secondary">
            {step === 'phone'
              ? 'Enter your mobile number to get instant SMS OTP for 100% password-free access'
              : isNewUser
              ? `Verification OTP sent to +91 ${phone}`
              : `Enter the code sent to +91 ${phone} to sign in`}
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="flex-1 font-medium leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* STEP 1: Phone Input */}
        {step === 'phone' && (
          <form onSubmit={handleRequestOtp} className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1.5">
                Mobile Number
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-bold text-forest-800 border-r border-brandBorder-subtle pr-2 pointer-events-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  disabled={isLoading}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/[^0-9]/g, ''));
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Enter 10-digit mobile number"
                  autoFocus
                  className="w-full pl-16 pr-4 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium tracking-wide disabled:opacity-50"
                />
              </div>
              <p className="text-[11px] text-brandText-muted mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-600 inline" />
                We will send a 6-digit verification code via SMS
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading || phone.length !== 10}
              rightIcon={ArrowRight}
              className="w-full shadow-card font-bold py-2.5 text-xs sm:text-sm"
            >
              {isLoading ? 'Sending OTP...' : 'Send Verification Code'}
            </Button>
          </form>
        )}

        {/* STEP 2: OTP Verification & Profile Info */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
            {/* Existing user alert banner */}
            {!isNewUser && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>
                  An account is already linked to <strong>+91 {phone}</strong>. Enter your OTP below to sign in directly.
                </p>
              </div>
            )}

            {/* First-time registration fields: Full Name & Email */}
            {isNewUser && (
              <>
                <div className="p-2.5 bg-forest-50/70 border border-forest-200/60 rounded-xl text-xs text-forest-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-forest-700 flex-shrink-0" />
                  <span>First time here? Please provide your details to create your patient profile.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      disabled={isLoading}
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Email Address <span className="text-brandText-muted font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled={isLoading}
                      placeholder="rahul@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </>
            )}

            {/* OTP Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-brandText-main">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setErrorMessage('');
                  }}
                  className="text-[11px] font-semibold text-forest-700 hover:underline"
                >
                  Change Number
                </button>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                disabled={isLoading}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/[^0-9]/g, ''));
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="• • • • • •"
                autoFocus
                className="w-full px-4 py-2.5 text-center text-lg sm:text-xl font-bold tracking-[0.4em] bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
              />
            </div>

            {/* Resend OTP */}
            <div className="flex items-center justify-between text-xs text-brandText-secondary pt-1">
              <span>Didn't receive the SMS code?</span>
              {resendTimer > 0 ? (
                <span className="font-semibold text-forest-700">Resend in {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRequestOtp()}
                  className="font-bold text-forest-700 hover:underline flex items-center gap-1"
                >
                  <RotateCw className="w-3 h-3" /> Resend OTP
                </button>
              )}
            </div>

            {/* Terms & Privacy checkbox for new users */}
            {isNewUser && (
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  disabled={isLoading}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-forest-600 rounded focus:ring-forest-500"
                />
                <span className="text-[11px] text-brandText-secondary leading-snug">
                  I agree to the{' '}
                  <Link to="/terms-conditions" className="text-forest-700 font-semibold hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy-policy" className="text-forest-700 font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading || otp.length !== 6 || (isNewUser && (!fullName.trim() || fullName.trim().length < 2))}
              rightIcon={CheckCircle2}
              className="w-full shadow-card font-bold py-2.5 text-xs sm:text-sm"
            >
              {isLoading
                ? (isNewUser ? 'Creating Account...' : 'Verifying...')
                : (isNewUser ? 'Verify OTP & Complete Registration' : 'Verify OTP & Sign In')}
            </Button>
          </form>
        )}

        {/* Footer Link */}
        <div className="text-center text-xs text-brandText-secondary pt-3 border-t border-brandBorder-subtle">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-forest-700 hover:underline">
            Sign In with OTP
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
