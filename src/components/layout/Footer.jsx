import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Linkedin, Twitter, ArrowUpRight } from 'lucide-react';
import Logo from '../common/Logo';

export const Footer = () => {
  return (
    <footer className="bg-forest-900 text-white pt-16 pb-10 border-t border-forest-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-forest-800/80">
          {/* Brand Info */}
          <div className="lg:col-span-1 space-y-4">
            <Logo variant="light" />
            <p className="text-xs text-forest-200/90 leading-relaxed max-w-sm">
              Your trusted healthcare partner for medicines, doctor appointments, and verified pharmacy care. Closer to you, wherever you are.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-2">
              {[
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Youtube, href: '#', label: 'YouTube' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
                { icon: Twitter, href: '#', label: 'X' },
              ].map((s, idx) => {
                const Icon = s.icon;
                return (
                  <a
                    key={idx}
                    href={s.href}
                    aria-label={s.label}
                    className="w-8 h-8 rounded-full bg-forest-800 hover:bg-forest-600 flex items-center justify-center text-forest-200 hover:text-white transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-sm text-white mb-4 tracking-wide">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs text-forest-200">
              <li>
                <Link to="/" className="hover:text-emerald-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/appointments" className="hover:text-emerald-300 transition-colors">
                  Appointments
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-emerald-300 transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-emerald-300 transition-colors">
                  Orders
                </Link>
              </li>
              <li>
                <Link to="/refers" className="hover:text-emerald-300 transition-colors">
                  Refers & Earn
                </Link>
              </li>
            </ul>
          </div>

          {/* Healthcare Services */}
          <div>
            <h4 className="font-heading font-bold text-sm text-white mb-4 tracking-wide">
              Healthcare
            </h4>
            <ul className="space-y-2.5 text-xs text-forest-200">
              <li>
                <Link to="/appointments" className="hover:text-emerald-300 transition-colors">
                  Find Doctors
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-emerald-300 transition-colors">
                  Find Pharmacies
                </Link>
              </li>
              <li>
                <Link to="/profile?tab=prescriptions" className="hover:text-emerald-300 transition-colors">
                  Upload Prescription
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-emerald-300 transition-colors">
                  Medicine Categories
                </Link>
              </li>
              <li>
                <Link to="/appointments" className="hover:text-emerald-300 transition-colors">
                  Live Queue Tokens
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-heading font-bold text-sm text-white mb-4 tracking-wide">
              Support
            </h4>
            <ul className="space-y-2.5 text-xs text-forest-200">
              <li>
                <a href="#faq" className="hover:text-emerald-300 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-emerald-300 transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <a href="https://wa.me/919800000000" target="_blank" rel="noreferrer" className="hover:text-emerald-300 transition-colors flex items-center gap-1">
                  Contact Support <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="text-forest-400 cursor-not-allowed">
                  Terms & Conditions
                </span>
              </li>
              <li>
                <span className="text-forest-400 cursor-not-allowed">
                  Privacy Policy
                </span>
              </li>
            </ul>
          </div>

          {/* Download Our App */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-sm text-white mb-4 tracking-wide">
              Download Our App
            </h4>
            <p className="text-xs text-forest-200 leading-snug">
              Experience fast medicine delivery and queue tracking on iOS & Android.
            </p>

            <div className="space-y-2.5 pt-1">
              {/* Google Play Badge */}
              <a
                href="#download"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-forest-800 hover:bg-forest-700/80 border border-forest-700 transition-all text-white"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.61-.735V2.55c.162-.295.385-.548.609-.736zm11.305 11.308l2.67-2.67-12.44-7.072 9.77 9.742zm2.67-2.67l3.87 2.2a1.44 1.44 0 0 1 0 2.496l-3.87 2.2-2.385-2.448 2.385-2.448zm-12.44 7.072l12.44-7.072-2.67-2.67-9.77 9.742z" />
                </svg>
                <div className="text-left">
                  <p className="text-[9px] uppercase tracking-wider text-forest-300 leading-none">GET IT ON</p>
                  <p className="text-xs font-bold leading-tight">Google Play</p>
                </div>
              </a>

              {/* App Store Badge */}
              <a
                href="#download"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-forest-800 hover:bg-forest-700/80 border border-forest-700 transition-all text-white"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.86.96-2.94-1 .04-2.13.66-2.8 1.44-.58.67-1.1 1.76-.96 2.82 1.11.09 2.16-.54 2.8-1.32z" />
                </svg>
                <div className="text-left">
                  <p className="text-[9px] uppercase tracking-wider text-forest-300 leading-none">DOWNLOAD ON THE</p>
                  <p className="text-xs font-bold leading-tight">App Store</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-forest-300 gap-3">
          <p>© 2025 Oshud Wala. All rights reserved.</p>
          <p className="text-emerald-400 font-medium">Better Healthcare. A Healthier Tomorrow.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
