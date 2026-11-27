import React, { useState, useEffect } from 'react';
import {
  Bike,
  Building2,
  MapPin,
  Phone,
  QrCode,
  KeyRound,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import apiClient from '../../services/api/client';
import { riderApi } from '../../services/api/rider.api';
import PharmacyPickupModal from '../../components/rider/PharmacyPickupModal';
import DeliveryOtpModal from '../../components/rider/DeliveryOtpModal';

export const RiderDeliveriesPage = () => {
  const { user } = useAuth();
  const { orders, riders, verifyPickup, completeDelivery, toggleRiderOnline } = useWorkspaceStore();
  const { addToast } = useToast();

  const [riderProfile, setRiderProfile] = useState(() => riderApi.getRiderProfile(user?.id, user));
  const currentRider = riders.find((r) => r.id === user?.id) || {
    id: user?.id || 'usr-rider-current',
    name: user?.fullName || user?.name || riderProfile?.name || 'Rider',
    phone: user?.phone || riderProfile?.phone || '',
    isOnline: true,
  };
  const isOnline = currentRider?.isOnline ?? true;

  // Modal triggers
  const [pickupModalOrder, setPickupModalOrder] = useState(null);
  const [deliveryOtpModalOrder, setDeliveryOtpModalOrder] = useState(null);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setRiderProfile(riderApi.getRiderProfile(user?.id, user));
    };
    window.addEventListener('oshud_rider_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('oshud_rider_profile_updated', handleProfileUpdate);
  }, [user]);

  // Active delivery orders (Ready for pickup or out for delivery)
  const activeDeliveries = orders.filter((o) =>
    ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status)
  );

  const handleToggleDuty = () => {
    if (currentRider?.id) {
      toggleRiderOnline(currentRider.id, !isOnline);
      addToast(`You are now ${!isOnline ? 'ONLINE and accepting orders' : 'OFFLINE'}`, 'info');
    }
  };

  const handlePickupVerified = (orderId, pickupCode, verifiedResult) => {
    try {
      const verifiedItems = verifiedResult?.orders?.[0]?.items || [];
      verifyPickup(orderId, pickupCode, verifiedItems);
      addToast(`Pickup confirmed for Order ${orderId}! Package contents & medicine list verified.`, 'success');
      setPickupModalOrder(null);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeliveryConfirmed = (orderId, otp, amount) => {
    try {
      completeDelivery(orderId, otp, amount);
      addToast(
        `Order ${orderId} delivered successfully! Payment reconciled.`,
        'success'
      );
      setDeliveryOtpModalOrder(null);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Mobile-First Rider Status Bar */}
      <div className="bg-surface-pure rounded-3xl p-5 border border-brandBorder-subtle shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={riderProfile.avatar}
              alt="Rider Avatar"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-forest-600 bg-forest-50 p-0.5"
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
                {riderProfile.name}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 uppercase">
                {riderProfile.vehicleType.split(' ')[0] || 'Fleet'}
              </span>
            </div>
            <p className="text-xs text-brandText-secondary mt-0.5">
              Zone: {riderProfile.zone} &bull; {riderProfile.vehicleNumber}
            </p>
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
          <span>{isOnline ? 'Duty: Online & Available' : 'Duty: Offline'}</span>
        </button>
      </div>

      {/* Active Orders Delivery Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-extrabold text-base text-forest-900 flex items-center gap-2">
            <Bike className="w-5 h-5 text-forest-600" />
            <span>Active Delivery Queue ({activeDeliveries.length})</span>
          </h3>
          <span className="text-xs text-brandText-muted">Live synchronization active</span>
        </div>

        <div className="space-y-4">
          {activeDeliveries.map((order) => {
            const isReadyForPickup = order.status === 'READY_FOR_PICKUP';
            const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';

            return (
              <div
                key={order.id}
                className="bg-surface-pure rounded-3xl border border-brandBorder-subtle hover:border-forest-400 shadow-card p-5 sm:p-6 space-y-4 transition-all"
              >
                {/* Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brandBorder-subtle pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-extrabold text-xs text-forest-900 bg-surface-warm px-2.5 py-1 rounded-xl border border-brandBorder-subtle">
                      {order.id}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-base text-forest-900">
                      ₹{Number(order.total || 0).toFixed(2)}
                    </span>
                    <span
                      className={`text-[10px] font-bold block uppercase tracking-wider ${
                        order.paymentMethod === 'COD' ? 'text-amber-800 font-extrabold' : 'text-emerald-700'
                      }`}
                    >
                      {order.paymentMethod === 'COD' ? '• Collect Cash (COD)' : '• Paid Online'}
                    </span>
                  </div>
                </div>

                {/* Professional Route Workflow */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pharmacy Pickup Card */}
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      isReadyForPickup
                        ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-400/20 shadow-sm'
                        : 'bg-surface-warm/40 border-brandBorder-subtle opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-forest-900">
                          <Building2 className="w-4 h-4 text-purple-700" />
                          <span>Pickup at Pharmacy</span>
                        </div>
                        <p className="text-xs font-semibold text-purple-950 pl-6">{order.pharmacyName}</p>
                        <p className="text-xs text-brandText-secondary pl-6">{order.pharmacyAddress}</p>
                      </div>
                      <a
                        href={`tel:${order.pharmacyPhone}`}
                        className="p-2 rounded-xl bg-purple-100 text-purple-800 hover:bg-purple-200 text-xs font-bold flex items-center gap-1 flex-shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Call</span>
                      </a>
                    </div>

                    {isReadyForPickup ? (
                      <div className="mt-4 pt-3 border-t border-purple-200/80 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold text-purple-800">
                          Scan sealed bag QR to verify items
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={QrCode}
                          onClick={() => setPickupModalOrder(order)}
                          className="text-xs font-bold px-4 bg-purple-700 hover:bg-purple-800"
                        >
                          Verify Pickup
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 border-t border-brandBorder-subtle text-[11px] text-emerald-700 font-bold flex items-center gap-1 pl-6">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Picked up & Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Patient Drop-off Card */}
                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      isOutForDelivery
                        ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20 shadow-sm'
                        : 'bg-surface-warm/40 border-brandBorder-subtle opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-forest-900">
                          <MapPin className="w-4 h-4 text-emerald-700" />
                          <span>Deliver to Patient</span>
                        </div>
                        <p className="text-xs font-semibold text-emerald-950 pl-6">{order.customerName}</p>
                        <p className="text-xs text-brandText-secondary pl-6">{order.address}</p>
                        {order.landmark && (
                          <p className="text-[11px] text-brandText-muted pl-6">
                            Landmark: <strong>{order.landmark}</strong>
                          </p>
                        )}
                      </div>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="p-2 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-bold flex items-center gap-1 flex-shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Call</span>
                      </a>
                    </div>

                    {isOutForDelivery && (
                      <div className="mt-4 pt-3 border-t border-emerald-200/80 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-emerald-900">
                          {order.paymentMethod === 'COD' ? (
                            <span className="text-amber-800 font-extrabold">
                              Collect ₹{Number(order.total || 0).toFixed(2)}
                            </span>
                          ) : (
                            'Prepaid Online'
                          )}
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={KeyRound}
                          onClick={() => setDeliveryOtpModalOrder(order)}
                          className="text-xs font-bold px-4 bg-emerald-700 hover:bg-emerald-800"
                        >
                          Enter Customer OTP
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verified Medicine Contents List */}
                {isOutForDelivery && (
                  <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-100 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="font-heading font-bold text-xs text-forest-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <Receipt className="w-3.5 h-3.5 text-forest-700" />
                        <span>Verified Package Contents ({order.items?.length || 0} Medicines)</span>
                      </h4>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        Authenticated Parcel
                      </span>
                    </div>

                    <div className="border border-brandBorder-subtle rounded-xl overflow-hidden divide-y divide-brandBorder-subtle bg-surface-pure text-xs">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((it, idx) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-forest-900">{it.name}</p>
                              <p className="text-[10px] text-brandText-muted">
                                Qty: <strong className="text-forest-800">{it.quantity || it.qty || 1}</strong>{' '}
                                {it.requiresPrescription ? '• Prescription Drug' : '• OTC Item'}
                              </p>
                            </div>
                            <span className="font-bold text-forest-800">
                              ₹{(Number(it.price || it.unitPrice || 0) * Number(it.quantity || it.qty || 1)).toFixed(2)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-brandText-muted">
                          Package contents verified by fulfillment pharmacist.
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                You have no active orders in your queue. Stay online to receive incoming express delivery requests.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pharmacy Pickup Camera QR Verification Modal */}
      <PharmacyPickupModal
        order={pickupModalOrder}
        isOpen={Boolean(pickupModalOrder)}
        onClose={() => setPickupModalOrder(null)}
        onVerifySuccess={handlePickupVerified}
      />

      {/* Customer Delivery OTP Verification Modal (Never reveals OTP) */}
      <DeliveryOtpModal
        order={deliveryOtpModalOrder}
        isOpen={Boolean(deliveryOtpModalOrder)}
        onClose={() => setDeliveryOtpModalOrder(null)}
        onConfirmDelivery={handleDeliveryConfirmed}
      />
    </div>
  );
};

export default RiderDeliveriesPage;
