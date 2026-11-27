import React, { useState, useEffect } from 'react';
import {
  Bike,
  Package,
  TrendingUp,
  DollarSign,
  Coins,
  Wallet,
  Building2,
  MapPin,
  Phone,
  QrCode,
  KeyRound,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import MetricCard from '../../components/workspace/MetricCard';
import StatusBadge from '../../components/workspace/StatusBadge';
import Button from '../../components/common/Button';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/api/client';
import { riderApi } from '../../services/api/rider.api';
import PharmacyPickupModal from '../../components/rider/PharmacyPickupModal';
import DeliveryOtpModal from '../../components/rider/DeliveryOtpModal';

export const RiderDashboardPage = () => {
  const { user } = useAuth();
  const { orders, riders, verifyPickup, completeDelivery, toggleRiderOnline } = useWorkspaceStore();
  const { addToast } = useToast();

  const [riderProfile, setRiderProfile] = useState(() => riderApi.getRiderProfile(user?.id, user));
  const [metrics, setMetrics] = useState(() => riderApi.getRiderMetrics(user?.id, user));

  // Modal triggers
  const [pickupModalOrder, setPickupModalOrder] = useState(null);
  const [deliveryOtpModalOrder, setDeliveryOtpModalOrder] = useState(null);

  const currentRider = riders.find((r) => r.id === user?.id) || riders[0];
  const isOnline = currentRider?.isOnline ?? true;

  // Refresh metrics & profile on changes
  useEffect(() => {
    const handleUpdate = () => {
      setRiderProfile(riderApi.getRiderProfile(user?.id, user));
      setMetrics(riderApi.getRiderMetrics(user?.id, user));
    };

    window.addEventListener('oshud_rider_profile_updated', handleUpdate);
    window.addEventListener('oshud_rider_finance_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('oshud_rider_profile_updated', handleUpdate);
      window.removeEventListener('oshud_rider_finance_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  useEffect(() => {
    setMetrics(riderApi.getRiderMetrics(user?.id, user));
  }, [orders, riders, user]);

  const handleToggleDuty = () => {
    if (currentRider?.id) {
      toggleRiderOnline(currentRider.id, !isOnline);
      addToast(`Duty status changed to: ${!isOnline ? 'ONLINE (Ready for Orders)' : 'OFFLINE'}`, 'info');
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
      addToast(`Order ${orderId} delivered successfully! Payment reconciled.`, 'success');
      setDeliveryOtpModalOrder(null);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const activeDeliveries = orders.filter((o) =>
    ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Rider Status & Duty Banner */}
      <div className="bg-surface-pure rounded-3xl p-5 sm:p-6 border border-brandBorder-subtle shadow-card flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <img
              src={riderProfile.avatar}
              alt="Rider Avatar"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-forest-600 bg-forest-50 p-0.5 shadow-sm"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading font-extrabold text-lg sm:text-xl text-forest-900">
                {riderProfile.name}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 uppercase tracking-wide">
                Verified Fleet Courier
              </span>
            </div>
            <p className="text-xs text-brandText-secondary mt-1">
              Vehicle: <strong className="text-forest-900">{riderProfile.vehicleNumber}</strong> ({riderProfile.vehicleType}) &bull; Zone: {riderProfile.zone}
            </p>
          </div>
        </div>

        {/* Right Action: Duty Toggle & Profile Link */}
        <div className="flex flex-wrap items-center gap-3">
          <NavLink
            to="/rider/profile"
            className="px-4 py-2 rounded-2xl border border-brandBorder-subtle text-xs font-bold text-forest-900 bg-surface-warm hover:bg-forest-50 transition-colors"
          >
            Edit Profile
          </NavLink>
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
            <span>{isOnline ? 'Duty: ONLINE' : 'Duty: OFFLINE'}</span>
          </button>
        </div>
      </div>

      {/* Main Metric Cards: Daily & GMV */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Deliveries Completed (Today)"
          value={`${metrics.deliveriesToday} Orders`}
          change="Real-time dispatch sync"
          trend="up"
          icon={Bike}
          colorScheme="emerald"
        />
        <MetricCard
          title="Total Delivered Amount (Today)"
          value={`₹${metrics.totalAmountDeliveredToday.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          change="Gross Value of Packages"
          trend="up"
          icon={DollarSign}
          colorScheme="blue"
        />
        <MetricCard
          title="Total Earnings (Today)"
          value={`₹${metrics.earningsToday.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          change="₹80 Base + Delivery Incentive"
          trend="up"
          icon={TrendingUp}
          colorScheme="forest"
        />
        <MetricCard
          title="Active Deliveries in Queue"
          value={`${activeDeliveries.length} Pending`}
          change="Ready or Out on Trip"
          trend="neutral"
          icon={Package}
          colorScheme="amber"
        />
      </div>

      {/* Quick Balance & COD Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Physical Cash in Hand (COD)
              </p>
              <p className="font-mono font-extrabold text-xl text-amber-950 mt-0.5">
                ₹{metrics.cashInHand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-amber-700">Hub deposit required before end-of-day</p>
            </div>
          </div>
          <NavLink
            to="/rider/cash"
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1"
          >
            <span>Deposit</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="p-4 rounded-3xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Total Withdrawable Balance
              </p>
              <p className="font-mono font-extrabold text-xl text-emerald-950 mt-0.5">
                ₹{metrics.withdrawableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-emerald-700">Instant UPI / Bank payout available</p>
            </div>
          </div>
          <NavLink
            to="/rider/earnings"
            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-1"
          >
            <span>Withdraw</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>

      {/* Active Deliveries Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bike className="w-5 h-5 text-forest-700" />
            <h2 className="font-heading font-extrabold text-lg text-forest-900">
              Active Deliveries ({activeDeliveries.length})
            </h2>
          </div>
          <NavLink
            to="/rider/deliveries"
            className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1"
          >
            <span>Full Queue View</span>
            <ChevronRight className="w-4 h-4" />
          </NavLink>
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
                {/* Header Information */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brandBorder-subtle pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-extrabold text-sm text-forest-950 bg-surface-warm px-2.5 py-1 rounded-xl border border-brandBorder-subtle">
                      {order.id}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-lg text-forest-900">
                      ₹{Number(order.total || 0).toFixed(2)}
                    </span>
                    <span
                      className={`text-[10px] font-bold block uppercase tracking-wider ${
                        order.paymentMethod === 'COD' ? 'text-amber-700 font-extrabold' : 'text-emerald-700'
                      }`}
                    >
                      {order.paymentMethod === 'COD' ? '• Cash on Delivery (COD)' : '• Paid Online'}
                    </span>
                  </div>
                </div>

                {/* Professional Route Workflow Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pharmacy Pickup Stage */}
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
                          <span>Pharmacy Pickup & Package Verification</span>
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

                    {isReadyForPickup && (
                      <div className="mt-4 pt-3 border-t border-purple-200/80 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold text-purple-800">
                          Scan sealed bag QR to verify
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
                    )}
                  </div>

                  {/* Patient Delivery Stage */}
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
                          <span>Patient Handover & Verification</span>
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
                            'Prepaid Verified'
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
              </div>
            );
          })}

          {activeDeliveries.length === 0 && (
            <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-10 text-center space-y-3 shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                <Bike className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-extrabold text-base text-forest-900">
                All Assigned Deliveries Completed!
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

export default RiderDashboardPage;
