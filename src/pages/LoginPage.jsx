import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('patient@oshudwala.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('patient');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password, role });
      addToast(`Logged in successfully as ${role.toUpperCase()}`, 'success');
      navigate('/');
    } catch {
      addToast('Login failed. Please check your credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoRole = (selectedRole, demoEmail) => {
    setRole(selectedRole);
    setEmail(demoEmail);
    setPassword('demo1234');
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
            Sign in to access your prescriptions, appointments & orders
          </p>
        </div>

        {/* Demo Role Switcher */}
        <div className="p-3 bg-forest-50/80 rounded-2xl border border-forest-100 text-center space-y-2">
          <p className="text-[11px] font-bold text-forest-800 flex items-center justify-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-forest-600" />
            Quick Demo Role Switcher
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleDemoRole('patient', 'patient@oshudwala.com')}
              className={`py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
                role === 'patient'
                  ? 'bg-forest-600 text-white border-forest-600 shadow-sm'
                  : 'bg-surface-pure text-forest-700 border-forest-200'
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => handleDemoRole('doctor', 'dr.priya@oshudwala.com')}
              className={`py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
                role === 'doctor'
                  ? 'bg-forest-600 text-white border-forest-600 shadow-sm'
                  : 'bg-surface-pure text-forest-700 border-forest-200'
              }`}
            >
              Doctor
            </button>
            <button
              type="button"
              onClick={() => handleDemoRole('pharmacist', 'medplus@oshudwala.com')}
              className={`py-1.5 text-[11px] font-bold rounded-xl border transition-all ${
                role === 'pharmacist'
                  ? 'bg-forest-600 text-white border-forest-600 shadow-sm'
                  : 'bg-surface-pure text-forest-700 border-forest-200'
              }`}
            >
              Pharmacist
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">
              Email or Phone Number
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            rightIcon={ArrowRight}
            className="w-full shadow-card font-bold"
          >
            Sign In
          </Button>
        </form>

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
