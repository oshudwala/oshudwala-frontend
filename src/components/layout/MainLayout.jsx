import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, ArrowRight } from 'lucide-react';

export const MainLayout = () => {
  const { user, isAuthenticated, isPatient, getRoleDefaultPath } = useAuth();
  const location = useLocation();

  // Auth pages should always render directly
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  const isWorkspaceUser = isAuthenticated && !isPatient && user?.role && !isAuthPage;

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-brandText-main selection:bg-forest-100 selection:text-forest-800">
      {/* Non-patient staff notification banner on patient site */}
      {isWorkspaceUser && (
        <div className="bg-forest-900 text-white text-xs py-2 px-4 border-b border-forest-800/80 sticky top-0 z-50 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Logged in as <strong className="uppercase tracking-wider text-forest-200">{user.role}</strong> ({user.name || user.fullName})
              </span>
            </div>
            <Link
              to={getRoleDefaultPath(user.role)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-700 hover:bg-forest-600 text-white font-bold transition-all hover:scale-[1.02]"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Go to {user.role.replace('_', ' ')} Workspace</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

export default MainLayout;
