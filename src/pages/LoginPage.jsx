import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Shield, Stethoscope, Building2, Bike, UserCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin, getRoleDefaultPath } = useAuth();
  const { addToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = (role) => {
    const userObj = demoLogin(role);
    addToast(`Switched to ${role.replace('_', ' ')}: ${userObj.name}`, 'success');
    const targetPath = getRoleDefaultPath(role);
    navigate(targetPath, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMessage('Please enter your registered phone number or email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login({ identifier: cleanIdentifier, password });
      const userRole = result.user?.role || 'PATIENT';
      addToast(`Signed in successfully as ${userRole}`, 'success');

      // Navigate to role-specific dashboard or previous protected location
      const defaultPath = getRoleDefaultPath(userRole);
      const fromPath = location.state?.from?.pathname;
      navigate(fromPath && fromPath !== '/login' ? fromPath : defaultPath, { replace: true });
    } catch (err) {
      let msg = err.message || 'Login failed. Please verify your credentials and try again.';
      if (err.status === 401) {
        msg = 'Invalid phone/email or password. Please verify and try again.';
      } else if (err.status === 403) {
        msg = 'Your account has been deactivated or suspended. Please contact support.';
      } else if (err.status === 400) {
        msg = err.message || 'Invalid login details provided.';
      }
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-card space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Logo className="justify-center" />
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800 pt-2">
            Welcome Back
          </h1>
          <p className="text-xs text-brandText-secondary">
            Sign in with your registered phone number or email to access your account
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="flex-1 font-medium leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">
              Phone Number or Email
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
                placeholder="e.g. 9876543210 or user@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 disabled:opacity-50"
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
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 disabled:opacity-50"
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
            className="w-full shadow-card font-bold"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Demo Fast Login Switcher for Testing Workspaces */}
        <div className="pt-3 border-t border-brandBorder-subtle">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-forest-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-forest-600" />
              Quick Role Test Logins
            </span>
            <span className="text-[10px] text-brandText-secondary">1-Click Access</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('SUPER_ADMIN')}
              className="p-2 rounded-xl bg-forest-50 hover:bg-forest-100 border border-forest-200/80 text-left transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-forest-800">
                <Shield className="w-3.5 h-3.5 text-forest-700" />
                <span>Super Admin</span>
              </div>
              <p className="text-[10px] text-brandText-secondary truncate">Rajiv Sen</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('DOCTOR')}
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-left transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                <span>Doctor</span>
              </div>
              <p className="text-[10px] text-brandText-secondary truncate">Dr. Priya Sharma</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('PHARMACY')}
              className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200/80 text-left transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                <Building2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Pharmacist</span>
              </div>
              <p className="text-[10px] text-brandText-secondary truncate">MedPlus Sector V</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('RIDER')}
              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-left transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Bike className="w-3.5 h-3.5 text-amber-700" />
                <span>Rider</span>
              </div>
              <p className="text-[10px] text-brandText-secondary truncate">Rahul Das (Fleet)</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('RECEPTIONIST')}
              className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-left transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                <UserCheck className="w-3.5 h-3.5 text-indigo-700" />
                <span>Receptionist</span>
              </div>
              <p className="text-[10px] text-brandText-secondary truncate">Apollo Clinic Desk</p>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('PATIENT')}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-left transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Patient</span>
              </div>
              <p className="text-[10px] text-brandText-secondary truncate">Ayon Paul</p>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-brandText-secondary pt-2 border-t border-brandBorder-subtle">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-forest-700 hover:underline">
            Register as Patient
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
