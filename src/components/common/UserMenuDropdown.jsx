import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const UserMenuDropdown = ({ isOpen, onClose }) => {
  const { user, logout, isPatient, getRoleDefaultPath } = useAuth();
  const { t, isBengali, setLanguage } = useLanguage();
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

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-56 bg-surface-pure rounded-2xl shadow-floating border border-brandBorder-subtle z-50 overflow-hidden animate-fade-in"
    >
      {/* User Header */}
      <div className="p-3.5 border-b border-brandBorder-subtle bg-surface-warm flex items-center gap-2.5">
        <img
          src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
          alt={user?.name || "Patient"}
          className="w-9 h-9 rounded-full object-cover border-2 border-forest-500/40 flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-forest-800 truncate">
            {user?.fullName || user?.name || "User"}
          </p>
          <span className="inline-block text-[9px] font-bold text-forest-700 bg-forest-100 px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5">
            {typeof user?.role === 'object' ? user?.role?.name : user?.role || 'PATIENT'}
          </span>
          <p className="text-[10px] text-brandText-secondary truncate mt-0.5">
            {user?.email || user?.phone}
          </p>
        </div>
      </div>

      {/* Menu Actions: Workspace Dashboard, My Profile & Logout */}
      <div className="p-1.5 space-y-1">
        {/* Workspace Dashboard for Staff/Admin */}
        {!isPatient && (
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(getRoleDefaultPath(user?.role));
            }}
            className="w-full px-3 py-2 text-left text-xs font-bold text-white bg-forest-800 hover:bg-forest-900 rounded-xl flex items-center gap-2.5 transition-colors shadow-xs"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-300" />
            <span>{isBengali ? 'ড্যাশবোর্ড কনসোল' : 'Go to Dashboard'}</span>
          </button>
        )}

        {/* My Profile */}
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate('/profile');
          }}
          className="w-full px-3 py-2 text-left text-xs font-bold text-forest-800 hover:bg-forest-50 hover:text-forest-700 rounded-xl flex items-center gap-2.5 transition-colors"
        >
          <User className="w-4 h-4 text-forest-600" />
          <span>{isBengali ? 'আমার প্রোফাইল' : 'My Profile'}</span>
        </button>

        {/* Language Converter inside My Profile Drawer */}
        <div className="p-2.5 rounded-xl bg-forest-50/70 border border-forest-100 flex items-center justify-between gap-2 my-1">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-forest-600 shrink-0" />
            <span className="text-xs font-bold text-forest-900">
              {isBengali ? 'ভাষা' : 'Language'}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-forest-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                !isBengali
                  ? 'bg-forest-800 text-white shadow-xs'
                  : 'text-brandText-secondary hover:text-forest-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all ${
                isBengali
                  ? 'bg-forest-800 text-white shadow-xs'
                  : 'text-brandText-secondary hover:text-forest-900'
              }`}
            >
              বাং
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={() => {
            onClose();
            logout();
            navigate('/login');
          }}
          className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2.5 transition-colors border-t border-brandBorder-light"
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          <span>{isBengali ? 'লগআউট' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
};

export default UserMenuDropdown;