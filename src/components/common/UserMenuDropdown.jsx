import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  FileText,
  Calendar,
  ShoppingBag,
  Gift,
  Wallet,
  LogOut,
  Settings,
  Shield,
  Stethoscope,
  Building2,
  Bike,
  UserCheck,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserMenuDropdown = ({ isOpen, onClose }) => {
  const { user, logout, isSuperAdmin, isDoctor, isPharmacy, isRider, isReceptionist, isPatient, getRoleDefaultPath } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const roleWorkspaces = [];
  if (isSuperAdmin) {
    roleWorkspaces.push({ label: 'Super Admin Console', icon: Shield, path: '/admin', highlight: true });
  }
  if (isDoctor || isSuperAdmin) {
    roleWorkspaces.push({ label: 'Doctor Workspace', icon: Stethoscope, path: '/doctor' });
  }
  if (isPharmacy || isSuperAdmin) {
    roleWorkspaces.push({ label: 'Pharmacy Operations', icon: Building2, path: '/pharmacy' });
  }
  if (isRider || isSuperAdmin) {
    roleWorkspaces.push({ label: 'Rider Delivery Desk', icon: Bike, path: '/rider' });
  }
  if (isReceptionist || isSuperAdmin) {
    roleWorkspaces.push({ label: 'Receptionist Desk', icon: UserCheck, path: '/receptionist' });
  }

  const patientItems = [
    { label: 'My Profile', icon: User, path: '/profile' },
    { label: 'Appointments & Tokens', icon: Calendar, path: '/appointments' },
    { label: 'My Orders', icon: ShoppingBag, path: '/orders' },
    { label: 'My Prescriptions', icon: FileText, path: '/profile?tab=prescriptions' },
    { label: 'Refer & Earn Coins', icon: Gift, path: '/refers' },
    { label: 'Oshud Wallet', icon: Wallet, path: '/profile?tab=wallet' },
    { label: 'Account Settings', icon: Settings, path: '/profile?tab=settings' },
  ];

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-64 bg-surface-pure rounded-2xl shadow-floating border border-brandBorder-subtle z-50 overflow-hidden animate-fade-in"
    >
      {/* User Header */}
      <div className="p-4 border-b border-brandBorder-subtle bg-surface-warm flex items-center gap-3">
        <img
          src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
          alt={user?.name || "Patient"}
          className="w-10 h-10 rounded-full object-cover border-2 border-forest-500/40"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-forest-800 truncate">
            {user?.fullName || user?.name || "User"}
          </p>
          <span className="inline-block text-[9px] font-bold text-forest-700 bg-forest-100 px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5">
            {user?.role || 'PATIENT'}
          </span>
          <p className="text-[11px] text-brandText-secondary truncate mt-0.5">
            {user?.email || user?.phone}
          </p>
        </div>
      </div>

      {/* Prominent Go to Dashboard for Non-Patient Roles */}
      {!isPatient && (
        <div className="p-3 bg-forest-900 border-b border-forest-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(getRoleDefaultPath(user?.role));
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-forest-700 hover:bg-forest-600 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-md transition-all group"
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-emerald-300" />
              <span>Go to Dashboard</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-emerald-200" />
          </button>
        </div>
      )}

      {/* Role Workspaces if any */}
      {roleWorkspaces.length > 0 && (
        <div className="py-1.5 border-b border-brandBorder-subtle bg-forest-50/40">
          <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-forest-800">
            Workspaces
          </p>
          {roleWorkspaces.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  onClose();
                  navigate(item.path);
                }}
                className="w-full px-4 py-2 text-left text-xs font-bold text-forest-800 hover:bg-forest-100/60 flex items-center gap-2.5 transition-colors"
              >
                <Icon className="w-4 h-4 text-forest-600" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Links */}
      <div className="py-2">
        {patientItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => {
                onClose();
                navigate(item.path);
              }}
              className="w-full px-4 py-2 text-left text-xs text-brandText-main hover:bg-forest-50 hover:text-forest-700 font-medium flex items-center gap-2.5 transition-colors"
            >
              <Icon className="w-4 h-4 text-forest-600" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div className="p-2 border-t border-brandBorder-subtle bg-surface-warm">
        <button
          onClick={() => {
            onClose();
            logout();
            navigate('/login');
          }}
          className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-semibold flex items-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default UserMenuDropdown;
