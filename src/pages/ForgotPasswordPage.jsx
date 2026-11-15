import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: otp & new pass, 3: success
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      addToast('Verification OTP code sent to your email (Demo Code: 4829)', 'info');
    }, 800);
  };

  const handleReset = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
      addToast('Password reset successfully!', 'success');
    }, 800);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-card space-y-6">
        <div className="text-center space-y-2">
          <Logo className="justify-center" />
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800 pt-2">
            Reset Password
          </h1>
          <p className="text-xs text-brandText-secondary">
            {step === 1 && "Enter your email address to receive a secure recovery OTP."}
            {step === 2 && "Enter the 4-digit code sent to your email and your new password."}
            {step === 3 && "Your password has been changed successfully."}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-bold shadow-card"
            >
              Send Reset Code
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">
                4-Digit OTP Code (Demo: 4829)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="4829"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-widest font-mono font-bold text-lg py-2.5 bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">
                New Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-bold shadow-card"
            >
              Update Password
            </Button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-forest-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-xs text-brandText-secondary">
              You can now log in using your updated credentials.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Proceed to Sign In
            </Button>
          </div>
        )}

        <div className="text-center text-xs text-brandText-secondary pt-2 border-t border-brandBorder-subtle">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-bold text-forest-700 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
