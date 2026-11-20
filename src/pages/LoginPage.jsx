import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Phone,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Building2,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sendOtp, verifyOtp, getRoleDefaultPath } = useAuth();
  const { addToast } = useToast();

  // Tab: 'patient' | 'staff'
  const [activeTab, setActiveTab] = useState('patient');

  // Patient OTP Login States
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState('phone'); // 'phone' | 'otp'
  const [resendTimer, setResendTimer] = useState(0);
  const [isPatientPasswordMode, setIsPatientPasswordMode] = useState(false);

  // Password Login States (Staff or Patient with password)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Common States
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle Requesting OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendOtp(cleanPhone);
      setOtpStep('otp');
      setResendTimer(30);
      addToast(res.message || `OTP sent to +91 ${cleanPhone}`, 'success');
      if (res.devOtp) {
        addToast(`Development OTP: ${res.devOtp}`, 'info');
      }
    } catch (err) {
      const msg = err.message || 'Failed to send verification code. Please check your number and try again.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Verifying OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      setErrorMessage('Please enter the 6-digit verification OTP received on your mobile.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyOtp({ phone: cleanPhone, otp: cleanOtp });
      addToast('Signed in successfully!', 'success');

      // Navigate to patient home or previous protected location
      const fromPath = location.state?.from?.pathname;
      navigate(fromPath && fromPath !== '/login' ? fromPath : '/', { replace: true });
    } catch (err) {
      const msg = err.message || 'Invalid or expired OTP. Please verify the code and try again.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email/Password Login (Staff or Patient with password)
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanIdentifier = (isPatientPasswordMode ? phone : identifier).trim();
    if (!cleanIdentifier) {
      setErrorMessage(
        activeTab === 'patient'
          ? 'Please enter your registered mobile number.'
          : 'Please enter your registered staff email address or phone.'
      );
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({ identifier: cleanIdentifier, password });
      const userRole = result.user?.role || (activeTab === 'patient' ? 'PATIENT' : 'STAFF');
      addToast(`Signed in successfully as ${userRole.replace('_', ' ')}`, 'success');

      const defaultPath = getRoleDefaultPath(userRole);
      const fromPath = location.state?.from?.pathname;
      navigate(fromPath && fromPath !== '/login' ? fromPath : defaultPath, { replace: true });
    } catch (err) {
      let msg = err.message || 'Sign in failed. Please verify your credentials.';
      if (err.status === 401) {
        msg = err.message?.toLowerCase().includes('password')
          ? err.message
          : 'Invalid phone/email or password. Please verify and try again.';
      } else if (err.status === 403) {
        msg = 'Your account has been deactivated or suspended. Please contact support.';
      }
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-14 animate-fade-in">
      <div className="w-full max-w-md bg-surface-pure rounded-3xl p-5 sm:p-8 border border-brandBorder-subtle shadow-card space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <Logo className="justify-center " variant="light"/>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800 pt-1">
            Welcome to Oshud Wala
          </h1>
          <p className="text-xs text-brandText-secondary">
            {activeTab === 'patient'
              ? 'Fast OTP login for patient orders, appointments, and prescriptions'
              : 'Secure authentication for healthcare providers, riders, and platform operations'}
          </p>
        </div>

        {/* Tab Switcher: Patient vs Staff/Workspace */}
        <div className="p-1 bg-surface-warm rounded-2xl border border-brandBorder-subtle grid grid-cols-2 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('patient');
              setErrorMessage('');
              setIsPatientPasswordMode(false);
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'patient'
                ? 'bg-forest-700 text-white shadow-xs'
                : 'text-brandText-secondary hover:text-forest-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Patient (OTP Login)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('staff');
              setErrorMessage('');
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'staff'
                ? 'bg-forest-700 text-white shadow-xs'
                : 'text-brandText-secondary hover:text-forest-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Staff & Workspace</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="flex-1 font-medium leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* ============================================================== */}
        {/* PATIENT LOGIN SECTION (OTP-BASED FLOW)                         */}
        {/* ============================================================== */}
        {activeTab === 'patient' && !isPatientPasswordMode && (
          <div className="space-y-4">
            {otpStep === 'phone' ? (
              /* Step 1: Mobile Number Input */
              <form onSubmit={handleRequestOtp} className="space-y-4">
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
                      className="w-full pl-16 pr-4 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-brandText-secondary mt-1">
                    We will send a 6-digit OTP code to verify your phone.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  disabled={isLoading || phone.length < 10}
                  rightIcon={ArrowRight}
                  className="w-full shadow-card font-bold py-2.5 text-xs sm:text-sm"
                >
                  {isLoading ? 'Sending OTP...' : 'Get OTP'}
                </Button>
              </form>
            ) : (
              /* Step 2: Enter & Verify OTP */
              <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
                <div className="p-3 bg-forest-50 rounded-2xl border border-forest-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-brandText-secondary">OTP sent to:</span>
                    <p className="font-bold text-forest-800">+91 {phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('phone');
                      setOtp('');
                      setErrorMessage('');
                    }}
                    className="text-xs font-bold text-forest-700 hover:underline"
                  >
                    Change Number
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1.5">
                    Enter 6-Digit OTP Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      disabled={isLoading}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/[^0-9]/g, ''));
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="e.g. 123456"
                      className="w-full pl-10 pr-4 py-2.5 text-center text-base sm:text-lg font-mono font-bold tracking-widest bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                  </div>
                </div>

                {/* Resend Timer / Action */}
                <div className="flex items-center justify-between text-xs pt-1">
                  {resendTimer > 0 ? (
                    <span className="text-brandText-secondary">
                      Resend OTP in <strong className="text-forest-700">{resendTimer}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isLoading}
                      className="text-forest-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  disabled={isLoading || otp.length < 4}
                  rightIcon={CheckCircle2}
                  className="w-full shadow-card font-bold py-2.5 text-xs sm:text-sm"
                >
                  {isLoading ? 'Verifying Code...' : 'Verify & Sign In'}
                </Button>
              </form>
            )}

            {/* Toggle: Sign in with Password */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsPatientPasswordMode(true);
                  setErrorMessage('');
                }}
                className="text-xs font-semibold text-forest-700 hover:underline"
              >
                Prefer to sign in with password? Click here
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PATIENT PASSWORD MODE (OPTIONAL FALLBACK FOR REGISTERED USERS)  */}
        {/* ============================================================== */}
        {activeTab === 'patient' && isPatientPasswordMode && (
          <form onSubmit={handlePasswordLogin} className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1.5">
                Registered Mobile Number
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
                  className="w-full pl-16 pr-4 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-brandText-main">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-semibold text-forest-700 hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brandText-muted hover:text-brandText-main p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
              rightIcon={ArrowRight}
              className="w-full shadow-card font-bold py-2.5 text-xs sm:text-sm"
            >
              {isLoading ? 'Signing In...' : 'Sign In with Password'}
            </Button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsPatientPasswordMode(false);
                  setErrorMessage('');
                }}
                className="text-xs font-semibold text-forest-700 hover:underline"
              >
                &larr; Back to OTP Login
              </button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* STAFF & WORKSPACE LOGIN (EMAIL & PASSWORD)                      */}
        {/* ============================================================== */}
        {activeTab === 'staff' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1.5">
                Staff Email Address or Phone
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g. staff@oshudwala.in or 9876500001"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-brandText-main">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-semibold text-forest-700 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brandText-muted hover:text-brandText-main p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
              rightIcon={ArrowRight}
              className="w-full shadow-card font-bold py-2.5 text-xs sm:text-sm"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Workspace'}
            </Button>
          </form>
        )}

        {/* Footer: Register Link for Patients */}
        <div className="text-center text-xs text-brandText-secondary pt-3 border-t border-brandBorder-subtle">
          New to Oshud Wala?{' '}
          <Link to="/register" className="font-bold text-forest-700 hover:underline">
            Register as Patient
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;