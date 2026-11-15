import React, { useState } from 'react';
import { NavLink, useLocation as useRouterLocation } from 'react-router-dom';
import { MapPin, ChevronDown, Bell, ShoppingBag, Menu, X, Search } from 'lucide-react';
import Logo from '../common/Logo';
import { useLocation } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import NotificationsDropdown from '../common/NotificationsDropdown';
import UserMenuDropdown from '../common/UserMenuDropdown';
import LocationModal from './LocationModal';

export const Header = () => {
  const routerLocation = useRouterLocation();
  const { selectedLocation, setIsLocationModalOpen } = useLocation();
  const { itemCount, setIsCartDrawerOpen } = useCart();
  const { user } = useAuth();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Appointments', path: '/appointments' },
    { name: 'Shop', path: '/shop' },
    { name: 'Orders', path: '/orders' },
    { name: 'Refers', path: '/refers' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-pure/95 backdrop-blur-md border-b border-brandBorder-subtle shadow-subtle transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Brand Logo & Location */}
            <div className="flex items-center gap-6">
              <Logo />

              {/* Location Selector Pill */}
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-50 hover:bg-forest-100/80 text-forest-800 text-xs font-semibold transition-all border border-forest-100"
                title="Change delivery location"
              >
                <MapPin className="w-3.5 h-3.5 text-forest-600 flex-shrink-0" />
                <span className="truncate max-w-[130px]">{selectedLocation.label}</span>
                <ChevronDown className="w-3 h-3 text-forest-600" />
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

            {/* Right: Actions (Notifications, Cart, User Profile) */}
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotifOpen((prev) => !prev)}
                  className="p-2.5 rounded-full hover:bg-forest-50 text-brandText-secondary hover:text-forest-700 transition-colors relative"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    2
                  </span>
                </button>
                <NotificationsDropdown
                  isOpen={isNotifOpen}
                  onClose={() => setIsNotifOpen(false)}
                />
              </div>

              {/* Cart Icon with Item Counter */}
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="p-2.5 rounded-full hover:bg-forest-50 text-brandText-secondary hover:text-forest-700 transition-colors relative"
                aria-label="Open cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-forest-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Profile Avatar / User Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-forest-300 transition-all"
                  aria-label="User account"
                >
                  <img
                    src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                    alt={user?.name || "Patient Profile"}
                    className="w-9 h-9 rounded-full object-cover border-2 border-forest-600 shadow-sm"
                  />
                </button>
                <UserMenuDropdown
                  isOpen={isUserMenuOpen}
                  onClose={() => setIsUserMenuOpen(false)}
                />
              </div>

              {/* Mobile Menu Hamburger */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="p-2 lg:hidden rounded-xl text-brandText-secondary hover:bg-forest-50 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                  setIsLocationModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-forest-50 text-xs font-semibold text-forest-800"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-forest-600" />
                  <span>{selectedLocation.label} ({selectedLocation.area})</span>
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
          </div>
        )}
      </header>

      {/* Location Selector Modal */}
      <LocationModal />
    </>
  );
};

export default Header;
