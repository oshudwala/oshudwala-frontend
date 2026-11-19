import React from 'react';
import { Bike, MapPin, Package, CheckCircle2, QrCode, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export const RiderDashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-20 h-20 rounded-full bg-teal-50 border-4 border-teal-600 flex items-center justify-center text-teal-700 shadow-card">
            <Bike className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800">
                {user?.fullName || user?.name || 'Rider Delivery Portal'}
              </h1>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                Logistics Partner
              </span>
            </div>
            <p className="text-xs text-brandText-secondary mt-1">{user?.email}</p>
            <p className="text-xs text-forest-600 font-semibold mt-0.5 font-mono">Mobile: {user?.phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Online for Orders
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
            <h3 className="font-heading font-bold text-lg text-forest-800">Assigned Delivery Orders</h3>
            <p className="text-xs text-brandText-secondary">
              Orders dispatched from nearby partner pharmacies for door delivery
            </p>

            <div className="p-5 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  READY FOR PICKUP
                </span>
                <span className="text-xs font-mono font-bold text-forest-800">#OSH-2026-7821</span>
              </div>
              <div>
                <p className="text-xs font-bold text-forest-800">Pickup: Oshud Wala Pharmacy (City Centre)</p>
                <p className="text-xs text-brandText-secondary mt-0.5">Drop: Bidhannagar, Durgapur 713212</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button variant="primary" size="sm" leftIcon={QrCode}>
                  Scan Pickup QR
                </Button>
                <Button variant="outline" size="sm" leftIcon={Phone}>
                  Call Customer
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-3">
            <h3 className="font-heading font-bold text-base text-forest-800">Daily Payout & Earnings</h3>
            <div className="p-4 rounded-2xl bg-teal-800 text-white space-y-1">
              <p className="text-[11px] text-teal-200">Today's Completed Trips</p>
              <p className="text-2xl font-extrabold">₹650.00</p>
              <p className="text-[10px] text-teal-200">7 Orders Delivered (100% On Time)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboardPage;
