import React, { useState } from 'react';
import {
  Bike,
  MapPin,
  Phone,
  Building2,
  Navigation,
  CheckCircle,
  KeyRound,
  Coins,
  QrCode,
  ShieldCheck,
  Battery,
  Wifi,
  AlertCircle,
} from 'lucide-react';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const RiderDeliveriesPage = () => {
  const { user } = useAuth();
  const { orders, riders, verifyPickup, completeDelivery, toggleRiderOnline } = useWorkspaceStore();
  const { addToast } = useToast();

  const currentRider = riders.find((r) => r.id === user?.id) || riders[0];
  const isOnline = currentRider?.isOnline ?? true;

  const [enteredPickupCode, setEnteredPickupCode] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [activeModalOrder, setActiveModalOrder] = useState(null);
  const [modalType, setModalType] = useState('PICKUP'); // 'PICKUP' | 'DROP'

  // Active delivery orders (Ready for pickup or out for delivery)
  const activeDeliveries = orders.filter((o) =>
    ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status)
  );

  const handleToggleDuty = () => {
    toggleRiderOnline(currentRider.id, !isOnline);
    addToast(`You are now ${!isOnline ? 'ONLINE and accepting orders' : 'OFFLINE'}`, 'info');
  };

  const handleVerifyPickupSubmit = (e) => {
    e.preventDefault();
    if (!activeModalOrder) return;

    try {
      verifyPickup(activeModalOrder.id, enteredPickupCode);
      addToast(`Pickup verified for Order ${activeModalOrder.id}! Start trip to patient.`, 'success');
      setActiveModalOrder(null);
      setEnteredPickupCode('');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleVerifyDeliverySubmit = (e) => {
    e.preventDefault();
    if (!activeModalOrder) return;

    try {
      completeDelivery(activeModalOrder.id, enteredOtp, activeModalOrder.total);
      addToast(
        `Order ${activeModalOrder.id} successfully delivered! COD collected: ₹${activeModalOrder.total}`,
        'success'
      );
      setActiveModalOrder(null);
      setEnteredOtp('');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Mobile-First Rider Status Bar */}
      <div className="bg-surface-pure rounded-3xl p-5 border border-brandBorder-subtle shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
              }
              alt="Rider"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-forest-600"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-base sm:text-lg text-forest-900">
                {currentRider?.name || 'Rahul Das'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 uppercase">
                Hero Electric Fleet
              </span>
            </div>
            <p className="text-xs text-brandText-secondary mt-0.5">
              Zone: {currentRider?.zone || 'Kolkata South'} &bull; WB-02-AZ-4921
            </p>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-brandText-muted">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Battery className="w-3.5 h-3.5" /> 88% Battery
              </span>
              <span className="flex items-center gap-1 text-blue-700 font-semibold">
                <Wifi className="w-3.5 h-3.5" /> GPS Active
              </span>
            </div>
          </div>
        </div>

        {/* Online / Offline Toggle Button */}
        <button
          type="button"
          onClick={handleToggleDuty}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
            isOnline
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-ping' : 'bg-gray-500'}`} />
          <span>{isOnline ? 'Online & Available' : 'Go Online'}</span>
        </button>
      </div>

      {/* Cash in Hand Quick Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
          <p className="text-[10px] uppercase font-bold text-amber-800">COD Cash in Hand</p>
          <p className="font-mono font-extrabold text-xl text-amber-950 mt-1">
            ₹{(currentRider?.cashInHand || 0).toFixed(2)}
          </p>
          <p className="text-[10px] text-amber-800 mt-0.5">To be remitted today</p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
          <p className="text-[10px] uppercase font-bold text-emerald-800">Completed Trips</p>
          <p className="font-heading font-extrabold text-xl text-emerald-950 mt-1">
            {currentRider?.deliveriesToday || 7} Deliveries
          </p>
          <p className="text-[10px] text-emerald-800 mt-0.5">100% on-time record</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-forest-50/70 border border-forest-200 rounded-2xl p-4">
          <p className="text-[10px] uppercase font-bold text-forest-800">Today's Earnings</p>
          <p className="font-mono font-extrabold text-xl text-forest-950 mt-1">₹840.00</p>
          <p className="text-[10px] text-forest-800 mt-0.5">Base + express incentives</p>
        </div>
      </div>

      {/* Active Orders Delivery Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-extrabold text-base text-forest-900 flex items-center gap-2">
            <Bike className="w-5 h-5 text-forest-600" />
            <span>Active Delivery Queue ({activeDeliveries.length})</span>
          </h3>
          <span className="text-xs text-brandText-muted">Live sync enabled</span>
        </div>

        <div className="space-y-4">
          {activeDeliveries.map((order) => {
            const isReadyForPickup = order.status === 'READY_FOR_PICKUP';
            const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';

            return (
              <div
                key={order.id}
                className="bg-surface-pure rounded-3xl border-2 border-forest-500/40 shadow-card p-5 space-y-4 animate-fade-in"
              >
                {/* Header Strip */}
                <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-xs text-forest-900 bg-surface-warm px-2 py-1 rounded-lg border border-brandBorder-subtle">
                      {order.id}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-base text-forest-900">
                      ₹{order.total.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-amber-700 font-bold block uppercase">
                      {order.paymentMethod === 'COD' ? 'Collect Cash (COD)' : 'Prepaid Online'}
                    </span>
                  </div>
                </div>

                {/* Step 1: Pharmacy Pickup Card */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isReadyForPickup
                      ? 'bg-purple-50/70 border-purple-200 shadow-sm'
                      : 'bg-surface-warm/50 border-brandBorder-subtle opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-forest-900">
                        <Building2 className="w-4 h-4 text-purple-700" />
                        <span>Step 1: Pickup from {order.pharmacyName}</span>
                      </div>
                      <p className="text-xs text-brandText-secondary pl-6">{order.pharmacyAddress}</p>
                    </div>
                    {isReadyForPickup && (
                      <a
                        href={`tel:${order.pharmacyPhone}`}
                        className="p-2 rounded-xl bg-purple-100 text-purple-800 hover:bg-purple-200 text-xs font-bold flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Call Pharmacy</span>
                      </a>
                    )}
                  </div>

                  {isReadyForPickup && (
                    <div className="mt-3 pt-3 border-t border-purple-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="font-mono text-xs text-purple-900">
                        Pickup Token: <strong>{order.pickupQrCode}</strong>
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={QrCode}
                        onClick={() => {
                          setActiveModalOrder(order);
                          setModalType('PICKUP');
                          setEnteredPickupCode(order.pickupQrCode);
                        }}
                        className="text-xs font-bold px-4"
                      >
                        Verify Pickup Code
                      </Button>
                    </div>
                  )}
                </div>

                {/* Step 2: Patient Drop-off Card */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isOutForDelivery
                      ? 'bg-emerald-50/70 border-emerald-200 shadow-sm'
                      : 'bg-surface-warm/50 border-brandBorder-subtle opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-forest-900">
                        <MapPin className="w-4 h-4 text-emerald-700" />
                        <span>Step 2: Deliver to {order.customerName}</span>
                      </div>
                      <p className="text-xs text-brandText-secondary pl-6">{order.address}</p>
                      <p className="text-[11px] text-brandText-muted pl-6">
                        Landmark: <strong>{order.landmark}</strong> &bull; {order.area}
                      </p>
                    </div>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="p-2 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-bold flex items-center gap-1 flex-shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Call Customer</span>
                    </a>
                  </div>

                  {isOutForDelivery && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-xs text-emerald-900 font-semibold">
                        {order.paymentMethod === 'COD' ? (
                          <strong className="text-rose-700">Collect ₹{order.total} Cash</strong>
                        ) : (
                          'Paid Online'
                        )}
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={KeyRound}
                        onClick={() => {
                          setActiveModalOrder(order);
                          setModalType('DROP');
                          setEnteredOtp(order.deliveryOtp);
                        }}
                        className="text-xs font-bold px-4 bg-emerald-700 hover:bg-emerald-800"
                      >
                        Enter OTP & Complete Delivery
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {activeDeliveries.length === 0 && (
            <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-12 text-center space-y-3 shadow-card">
              <div className="w-16 h-16 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                <Bike className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-forest-900">
                All Deliveries Completed!
              </h3>
              <p className="text-xs text-brandText-secondary max-w-sm mx-auto">
                You have no active orders in your queue. Stay online to receive the next express medicine delivery request.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Handover / Dropoff Verification Dialog */}
      {activeModalOrder && modalType === 'PICKUP' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setActiveModalOrder(null)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-sm w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4">
            <h3 className="font-heading font-bold text-base text-forest-900">
              Confirm Pharmacy Handover
            </h3>
            <p className="text-xs text-brandText-secondary">
              Enter or scan the pharmacy pickup code printed on the tamper-proof sealed bag for{' '}
              <strong>{activeModalOrder.id}</strong>.
            </p>
            <form onSubmit={handleVerifyPickupSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-forest-800">Pickup Code</label>
                <input
                  type="text"
                  required
                  value={enteredPickupCode}
                  onChange={(e) => setEnteredPickupCode(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-mono font-bold bg-surface-warm uppercase"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveModalOrder(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="text-xs">
                  Verify & Start Trip
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModalOrder && modalType === 'DROP' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setActiveModalOrder(null)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-sm w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4">
            <h3 className="font-heading font-bold text-base text-forest-900">
              Customer Delivery Verification
            </h3>
            <p className="text-xs text-brandText-secondary">
              Ask customer <strong>{activeModalOrder.customerName}</strong> for their 4-digit SMS OTP
              code.
            </p>

            {activeModalOrder.paymentMethod === 'COD' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-bold flex items-center justify-between">
                <span>Collect Cash (COD):</span>
                <span className="font-mono text-base">₹{activeModalOrder.total.toFixed(2)}</span>
              </div>
            )}

            <form onSubmit={handleVerifyDeliverySubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-forest-800">Customer 4-Digit OTP</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 border border-brandBorder-subtle rounded-xl text-center text-lg font-mono font-extrabold tracking-widest bg-surface-warm"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveModalOrder(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="text-xs bg-emerald-700 hover:bg-emerald-800"
                >
                  Confirm Delivery
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderDeliveriesPage;
