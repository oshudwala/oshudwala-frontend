import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import AppRoutes from './routes/AppRoutes';
import NotificationPermissionBanner from './components/common/NotificationPermissionBanner';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <LanguageProvider>
            <CartProvider>
              <ToastProvider>
                <AppRoutes />
                <NotificationPermissionBanner />
              </ToastProvider>
            </CartProvider>
          </LanguageProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;