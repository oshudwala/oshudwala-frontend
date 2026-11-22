import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import Button from './Button';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin" />
        <p className="text-xs text-brandText-secondary font-medium">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const rawRole = typeof user?.role === 'object' ? (user?.role?.name || user?.role?.role) : user?.role;
    let userRole = (rawRole ? String(rawRole).trim().toUpperCase() : '');
    if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') userRole = 'SUPER_ADMIN';

    const hasRole = allowedRoles.some((r) => {
      const allowed = String(r).trim().toUpperCase();
      if (allowed === userRole) return true;
      if ((allowed === 'SUPER_ADMIN' || allowed === 'ADMIN') && (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN')) return true;
      return false;
    });

    if (!hasRole) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-surface-pure rounded-3xl p-8 border border-rose-200 shadow-card text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="font-heading font-bold text-xl text-forest-800">Access Restricted</h2>
            <p className="text-xs text-brandText-secondary leading-relaxed">
              Your account role (<span className="font-bold text-rose-600">{userRole || 'PATIENT'}</span>) does not have authorization to view this section.
            </p>
            <div className="pt-2">
              <Button variant="primary" size="md" onClick={() => (window.location.href = '/')} className="w-full">
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
