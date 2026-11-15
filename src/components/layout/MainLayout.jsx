import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-brandText-main selection:bg-forest-100 selection:text-forest-800">
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
