import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Receipt,
  CheckCircle2,
  RefreshCw,
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
import deliveryApi from '../../services/api/delivery.api';
import { notificationApi } from '../../services/api/notification.api';
import PharmacyPickupModal from '../../components/rider/PharmacyPickupModal';
import DeliveryOtpModal from '../../components/rider/DeliveryOtpModal';

export const RiderDashboardPage = () => {
  const { user } = useAuth();
  const { orders, riders, verifyPickup, completeDelivery, toggleRiderOnline } = useWorkspaceStore();
  const { addToast } = useToast();

  const [riderProfile, setRiderProfile] = useState(() => riderApi.getRiderProfile(user?.id, user));
  const [metrics, setMetrics] = useState(() => {
    const initial = riderApi.getRiderMetrics(user?.id, user);
    return {
      deliveriesToday: initial.deliveriesToday || 0,
      totalAmountDeliveredToday: initial.totalAmountDeliveredToday || 0,
      earningsToday: initial.earningsToday || 0,
      monthlyTotalEarnings: initial.monthlyTotalEarnings || 0,
      withdrawableBalance: initial.withdrawableBalance || 0,
      cashInHand: initial.cashInHand || 0,
    };
  });
  const [backendDeliveries, setBackendDeliveries] = useState([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const isFetchingDashboardRef = useRef(false);

  // Modal triggers
  const [pickupModalOrder, setPickupModalOrder] = useState(null);
  const [deliveryOtpModalOrder, setDeliveryOtpModalOrder] = useState(null);

  const currentRider =
    riders.find((r) => r.id === user?.id) || {
      id: user?.id || riderProfile?.id || 'usr-rider-current',
      name: user?.fullName || user?.name || riderProfile?.name || 'Rider',
      phone: user?.phone || riderProfile?.phone || '',
      isOnline: riderProfile?.isOnline ?? true,
    };
  const isOnline = currentRider?.isOnline ?? true;

  const loadDashboardData = async () => {
    if (isFetchingDashboardRef.current) return;
    isFetchingDashboardRef.current = true;
    setIsLoadingDashboard(true);
    try {
      const [deliveriesRes, cashRes, earningsRes] = await Promise.all([
        deliveryApi.getMyDeliveries().catch((err) => {
          console.warn('Backend getMyDeliveries notice:', err.message);
          return [];
        }),
        riderApi.fetchCashSummary(user?.id, user).catch((err) => {
          console.warn('Backend fetchCashSummary notice:', err.message);
          return null;
        }),
        riderApi.fetchEarningsAndWallet(user?.id, user).catch((err) => {
          console.warn('Backend fetchEarningsAndWallet notice:', err.message);
          return null;
        }),
      ]);

      const list = Array.isArray(deliveriesRes) ? deliveriesRes : deliveriesRes?.deliveries || [];
      let mapped = list.map((del) => {
        const o = del.order || {};
        const qrToken =
          del.pickupQr?.qrToken ||
          del.batch?.pickupQrs?.[0]?.qrToken ||
          del.qrToken ||
          o.pickupQrCode ||
          o.id;
        return {
          id: o.orderNumber || o.id || del.id,
          backendId: o.id || del.orderId,
          orderNumber: o.orderNumber || o.id,
          deliveryId: del.id,
          status: o.status || del.status,
          total: (o.totalPaise || 0) / 100,
          paymentMethod: o.paymentMethod || 'COD',
          customerName: o.deliveryAddress?.fullName || 'Valued Customer',
          customerPhone: o.deliveryAddress?.phone || '',
          address:
            [o.deliveryAddress?.line1, o.deliveryAddress?.area, o.deliveryAddress?.city].filter(Boolean).join(', ') ||
            'Home Delivery',
          area: o.deliveryAddress?.area || 'Kolkata Central',
          landmark: o.deliveryAddress?.landmark || '',
          pharmacyName: o.pharmacy?.name || 'Local Dispensary',
          pharmacyAddress: o.pharmacy?.line1 || 'Dispensary Hub',
          pharmacyPhone: o.pharmacy?.phone || '',
          pickupQrCode: qrToken,
          deliveryOtp: '9876',
          items: (o.items || []).map((it) => ({
            id: it.id,
            name: it.nameSnapshot || it.name || 'Prescription Medicine',
            quantity: it.quantity || 1,
            price: (it.unitPricePaise || it.mrpPaise || 0) / 100,
            lineTotal: (it.lineTotalPaise || 0) / 100,
            requiresPrescription: it.requiresPrescription,
          })),
        };
      });

      // Notification sync fallback: If notification was delivered for an assigned order, ensure it appears
      if (mapped.length === 0) {
        try {
          const notifsRes = await notificationApi.getNotifications({ category: 'DELIVERY' }, user);
          const notifItems = notifsRes?.items || [];
          const assignNotifs = notifItems.filter((n) =>
            (n.desc || n.body || '').toLowerCase().includes('assigned to you')
          );
          assignNotifs.forEach((n) => {
            const bodyText = n.desc || n.body || '';
            const match = bodyText.match(/Order\s+([A-Za-z0-9-]+)\s+assigned/i);
            const orderIdFromNotif = n.data?.orderId || match?.[1] || 'Assigned Order';
            const isAlreadyDelivered = (orders || []).some(
              (wo) =>
                (wo.id === orderIdFromNotif ||
                  wo.backendId === orderIdFromNotif ||
                  wo.orderNumber === orderIdFromNotif) &&
                wo.status === 'DELIVERED'
            );
            if (isAlreadyDelivered) return;

            if (!mapped.some((m) => m.id === orderIdFromNotif || m.backendId === orderIdFromNotif)) {
              mapped.push({
                id: orderIdFromNotif,
                backendId: orderIdFromNotif,
                deliveryId: 'notif-' + n.id,
                status: 'RIDER_ASSIGNED',
                total: 0,
                paymentMethod: 'COD',
                customerName: 'Customer',
                customerPhone: '',
                address: 'Prescription Handover / Customer Address',
                area: 'Kolkata Metropolitan Area',
                landmark: '',
                pharmacyName: 'Primary Medicine Hub',
                pharmacyAddress: 'Kolkata Dispensary Hub',
                pharmacyPhone: '',
                pickupQrCode: orderIdFromNotif,
                deliveryOtp: '9876',
                items: [],
              });
            }
          });
        } catch (e) {}
      }

      setBackendDeliveries(mapped);

      // Local store metrics fallback
      const local = riderApi.getRiderMetrics(user?.id, user);

      // Calculate delivered today stats
      const deliveriesToday = earningsRes?.deliveriesToday ?? local.deliveriesToday ?? 0;
      const totalAmountDeliveredToday = earningsRes?.totalAmountDeliveredToday ?? local.totalAmountDeliveredToday ?? 0;
      const earningsToday = earningsRes?.earningsToday ?? (deliveriesToday * 30);
      const monthlyTotalEarnings = earningsRes?.monthlyTotalEarnings ?? (local.totalDeliveriesMonth * 30);
      const withdrawableBalance = earningsRes?.withdrawableBalance ?? local.withdrawableBalance ?? 0;
      const cashInHand = cashRes?.cashInHand ?? local.cashInHand ?? 0;

      setMetrics({
        deliveriesToday,
        totalAmountDeliveredToday,
        earningsToday,
        monthlyTotalEarnings,
        withdrawableBalance,
        cashInHand,
      });

      setRiderProfile(riderApi.getRiderProfile(user?.id, user));
    } catch (err) {
      console.warn('loadDashboardData notice:', err.message);
    } finally {
      setIsLoadingDashboard(false);
      isFetchingDashboardRef.current = false;
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    const handleStatusSync = (e) => {
      const { orderId, status } = e.detail || {};
      if (orderId && status) {
        setBackendDeliveries((prev) =>
          prev.map((d) =>
            d.id === orderId || d.backendId === orderId || d.orderNumber === orderId
              ? { ...d, status }
              : d
          )
        );
        loadDashboardData();
      }
    };
    const handleStorageSync = (e) => {
      if (
        e.key === 'oshud_workspace_orders' ||
        e.key === 'oshud_last_status_event' ||
        e.key === 'oshud_rider_finance_data_v1'
      ) {
        loadDashboardData();
      }
    };
    const handleFinanceSync = () => {
      loadDashboardData();
    };

    window.addEventListener('oshud_order_status_updated', handleStatusSync);
    window.addEventListener('oshud_rider_finance_updated', handleFinanceSync);
    window.addEventListener('oshud_rider_profile_updated', handleFinanceSync);
    window.addEventListener('storage', handleStorageSync);

    return () => {
      window.removeEventListener('oshud_order_status_updated', handleStatusSync);
      window.removeEventListener('oshud_rider_finance_updated', handleFinanceSync);
      window.removeEventListener('oshud_rider_profile_updated', handleFinanceSync);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  const handleToggleDuty = () => {
    if (currentRider?.id) {
      toggleRiderOnline(currentRider.id, !isOnline);
      addToast(`Duty status changed to: ${!isOnline ? 'ONLINE (Ready for Orders)' : 'OFFLINE'}`, 'info');
    }
  };

  const handlePickupVerified = (orderId, pickupCode, verifiedResult) => {
    try {
      const verifiedOrders = verifiedResult?.orders || [];
      const verifiedOrder = verifiedOrders[0] || {};
      const verifiedItems = verifiedOrder.items || [];

      // 1. Update local workspace store
      verifyPickup(orderId, pickupCode, verifiedItems);

      // 2. Immediately update local deliveries state so the card flips to "Deliver to Patient"
      setBackendDeliveries((prev) =>
        prev.map((d) =>
          d.id === orderId || d.backendId === orderId || d.orderNumber === orderId
            ? {
                ...d,
                status: 'OUT_FOR_DELIVERY',
                items: verifiedItems.length > 0 ? verifiedItems : d.items,
                customerName: verifiedOrder.customerName || d.customerName,
                customerPhone: verifiedOrder.customerPhone || d.customerPhone,
                address: verifiedOrder.deliveryAddress || d.address,
                area: verifiedOrder.area || d.area,
              }
            : d
        )
      );

      // 3. Broadcast status event across all windows & tabs
      window.dispatchEvent(
        new CustomEvent('oshud_order_status_updated', {
          detail: { orderId, status: 'OUT_FOR_DELIVERY', pickupCode, verifiedItems },
        })
      );
      try {
        localStorage.setItem(
          'oshud_last_status_event',
          JSON.stringify({ orderId, status: 'OUT_FOR_DELIVERY', time: Date.now() })
        );
      } catch (e) {}

      loadDashboardData();
      addToast(`Pickup confirmed for Order ${orderId}! Package contents & medicine list verified.`, 'success');
      setPickupModalOrder(null);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeliveryConfirmed = async (orderId, otp, amount, paymentMethod = 'COD') => {
    try {
      // 1. Call backend to mark delivery & order as DELIVERED in the database
      const targetOrder = allAssignedOrders.find(
        (o) => o.id === orderId || o.backendId === orderId || o.orderNumber === orderId
      );
      const deliveryLookupId = targetOrder?.deliveryId || targetOrder?.backendId || orderId;
      await deliveryApi.completeDelivery(deliveryLookupId, otp, paymentMethod);

      // 2. Update workspace store
      completeDelivery(orderId, otp, amount, paymentMethod);

      // 3. Update local deliveries state so the order is immediately marked DELIVERED and removed from active queue
      setBackendDeliveries((prev) =>
        prev.map((d) =>
          d.id === orderId || d.backendId === orderId || d.orderNumber === orderId || d.deliveryId === deliveryLookupId
            ? { ...d, status: 'DELIVERED', paymentMethod }
            : d
        )
      );

      // 4. Broadcast status event across all windows & tabs
      window.dispatchEvent(
        new CustomEvent('oshud_order_status_updated', {
          detail: {
            orderId,
            backendId: targetOrder?.backendId,
            orderNumber: targetOrder?.orderNumber,
            status: 'DELIVERED',
            otp,
            paymentMethod,
          },
        })
      );
      try {
        localStorage.setItem(
          'oshud_last_status_event',
          JSON.stringify({ orderId, status: 'DELIVERED', time: Date.now() })
        );
      } catch (e) {}

      setDeliveryOtpModalOrder(null);
      await loadDashboardData();
      addToast(`Order ${orderId} delivered successfully! Payment reconciled and verified.`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to complete delivery', 'error');
      throw err;
    }
  };

  const allAssignedOrders = useMemo(() => {
    const cleanUserPhone = (user?.phone || riderProfile.phone || '').replace(/[^0-9]/g, '');
    const cleanUserId = user?.id || riderProfile.id;
    const cleanUserName = (user?.fullName || user?.name || riderProfile.name || '').toLowerCase().trim();

    const matchedWorkspace = (orders || []).filter((o) => {
      const riderPhone = (o.assignedRider?.phone || '').replace(/[^0-9]/g, '');
      const riderId = o.assignedRider?.id;
      const riderName = (o.assignedRider?.name || '').toLowerCase().trim();
      return (
        (riderId && (riderId === cleanUserId || riderId === user?.id)) ||
        (cleanUserPhone && riderPhone && (riderPhone.slice(-10) === cleanUserPhone.slice(-10) || cleanUserPhone.includes(riderPhone))) ||
        (cleanUserName && riderName && (cleanUserName.includes(riderName) || riderName.includes(cleanUserName))) ||
        (o.status === 'RIDER_ASSIGNED')
      );
    });

    const map = new Map();
    backendDeliveries.forEach((d) => map.set(d.backendId || d.id, d));
    matchedWorkspace.forEach((o) => {
      if (!map.has(o.backendId || o.id)) {
        map.set(o.backendId || o.id, {
          id: o.id,
          backendId: o.backendId || o.id,
          status: o.status,
          total: o.total || 0,
          paymentMethod: o.paymentMethod || 'COD',
          customerName: o.customerName || 'Registered Patient',
          customerPhone: o.customerPhone || '',
          address: o.address || 'Kolkata Delivery Address',
          area: o.area || 'Kolkata Metropolitan Area',
          landmark: o.landmark || '',
          pharmacyName: o.pharmacyName || 'Fulfillment Pharmacy',
          pharmacyAddress: o.pharmacyAddress || 'Hub Counter',
          pharmacyPhone: o.pharmacyPhone || '',
          pickupQrCode: o.pickupQrCode || o.id,
          deliveryOtp: o.deliveryOtp || '9876',
          items: o.items || [],
        });
      }
    });

    return Array.from(map.values());
  }, [backendDeliveries, orders, user, riderProfile]);

  const activeDeliveries = allAssignedOrders.filter((o) =>
    ['READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'SHIPPED', 'PICKED_UP', 'ASSIGNED'].includes(o.status)
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

        {/* Right Action: Sync, Duty Toggle & Profile Link */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={isLoadingDashboard}
            title="Refresh Dashboard Data from Backend"
            className="p-2.5 rounded-2xl border border-brandBorder-subtle text-forest-800 bg-surface-warm hover:bg-forest-50 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingDashboard ? 'animate-spin text-forest-600' : ''}`} />
          </button>
          <NavLink
            to="/rider/profile"
            className="px-4 py-2.5 rounded-2xl border border-brandBorder-subtle text-xs font-bold text-forest-900 bg-surface-warm hover:bg-forest-50 transition-colors"
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
          value={`₹${(metrics.totalAmountDeliveredToday || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          change="Gross Value of Packages"
          trend="up"
          icon={DollarSign}
          colorScheme="blue"
        />
        <MetricCard
          title="Total Earnings (Today)"
          value={`₹${(metrics.earningsToday || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          change={`${metrics.deliveriesToday} completed today (₹30.00 / order)`}
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
                ₹{(metrics.cashInHand || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                ₹{(metrics.withdrawableBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
            const isReadyForPickup =
              order.status === 'READY_FOR_PICKUP' || order.status === 'RIDER_ASSIGNED' || order.status === 'ASSIGNED';
            const isOutForDelivery =
              order.status === 'OUT_FOR_DELIVERY' || order.status === 'SHIPPED' || order.status === 'PICKED_UP';

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
                        {order.status !== 'DELIVERED' ? (
                          <p className="text-xs text-brandText-secondary pl-6">{order.pharmacyAddress}</p>
                        ) : (
                          <p className="text-[11px] text-brandText-muted pl-6">Address protected after delivery</p>
                        )}
                      </div>
                      {order.status !== 'DELIVERED' && order.pharmacyPhone && (
                        <a
                          href={`tel:${order.pharmacyPhone}`}
                          className="p-2 rounded-xl bg-purple-100 text-purple-800 hover:bg-purple-200 text-xs font-bold flex items-center gap-1 flex-shrink-0"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Call</span>
                        </a>
                      )}
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
                        {order.status !== 'DELIVERED' ? (
                          <>
                            <p className="text-xs text-brandText-secondary pl-6">{order.address}</p>
                            {order.landmark && (
                              <p className="text-[11px] text-brandText-muted pl-6">
                                Landmark: <strong>{order.landmark}</strong>
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-[11px] text-brandText-muted pl-6">Address protected after delivery</p>
                        )}
                      </div>
                      {order.status !== 'DELIVERED' && order.customerPhone && (
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="p-2 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs font-bold flex items-center gap-1 flex-shrink-0"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Call</span>
                        </a>
                      )}
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

                {/* Medicine Contents List */}
                <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-100 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold text-xs text-forest-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <Receipt className="w-3.5 h-3.5 text-forest-700" />
                      <span>{isOutForDelivery ? 'Verified Package Medicines' : 'Assigned Package Contents'} ({order.items?.length || 0} Items)</span>
                    </h4>
                    {isOutForDelivery ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        Authenticated Parcel
                      </span>
                    ) : (
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                        Awaiting Pharmacy Pickup
                      </span>
                    )}
                  </div>

                  <div className="border border-brandBorder-subtle rounded-xl overflow-hidden divide-y divide-brandBorder-subtle bg-surface-pure text-xs">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((it, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-forest-900">{it.name || it.nameSnapshot || 'Medicine'}</p>
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
                        Prescription package items verified by fulfillment pharmacy.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {activeDeliveries.length === 0 && (
            <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-10 text-center space-y-4 shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                <Bike className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  All Assigned Deliveries Completed!
                </h3>
                <p className="text-xs text-brandText-secondary max-w-sm mx-auto">
                  You have no active orders in your queue. Stay online to receive incoming express delivery requests.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <NavLink
                  to="/rider/deliveries"
                  className="px-4 py-2 rounded-2xl border border-brandBorder-subtle text-xs font-bold text-forest-900 bg-surface-warm hover:bg-forest-50 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Package className="w-3.5 h-3.5 text-forest-700" />
                  <span>View Completed Deliveries</span>
                </NavLink>
                <NavLink
                  to="/rider/earnings"
                  className="px-4 py-2 rounded-2xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Check Earnings & Payouts</span>
                </NavLink>
              </div>
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
