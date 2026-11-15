import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';
import { useAuth } from '../../context/AuthContext';
import UnderProgressPage from '../../pages/UnderProgressPage';

export const MainLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Auth pages should always render directly
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  // If logged in as Doctor or Pharmacist, show the "Still under progress" page across patient portal
  const isNonPatientRole = isAuthenticated && user?.role && user.role !== 'patient' && !isAuthPage;

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-brandText-main selection:bg-forest-100 selection:text-forest-800">
      <Header />
      <main className="flex-1">
        {isNonPatientRole ? (
          <UnderProgressPage />
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
      {!isNonPatientRole && <CartDrawer />}
    </div>
  );
};

export default MainLayout;
