import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserMenuDropdown = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
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
            {user?.role || 'PATIENT'}
          </span>
          <p className="text-[10px] text-brandText-secondary truncate mt-0.5">
            {user?.email || user?.phone}
          </p>
        </div>
      </div>

      {/* Menu Actions: Only My Profile & Logout */}
      <div className="p-1.5 space-y-1">
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
          <span>My Profile</span>
        </button>

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
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default UserMenuDropdown;