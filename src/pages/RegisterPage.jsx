import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!cleanPhone || !/^[0-9]{10}$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address, or leave it blank.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('You must agree to the Terms of Service and Privacy Policy to register.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        fullName: cleanName,
        email: cleanEmail || undefined,
        phone: cleanPhone,
        password,
      });
      addToast('Account registered successfully! Welcome to Oshud Wala.', 'success');
      navigate('/');
    } catch (err) {
      let msg = err.message || 'Registration failed. A user with this phone or email may already exist.';
      if (err.status === 400 && err.message?.includes('already exists')) {
        msg = 'An account with this phone number or email is already registered. Please sign in instead.';
      }
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
          <Logo className="justify-center" />
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800 pt-2">
            Create Patient Account
          </h1>
          <p className="text-xs text-brandText-secondary">
            Join Oshud Wala for verified medicine deliveries and chamber doctor tokens
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="flex-1 font-medium leading-relaxed">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                disabled={isLoading}
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">
              Phone Number (10 digits)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                disabled={isLoading}
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/[^0-9]/g, ''));
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">
              Email Address (Optional)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled={isLoading}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">
              Create Password (min. 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isLoading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full pl-10 pr-10 py-2 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 disabled:opacity-50"
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

          <label className="flex items-start gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              disabled={isLoading}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 text-forest-600 rounded focus:ring-forest-500"
            />
            <span className="text-[11px] text-brandText-secondary leading-snug">
              I agree to the <span className="text-forest-700 font-semibold">Terms of Service</span> and{' '}
              <span className="text-forest-700 font-semibold">Privacy Policy</span>.
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading}
            rightIcon={ArrowRight}
            className="w-full shadow-card font-bold mt-2"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center text-xs text-brandText-secondary pt-2 border-t border-brandBorder-subtle">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-forest-700 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
