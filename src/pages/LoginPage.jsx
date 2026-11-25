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
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [otpStep, setOtpStep] = useState('phone'); // 'phone' | 'otp'
  const [resendTimer, setResendTimer] = useState(0);

  // Password Login States (Staff only)
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
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendOtp(cleanPhone);
      setIsNewUser(Boolean(res.isNewUser));
      setOtpStep('otp');
      setResendTimer(30);
      setOtp('');
      const successNotice =
        res.message ||
        (res.isNewUser
          ? `Verification OTP sent to +91 ${cleanPhone}. Please enter your name to register.`
          : `Login OTP sent to +91 ${cleanPhone}`);
      addToast(successNotice, 'success');
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

    if (isNewUser) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMessage('Please enter your full name (minimum 2 characters).');
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
        addToast('Account created and signed in successfully!', 'success');
      } else {
        await verifyOtp({
          phone: cleanPhone,
          otp: cleanOtp,
          isNewUser: false,
        });
        addToast('Signed in successfully!', 'success');
      }

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

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage('Please enter your registered staff email address or phone.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({ identifier: cleanIdentifier, password });
      const rawRole = typeof result.user?.role === 'object'
        ? result.user?.role?.name
        : result.user?.role || 'STAFF';
      
      let userRole = String(rawRole || '').trim().toUpperCase();
      if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') userRole = 'SUPER_ADMIN';
      if (userRole === 'RECEPTIONIST') userRole = 'CLINIC';

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
        {activeTab === 'patient' && (
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
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isNewUser
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}>
                        {isNewUser ? 'New Patient Registration' : 'Patient Sign In'}
                      </span>
                    </div>
                    <span className="text-brandText-secondary">OTP sent to: </span>
                    <strong className="text-forest-800 font-bold">+91 {phone}</strong>
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

                {/* If first-time user: collect Full Name and optional Email */}
                {isNewUser && (
                  <div className="space-y-3 pt-1 animate-fade-in">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          disabled={isLoading}
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (errorMessage) setErrorMessage('');
                          }}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1.5">
                        Email Address <span className="text-brandText-muted font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          disabled={isLoading}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errorMessage) setErrorMessage('');
                          }}
                          placeholder="e.g. rahul@example.com"
                          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                      placeholder="6-digit code"
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
                  disabled={isLoading || otp.length !== 6 || (isNewUser && (!fullName.trim() || fullName.trim().length < 2))}
                  rightIcon={CheckCircle2}
                  className="w-full shadow-card font-bold py-2.5 text-xs sm:text-sm"
                >
                  {isLoading
                    ? (isNewUser ? 'Creating Account...' : 'Verifying Code...')
                    : (isNewUser ? 'Verify OTP & Complete Registration' : 'Verify OTP & Sign In')}
                </Button>
              </form>
            )}
          </div>
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