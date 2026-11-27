import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bike,
  Building2,
  MapPin,
  Phone,
  QrCode,
  KeyRound,
  CheckCircle2,
  Receipt,
  RefreshCw,
  History,
} from 'lucide-react';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import apiClient from '../../services/api/client';
import { riderApi } from '../../services/api/rider.api';
import deliveryApi from '../../services/api/delivery.api';
import { notificationApi } from '../../services/api/notification.api';
import PharmacyPickupModal from '../../components/rider/PharmacyPickupModal';
import DeliveryOtpModal from '../../components/rider/DeliveryOtpModal';

export const RiderDeliveriesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, riders, verifyPickup, completeDelivery, toggleRiderOnline } = useWorkspaceStore();
  const { addToast } = useToast();

  const [riderProfile, setRiderProfile] = useState(() => riderApi.getRiderProfile(user?.id, user));
  const [backendDeliveries, setBackendDeliveries] = useState([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);

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

  const fetchMyDeliveries = async () => {
    setIsLoadingDeliveries(true);
    try {
      const res = await deliveryApi.getMyDeliveries();
      const list = Array.isArray(res) ? res : res?.deliveries || [];
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
          deliveryId: del.id,
          status: o.status || del.status,
          total: (o.totalPaise || 0) / 100,
          paymentMethod: o.paymentMethod || 'COD',
          customerName: o.deliveryAddress?.fullName || 'Valued Customer',
          customerPhone: o.deliveryAddress?.phone || '',
          address: [o.deliveryAddress?.line1, o.deliveryAddress?.area, o.deliveryAddress?.city].filter(Boolean).join(', ') || 'Home Delivery',
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
            // Do NOT resurrect if order is already delivered in workspace
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
    } catch (err) {
      console.warn('Backend getMyDeliveries notice:', err.message);
    } finally {
      setIsLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    fetchMyDeliveries();
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
        fetchMyDeliveries();
      }
    };
    const handleStorageSync = (e) => {
      if (e.key === 'oshud_workspace_orders' || e.key === 'oshud_last_status_event') {
        fetchMyDeliveries();
      }
    };
    window.addEventListener('oshud_order_status_updated', handleStatusSync);
    window.addEventListener('storage', handleStorageSync);
    return () => {
      window.removeEventListener('oshud_order_status_updated', handleStatusSync);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setRiderProfile(riderApi.getRiderProfile(user?.id, user));
    };
    window.addEventListener('oshud_rider_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('oshud_rider_profile_updated', handleProfileUpdate);
  }, [user]);

  // Merge backend deliveries with local workspace store orders assigned to this rider
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
    // Prefer backend delivery records first
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

  // Active delivery orders (Ready for pickup, assigned, or out for delivery)
  const activeDeliveries = allAssignedOrders.filter((o) =>
    ['READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'SHIPPED', 'PICKED_UP', 'ASSIGNED'].includes(o.status)
  );

  const completedDeliveries = useMemo(() => {
    return allAssignedOrders.filter(
      (o) => o.status === 'DELIVERED' || o.deliveryStatus === 'DELIVERED'
    );
  }, [allAssignedOrders]);

  const handleToggleDuty = () => {
    if (currentRider?.id) {
      toggleRiderOnline(currentRider.id, !isOnline);
      addToast(`You are now ${!isOnline ? 'ONLINE and accepting orders' : 'OFFLINE'}`, 'info');
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

      fetchMyDeliveries();
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
          detail: { orderId, backendId: targetOrder?.backendId, orderNumber: targetOrder?.orderNumber, status: 'DELIVERED', otp, paymentMethod },
        })
      );
      try {
        localStorage.setItem(
          'oshud_last_status_event',
          JSON.stringify({ orderId, status: 'DELIVERED', paymentMethod, time: Date.now() })
        );
      } catch (e) {}

      setDeliveryOtpModalOrder(null);
      await fetchMyDeliveries();
      addToast(
        `Order ${orderId} delivered successfully! Payment method verified (${paymentMethod === 'UPI' ? 'UPI / QR' : 'Cash on Delivery'}).`,
        'success'
      );
    } catch (err) {
      addToast(err.message || 'Failed to complete delivery', 'error');
      throw err;
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
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMyDeliveries}
            isLoading={isLoadingDeliveries}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingDeliveries ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>
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
                        Package contents verified by fulfillment pharmacist.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {activeDeliveries.length === 0 && (
            <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-12 text-center space-y-4 shadow-card">
              <div className="w-16 h-16 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                <Bike className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-extrabold text-lg text-forest-900">
                  All Deliveries Completed!
                </h3>
                <p className="text-xs text-brandText-secondary max-w-sm mx-auto">
                  You have no active orders in your queue. Stay online to receive incoming express delivery requests.
                </p>
              </div>
              <div className="pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={History}
                  onClick={() => navigate('/rider/history')}
                  className="text-xs font-bold bg-forest-800 hover:bg-forest-900"
                >
                  View Completed Deliveries Tab
                </Button>
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

export default RiderDeliveriesPage;
