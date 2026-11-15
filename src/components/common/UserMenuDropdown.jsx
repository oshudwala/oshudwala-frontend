import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, FileText, Calendar, ShoppingBag, Gift, Wallet, LogOut, Settings } from 'lucide-react';
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

  const menuItems = [
    { label: 'My Profile', icon: User, path: '/profile' },
    { label: 'Appointments & Tokens', icon: Calendar, path: '/appointments' },
    { label: 'My Orders', icon: ShoppingBag, path: '/orders' },
    { label: 'My Prescriptions', icon: FileText, path: '/profile?tab=prescriptions' },
    { label: 'Refer & Earn Coins', icon: Gift, path: '/refers' },
    { label: 'Oshud Wallet (৳250)', icon: Wallet, path: '/profile?tab=wallet' },
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
            {user?.name || "Ayon Paul"}
          </p>
          <p className="text-[11px] text-brandText-secondary truncate">
            {user?.email || "ayon@oshudwala.com"}
          </p>
        </div>
      </div>

      {/* Links */}
      <div className="py-2">
        {menuItems.map((item) => {
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
