import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Globe,
  Bell,
  Menu,
  ChevronRight,
  LogOut,
  Shield,
  Stethoscope,
  Building2,
  Bike,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import NotificationsDropdown from '../common/NotificationsDropdown';
import UserMenuDropdown from '../common/UserMenuDropdown';

export const WorkspaceHeader = ({ roleTitle, onToggleSidebar, isSidebarCollapsed }) => {
  const { user, logout, isSuperAdmin } = useAuth();
  const { resetDefaults } = useWorkspaceStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Path segments for breadcrumbs
  const pathParts = location.pathname.split('/').filter(Boolean);

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN':
        return Shield;
      case 'DOCTOR':
        return Stethoscope;
      case 'PHARMACY':
      case 'PHARMACIST':
        return Building2;
      case 'RIDER':
        return Bike;
      case 'RECEPTIONIST':
        return UserCheck;
      default:
        return Shield;
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <header className="sticky top-0 z-30 bg-surface-pure/95 backdrop-blur-md border-b border-brandBorder-subtle h-16 px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* Left: Mobile hamburger + Role Identifier & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-brandText-secondary hover:bg-forest-50 hover:text-forest-800 transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Role Badge */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-forest-50 border border-forest-100 text-forest-800 text-xs font-bold">
            <RoleIcon className="w-3.5 h-3.5 text-forest-600" />
            <span>{roleTitle || user?.role?.replace('_', ' ')}</span>
          </div>

          {/* Breadcrumb Trail */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs text-brandText-secondary">
            <ChevronRight className="w-3.5 h-3.5 text-brandText-muted" />
            {pathParts.map((part, index) => {
              const url = `/${pathParts.slice(0, index + 1).join('/')}`;
              const isLast = index === pathParts.length - 1;
              return (
                <React.Fragment key={url}>
                  {index > 0 && <ChevronRight className="w-3 h-3 text-brandText-muted" />}
                  <span
                    className={`capitalize ${
                      isLast ? 'font-bold text-forest-900' : 'text-brandText-muted'
                    }`}
                  >
                    {part.replace(/-/g, ' ')}
                  </span>
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Reset Demo Data quick utility button */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset simulated workspace orders, queue tokens and inventory to default values?')) {
              resetDefaults();
            }
          }}
          className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-forest-800 hover:bg-forest-50 border border-brandBorder-subtle transition-colors"
          title="Reset simulated live state across workspaces"
        >
          <RotateCcw className="w-3 h-3 text-forest-600" />
          <span>Reset Sync State</span>
        </button>

        {/* "Back to Patient Website" Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-50 hover:bg-forest-100 border border-forest-200 text-forest-800 text-xs font-bold transition-all hover:scale-[1.02]"
          title="Return to the public patient store and appointments"
        >
          <Globe className="w-3.5 h-3.5 text-forest-600" />
          <span className="hidden sm:inline">Back to Patient Website</span>
          <span className="sm:hidden">Store</span>
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="p-2 rounded-xl text-brandText-secondary hover:bg-forest-50 hover:text-forest-800 transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
          </button>
          <NotificationsDropdown
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
          />
        </div>

        {/* User Profile Avatar / Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-forest-50 transition-colors"
          >
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
              }
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover border border-forest-600 shadow-sm"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-forest-900 leading-tight">
                {user?.fullName || user?.name || 'Operator'}
              </p>
              <p className="text-[10px] text-brandText-secondary capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
          </button>
          <UserMenuDropdown
            isOpen={isUserMenuOpen}
            onClose={() => setIsUserMenuOpen(false)}
          />
        </div>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
