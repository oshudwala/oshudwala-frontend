import React, { useState } from 'react';
import { NavLink, Link, useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { MapPin, ChevronDown, Bell, ShoppingBag, Menu, X, LogIn, UserPlus, LayoutDashboard, Globe } from 'lucide-react';
import Logo from '../common/Logo';
import { useLocation } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import NotificationsDropdown from '../common/NotificationsDropdown';
import UserMenuDropdown from '../common/UserMenuDropdown';
import LocationModal from './LocationModal';
import Button from '../common/Button';

export const Header = () => {
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();
  const { selectedLocation, setIsLocationModalOpen, refreshLocations } = useLocation();
  const { itemCount, setIsCartDrawerOpen } = useCart();
  const { user, isAuthenticated, isPatient, getRoleDefaultPath, logout } = useAuth();
  const { language, setLanguage, t, isBengali } = useLanguage();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: t('nav_home', 'Home'), path: '/' },
    { name: t('nav_appointments', 'Appointments'), path: '/appointments' },
    { name: t('nav_shop', 'Shop'), path: '/shop' },
    { name: t('nav_orders', 'Orders'), path: '/orders' },
    { name: t('nav_refers', 'Refers'), path: '/refers' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-pure/95 backdrop-blur-md border-b border-brandBorder-subtle shadow-subtle transition-all">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[64px] sm:h-20 py-2 sm:py-0">
            {/* Left: Brand Logo & Location (Stacked on Mobile, Side-by-Side on Desktop) */}
            <div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-6">
              <Link to="/" className="flex items-center">
                <img
                  src="/logo-light.png"
                  alt="Oshud Wala Logo"
                  className="h-7 xs:h-8 sm:h-10 w-auto object-contain"
                />
              </Link>

              {/* Location Selector Pill: Below logo on mobile, side-by-side on desktop */}
              <button
                type="button"
                onClick={() => {
                  if (typeof refreshLocations === 'function') refreshLocations();
                  setIsLocationModalOpen(true);
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-full bg-forest-50/90 hover:bg-forest-100 text-forest-800 text-[10px] xs:text-[11px] sm:text-xs font-semibold transition-all border border-forest-100/90 max-w-[125px] xs:max-w-[155px] sm:max-w-[180px] shadow-2xs"
                title="Change delivery location"
              >
                <MapPin className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-forest-600 flex-shrink-0" />
                <span className="truncate">{selectedLocation?.label || 'Select Location'}</span>
                <ChevronDown className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-forest-600 flex-shrink-0" />
              </button>
            </div>

            {/* Center: Desktop Navigation Bar */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive =
                  link.path === '/'
                    ? routerLocation.pathname === '/'
                    : routerLocation.pathname.startsWith(link.path);

                return (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className={`relative py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'text-forest-700 font-bold'
                        : 'text-brandText-secondary hover:text-forest-700'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest-600 rounded-full animate-fade-in" />
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: Actions (Cart, Notification, Profile, Hamburger) */}
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-3.5">
              {/* Notification Bell (Only visible when logged in) */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen((prev) => !prev)}
                    className="p-1.5 xs:p-2 sm:p-2.5 rounded-full hover:bg-forest-50 text-brandText-secondary hover:text-forest-700 transition-colors relative"
                    aria-label="View notifications"
                  >
                    <Bell className="w-4 h-4 xs:w-5 xs:h-5" />
                    <span className="absolute top-0.5 right-0.5 xs:top-1 xs:right-1 w-3.5 h-3.5 xs:w-4 xs:h-4 bg-rose-500 text-white text-[9px] xs:text-[10px] font-bold rounded-full flex items-center justify-center ring-1.5 ring-white">
                      2
                    </span>
                  </button>
                  <NotificationsDropdown
                    isOpen={isNotifOpen}
                    onClose={() => setIsNotifOpen(false)}
                  />
                </div>
              )}

              {/* Cart Button (Always visible on all pages in Header) */}
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-2 py-1.5 sm:py-2 rounded-full bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95 group border border-forest-700"
                aria-label="Open Cart"
                title="View your medicine cart"
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-300 group-hover:rotate-6 transition-transform" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-extrabold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center ring-1 ring-white">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden xs:inline text-white font-heading font-extrabold tracking-tight">
                  {t('cart', 'Cart')}
                </span>
              </button>

              {/* Conditional Auth: Profile Avatar if logged in, Login/Register buttons if not */}
              {isAuthenticated ? (
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  {/* Explicit Role-Based Workspace Entry Point */}
                  {!isPatient && (
                    <Link
                      to={getRoleDefaultPath(user?.role)}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold transition-all shadow-sm hover:scale-[1.02]"
                      title="Open your role workspace dashboard"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{t('go_to_dashboard', 'Go to Dashboard')}</span>
                    </Link>
                  )}

                  {/* Profile Pill / User Menu Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen((prev) => !prev)}
                      className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-forest-50 border border-brandBorder-subtle transition-all bg-surface-pure shadow-2xs hover:shadow-xs group"
                      aria-label="User account"
                      title="My Profile & Settings"
                    >
                      <img
                        src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                        alt={user?.name || "User Profile"}
                        className="w-7 h-7 xs:w-8 xs:h-8 rounded-full object-cover border border-forest-600 shadow-2xs group-hover:scale-105 transition-transform"
                      />
                      <span className="hidden sm:inline text-xs font-bold text-forest-900 max-w-[105px] truncate">
                        {user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || (isBengali ? 'প্রোফাইল' : 'Profile')}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-forest-600 transition-transform group-hover:translate-y-0.5" />
                    </button>
                    <UserMenuDropdown
                      isOpen={isUserMenuOpen}
                      onClose={() => setIsUserMenuOpen(false)}
                    />
                  </div>
                </div>
              ) : (
                /* Login and Sign Up Buttons */
                <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                  <Link
                    to="/login"
                    className="px-2 xs:px-2.5 sm:px-3.5 py-1 sm:py-2 text-[11px] xs:text-xs font-bold text-forest-700 hover:text-forest-900 transition-colors rounded-full hover:bg-forest-50"
                  >
                    {t('sign_in', 'Sign In')}
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/register')}
                    className="hidden xs:inline-flex text-[11px] sm:text-xs py-1 sm:py-2 px-2.5 sm:px-4 shadow-sm"
                  >
                    {t('register', 'Register')}
                  </Button>
                </div>
              )}

              {/* Mobile Menu Hamburger */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="p-1.5 xs:p-2 lg:hidden rounded-xl text-brandText-secondary hover:text-forest-700 hover:bg-forest-50 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 xs:w-6 xs:h-6" /> : <Menu className="w-5 h-5 xs:w-6 xs:h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-brandBorder-subtle bg-surface-pure px-4 py-4 space-y-3 animate-fade-in">
            {/* Mobile Location Selector */}
            <div className="pb-2 border-b border-brandBorder-subtle">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (typeof refreshLocations === 'function') refreshLocations();
                  setIsLocationModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-forest-50 text-xs font-semibold text-forest-800"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-forest-600" />
                  <span>{selectedLocation?.label || 'Select Location'} ({selectedLocation?.area || selectedLocation?.city || 'Delivery'})</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-forest-600" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const isActive =
                  link.path === '/'
                    ? routerLocation.pathname === '/'
                    : routerLocation.pathname.startsWith(link.path);

                return (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-forest-100 text-forest-800 font-bold'
                        : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-700'
                    }`}
                  >
                    {link.name}
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Language Switcher Row */}
            <div className="pt-2 border-t border-brandBorder-subtle flex items-center justify-between text-xs font-semibold text-forest-900">
              <span className="flex items-center gap-1.5 text-brandText-secondary">
                <Globe className="w-4 h-4 text-forest-600" />
                <span>Language / ভাষা</span>
              </span>
              <div className="flex items-center p-0.5 bg-forest-50 rounded-xl border border-forest-200">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    !isBengali ? 'bg-forest-800 text-white shadow-xs' : 'text-forest-800 hover:bg-forest-100'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    isBengali ? 'bg-forest-800 text-white shadow-xs' : 'text-forest-800 hover:bg-forest-100'
                  }`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            {/* Mobile Auth Buttons */}
            <div className="pt-2 border-t border-brandBorder-subtle space-y-2">
              {isAuthenticated ? (
                <>
                  {!isPatient && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate(getRoleDefaultPath(user?.role));
                      }}
                      className="w-full flex items-center justify-between p-2.5 bg-forest-800 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-emerald-300" />
                        <span>Go to {String(typeof user?.role === 'object' ? user?.role?.name : user?.role || '').replace('_', ' ')} Workspace</span>
                      </span>
                      <span className="text-[10px] text-emerald-300 font-bold uppercase">Open &rarr;</span>
                    </button>
                  )}
                  <div className="flex items-center justify-between p-2.5 bg-surface-warm rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user?.avatar}
                        alt={user?.name}
                        className="w-8 h-8 rounded-full object-cover border border-forest-600"
                      />
                      <div>
                        <p className="text-xs font-bold text-forest-800">{user?.name || user?.fullName}</p>
                        <p className="text-[10px] text-brandText-secondary capitalize">
                          {String(typeof user?.role === 'object' ? user?.role?.name : user?.role || '').toLowerCase().replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-xs text-rose-600 font-semibold px-2 py-1 rounded hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="w-full text-xs"
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/register');
                    }}
                    className="w-full text-xs"
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Location Selector Modal */}
      <LocationModal />
    </>
  );
};

export default Header;
