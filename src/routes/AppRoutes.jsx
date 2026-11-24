import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import WorkspaceLayout from '../components/workspace/WorkspaceLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Patient Facing Pages
import HomePage from '../pages/HomePage';
import AppointmentsPage from '../pages/AppointmentsPage';
import ShopPage from '../pages/ShopPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import OrdersPage from '../pages/OrdersPage';
import RefersPage from '../pages/RefersPage';
import ProfilePage from '../pages/ProfilePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import TermsConditionsPage from '../pages/TermsConditionsPage';
import NotFoundPage from '../pages/NotFoundPage';

// Super Admin Workspace Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminPrescriptionsPage from '../pages/admin/AdminPrescriptionsPage';
import AdminEntitiesPage from '../pages/admin/AdminEntitiesPage';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminFinancePage from '../pages/admin/AdminFinancePage';
import AdminAppointmentsPage from '../pages/admin/AdminAppointmentsPage';
import AdminHomepageControlsPage from '../pages/admin/AdminHomepageControlsPage';
import AdminBookingRulesPage from '../pages/admin/AdminBookingRulesPage';
import AdminAssignDoctorsPage from '../pages/admin/AdminAssignDoctorsPage';

// Doctor Workspace Pages
import DoctorOverview from '../pages/doctor/DoctorOverview';
import DoctorQueuePage from '../pages/doctor/DoctorQueuePage';
import DoctorAppointmentsPage from '../pages/doctor/DoctorAppointmentsPage';
import DoctorPatientsPage from '../pages/doctor/DoctorPatientsPage';
import DoctorSchedulePage from '../pages/doctor/DoctorSchedulePage';
import DoctorClinicsPage from '../pages/doctor/DoctorClinicsPage';

// Pharmacy Workspace Pages
import PharmacyOverview from '../pages/pharmacy/PharmacyOverview';
import PrescriptionReviewPage from '../pages/pharmacy/PrescriptionReviewPage';
import PharmacyOrdersPage from '../pages/pharmacy/PharmacyOrdersPage';
import QRPickupVerificationPage from '../pages/pharmacy/QRPickupVerificationPage';
import PharmacyInventoryPage from '../pages/pharmacy/PharmacyInventoryPage';
import PharmacyWalletPage from '../pages/pharmacy/PharmacyWalletPage';

// Rider Workspace Pages
import RiderDashboardPage from '../pages/rider/RiderDashboardPage';
import RiderDeliveriesPage from '../pages/rider/RiderDeliveriesPage';
import RiderProfilePage from '../pages/rider/RiderProfilePage';
import RiderHistoryPage from '../pages/rider/RiderHistoryPage';
import RiderCashPage from '../pages/rider/RiderCashPage';
import RiderEarningsPage from '../pages/rider/RiderEarningsPage';

// Receptionist Workspace Pages
import ReceptionistOverview from '../pages/receptionist/ReceptionistOverview';
import ReceptionistQueuePage from '../pages/receptionist/ReceptionistQueuePage';
import PatientRegistrationPage from '../pages/receptionist/PatientRegistrationPage';
import ReceptionistAppointmentsPage from '../pages/receptionist/ReceptionistAppointmentsPage';
import ReceptionistDoctorsPage from '../pages/receptionist/ReceptionistDoctorsPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Patient Experience & Public Store Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="product/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route
          path="refers"
          element={
            <ProtectedRoute>
              <RefersPage />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="privacy" element={<PrivacyPolicyPage />} />
        <Route path="terms-conditions" element={<TermsConditionsPage />} />
        <Route path="terms" element={<TermsConditionsPage />} />

        {/* Protected Patient Routes */}
        <Route
          path="checkout"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SUPER_ADMIN']}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'SUPER_ADMIN']}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 2. Super Admin Workspace */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
            <WorkspaceLayout roleTitle="Super Admin Console" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="analytics" element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="prescriptions" element={<AdminPrescriptionsPage />} />
        <Route path="appointments" element={<AdminAppointmentsPage />} />
        
        {/* Dedicated Staff & Entity Management Pages & Tabs */}
        <Route path="staff" element={<AdminEntitiesPage initialTab="clinics" />} />
        <Route path="staff-management" element={<AdminEntitiesPage initialTab="clinics" />} />
        <Route path="clinics" element={<AdminEntitiesPage initialTab="clinics" />} />
        <Route path="doctors" element={<AdminEntitiesPage initialTab="doctors" />} />
        <Route path="pharmacies" element={<AdminEntitiesPage initialTab="pharmacies" />} />
        <Route path="riders" element={<AdminEntitiesPage initialTab="riders" />} />
        <Route path="users" element={<AdminEntitiesPage initialTab="users" />} />
        <Route path="locations" element={<AdminEntitiesPage initialTab="locations" />} />

        {/* Platform Controls */}
        <Route path="assign-doctors" element={<AdminAssignDoctorsPage />} />
        <Route path="homepage-controls" element={<AdminHomepageControlsPage />} />
        <Route path="booking-rules" element={<AdminBookingRulesPage />} />

        {/* Commerce & Stock: Only Inventory */}
        <Route path="inventory" element={<AdminProductsPage />} />
        <Route path="products" element={<Navigate to="/admin/inventory" replace />} />

        {/* Finance: Settlements & Wallet */}
        <Route path="finance" element={<AdminFinancePage />} />
      </Route>

      {/* 3. Doctor Workspace */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR', 'SUPER_ADMIN']}>
            <WorkspaceLayout roleTitle="Doctor Clinical Workspace" />
          </ProtectedRoute>
        }
      >
        <Route index element={<DoctorOverview />} />
        <Route path="queue" element={<DoctorQueuePage />} />
        <Route path="appointments" element={<DoctorAppointmentsPage />} />
        <Route path="patients" element={<DoctorPatientsPage />} />
        <Route path="schedule" element={<Navigate to="/doctor/clinics" replace />} />
        <Route path="clinics" element={<DoctorClinicsPage />} />
      </Route>

      {/* 4. Pharmacist / Pharmacy Workspace */}
      <Route
        path="/pharmacy"
        element={
          <ProtectedRoute allowedRoles={['PHARMACY', 'PHARMACIST', 'SUPER_ADMIN']}>
            <WorkspaceLayout roleTitle="Pharmacy Operations Desk" />
          </ProtectedRoute>
        }
      >
        <Route index element={<PharmacyOverview />} />
        <Route path="prescriptions" element={<PrescriptionReviewPage />} />
        <Route path="orders" element={<PharmacyOrdersPage />} />
        <Route path="pickup" element={<QRPickupVerificationPage />} />
        <Route path="inventory" element={<PharmacyInventoryPage />} />
        <Route path="wallet" element={<PharmacyWalletPage />} />
      </Route>

      {/* 5. Rider Workspace */}
      <Route
        path="/rider"
        element={
          <ProtectedRoute allowedRoles={['RIDER', 'SUPER_ADMIN']}>
            <WorkspaceLayout roleTitle="Rider Delivery Desk" />
          </ProtectedRoute>
        }
      >
        <Route index element={<RiderDashboardPage />} />
        <Route path="deliveries" element={<RiderDeliveriesPage />} />
        <Route path="profile" element={<RiderProfilePage />} />
        <Route path="history" element={<RiderHistoryPage />} />
        <Route path="cash" element={<RiderCashPage />} />
        <Route path="earnings" element={<RiderEarningsPage />} />
      </Route>

      {/* 6. Receptionist Workspace */}
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST', 'SUPER_ADMIN']}>
            <WorkspaceLayout roleTitle="Clinic Reception Desk" />
          </ProtectedRoute>
        }
      >
        <Route index element={<ReceptionistOverview />} />
        <Route path="queue" element={<ReceptionistQueuePage />} />
        <Route path="registration" element={<PatientRegistrationPage />} />
        <Route path="appointments" element={<ReceptionistAppointmentsPage />} />
        <Route path="doctors" element={<ReceptionistDoctorsPage />} />
        <Route path="manage-doctors" element={<ReceptionistDoctorsPage initialTab="manage" />} />
        <Route path="assign-doctors" element={<ReceptionistDoctorsPage initialTab="assign" />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
