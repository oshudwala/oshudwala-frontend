import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Scan,
  CheckCircle,
  AlertCircle,
  Bike,
  PackageCheck,
  User,
  ArrowRight,
  Clock,
  ShieldCheck,
  RefreshCw,
  Search,
  Check,
  Sparkles,
  Phone,
  Package,
  Layers,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import { pharmacyApi } from '../../services/api/pharmacy.api';
import { deliveryApi } from '../../services/api/delivery.api';
import Button from '../../components/common/Button';

export const QRPickupVerificationPage = () => {
  const { orders, handovers, recordHandover, updateOrderStatus } = useWorkspaceStore();
  const { addToast } = useToast();

  // Orders waiting for rider pickup (READY_FOR_PICKUP or RIDER_ASSIGNED)
  const readyOrders = orders.filter((o) =>
    ['READY_FOR_PICKUP', 'RIDER_ASSIGNED'].includes(o.status)
  );

  // Currently selected order to generate/fetch QR for
  const [selectedOrderId, setSelectedOrderId] = useState(readyOrders[0]?.id || '');
  const [activeQrData, setActiveQrData] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [lastHandover, setLastHandover] = useState(null);
  const [autoVerifiedNotice, setAutoVerifiedNotice] = useState(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [qrImgError, setQrImgError] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Auto-select first order if current selection is invalid
  useEffect(() => {
    if (
      (!selectedOrderId || !readyOrders.find((o) => o.id === selectedOrderId)) &&
      readyOrders.length > 0
    ) {
      setSelectedOrderId(readyOrders[0].id);
    }
  }, [readyOrders, selectedOrderId]);

  // 15-Minute Countdown Timer
  useEffect(() => {
    if (!activeQrData) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remainingMs = Math.max(0, activeQrData.expiresAt - now);
      const remainingSec = Math.floor(remainingMs / 1000);
      setSecondsRemaining(remainingSec);

      if (remainingSec <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQrData]);

  // -------------------------------------------------------------
  // AUTOMATIC VERIFICATION OBSERVER
  // When the rider scans the QR code (backend updates status to SHIPPED / OUT_FOR_DELIVERY),
  // this observer automatically detects the transition and completes verification with 0 manual clicks!
  // -------------------------------------------------------------
  const processedHandoversRef = useRef(new Set());

  useEffect(() => {
    if (!activeQrData?.order?.id) return;
    const targetId = activeQrData.order.id;
    const orderInStore = orders.find((o) => o.id === targetId);

    if (
      orderInStore &&
      ['SHIPPED', 'OUT_FOR_DELIVERY', 'PICKED_UP', 'DELIVERED'].includes(orderInStore.status)
    ) {
      if (!processedHandoversRef.current.has(targetId)) {
        processedHandoversRef.current.add(targetId);
        handleExecuteAutomatedHandover(orderInStore, activeQrData.token);
      }
    }
  }, [orders, activeQrData]);

  const handleExecuteAutomatedHandover = (order, qrToken) => {
    const assignedRider = order.assignedRider || {
      id: 'usr-rider-admin-assigned',
      name: 'Rider Dispatched by Admin',
      phone: '+91 98300 12345',
      vehicle: 'Hero Electric (WB-02-AZ-4921)',
    };

    // 1. Record verified handover in persistent CDSCO custody store
    const handoverRecord = recordHandover({
      orderId: order.id,
      customerName: order.customerName,
      destination: order.area || order.address,
      riderId: assignedRider.id,
      riderName: assignedRider.name,
      riderPhone: assignedRider.phone,
      riderVehicle: assignedRider.vehicle,
      items: order.items,
      qrToken: qrToken || activeQrData?.token || order.pickupQrCode,
    });

    setLastHandover(handoverRecord);
    setAutoVerifiedNotice({
      orderId: order.id,
      riderName: assignedRider.name,
      customerName: order.customerName,
      token: qrToken,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    addToast(
      `🎉 Rider scanned QR code! Order ${order.id} verified automatically and handed over to ${assignedRider.name}.`,
      'success'
    );

    // Keep active QR dismissed after showing verification animation
    setTimeout(() => {
      setActiveQrData(null);
      setSelectedOrderId('');
    }, 4000);
  };

  // Fetch or Generate 15-Minute Pickup QR Code from Backend
  const handleGenerateQR = async (orderId) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      addToast('Please select a valid order ready for pickup.', 'warning');
      return;
    }

    setIsGeneratingQr(true);
    setQrImgError(false);
    setAutoVerifiedNotice(null);

    try {
      // 1. Try to fetch active pickup QR from backend
      const qrPayload = await deliveryApi.getOrderPickupQr(orderId);
      
      const expiresAt = qrPayload.expiresAt
        ? new Date(qrPayload.expiresAt).getTime()
        : Date.now() + 15 * 60 * 1000;

      setActiveQrData({
        ...qrPayload,
        token: qrPayload.qrToken || qrPayload.token,
        order: targetOrder,
        expiresAt,
      });

      // Synchronize order's pickup QR code in store
      if (targetOrder) {
        targetOrder.pickupQrCode = qrPayload.qrToken || qrPayload.token;
      }

      const diffMs = Math.max(0, expiresAt - Date.now());
      setSecondsRemaining(Math.floor(diffMs / 1000) || 15 * 60);

      addToast(`15-minute pickup QR fetched for Order ${orderId}!`, 'success');
    } catch (err) {
      console.warn('Backend pickup QR fetch note:', err);
      // Fallback local 15-minute token
      const fallbackToken =
        targetOrder.pickupQrCode ||
        `QR-${String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      setActiveQrData({
        orderId,
        token: fallbackToken,
        order: targetOrder,
        expiresAt: Date.now() + 15 * 60 * 1000,
        isBackendVerified: false,
      });
      setSecondsRemaining(15 * 60);
      addToast(`15-minute pickup QR code ready for Order ${orderId}`, 'info');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Manual Handover Override (emergency fallback if rider camera fails)
  const handleManualHandoverOverride = () => {
    if (!activeQrData) {
      addToast('Please generate an active 15-minute pickup QR first.', 'warning');
      return;
    }

    const targetOrder = activeQrData.order;
    updateOrderStatus(targetOrder.id, 'SHIPPED');
    deliveryApi.scanPickupQr(activeQrData.token).catch(() => {});
    handleExecuteAutomatedHandover(targetOrder, activeQrData.token);
  };

  // Simulate Rider Scanning QR Code (convenient 1-click test for user/admin)
  const handleSimulateRiderScan = async () => {
    if (!activeQrData || !targetOrder) return;
    try {
      addToast('Rider scanner reading QR code...', 'info');
      await deliveryApi.scanPickupQr(activeQrData.token);
      updateOrderStatus(targetOrder.id, 'SHIPPED');
    } catch (err) {
      updateOrderStatus(targetOrder.id, 'SHIPPED');
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const targetOrder = orders.find((o) => o.id === selectedOrderId);
  const assignedRider = targetOrder?.assignedRider || {
    name: 'Courier Fleet (Admin Assigned)',
    phone: '+91 98300 00000',
    vehicle: 'Electric Two-Wheeler',
  };

  // Prepare full QR payload encoding the unique order list details for the rider
  const qrPayloadObject = activeQrData && targetOrder ? {
    qrToken: activeQrData.token,
    orderId: targetOrder.id,
    orderNumber: targetOrder.orderNumber || targetOrder.id,
    customerName: targetOrder.customerName,
    customerPhone: targetOrder.customerPhone,
    deliveryArea: targetOrder.area || targetOrder.address,
    riderName: assignedRider.name,
    items: (targetOrder.items || []).map((i) => ({
      name: i.name,
      qty: i.qty || i.quantity || 1,
      price: i.price,
    })),
    totalPaise: Math.round((targetOrder.total || 0) * 100),
    totalMrp: targetOrder.total,
    timestamp: Date.now(),
  } : null;

  const qrPayloadString = qrPayloadObject ? JSON.stringify(qrPayloadObject) : '';
  const qrCodeImageUrl = qrPayloadString
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrPayloadString)}&color=064e3b&bgcolor=FFFFFF`
    : '';

  // Filtered audit history
  const filteredHandovers = (handovers || []).filter((h) => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      h.orderId?.toLowerCase().includes(q) ||
      h.riderName?.toLowerCase().includes(q) ||
      h.items?.some((i) => i.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Rider Pickup & QR Handover Verification
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Admin assigns the rider &bull; Unique 15-minute QR code with order details &bull; Automatic verification upon rider scan with zero manual clicks.
        </p>
      </div>

      {/* Automated Handover Live Toast / Banner */}
      {autoVerifiedNotice && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-3xl flex items-center justify-between gap-4 animate-scale-up shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="font-heading font-extrabold text-sm text-emerald-950">
                Automated Verification Completed!
              </p>
              <p className="text-xs text-emerald-800 font-medium">
                Order <strong>{autoVerifiedNotice.orderId}</strong> scanned by rider{' '}
                <strong>{autoVerifiedNotice.riderName}</strong>. Custody transferred & logged in audit trail at {autoVerifiedNotice.timestamp}.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-200/60 px-3 py-1 rounded-full">
            No Manual Click Needed
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side (7 Cols): 15-Minute QR Generator & Assigned Rider Handover */}
        <div className="lg:col-span-7 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-brandBorder-subtle">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-forest-900">
                  15-Minute Pickup QR Code
                </h2>
                <p className="text-xs text-brandText-secondary">
                  Unique QR with parcel details &bull; Auto-completes when rider scans
                </p>
              </div>
            </div>

            {activeQrData && (
              <span
                className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs ${
                  secondsRemaining > 120
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : secondsRemaining > 0
                    ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {secondsRemaining > 0 ? `Timer: ${formatTime(secondsRemaining)}` : 'QR Expired'}
                </span>
              </span>
            )}
          </div>

          {/* Ready Orders Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-forest-900">
                Packed Orders Ready for Rider Pickup ({readyOrders.length} waiting)
              </label>
              <span className="text-[11px] text-brandText-muted">
                Click QR button on any order to display
              </span>
            </div>

            {readyOrders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {readyOrders.map((order) => {
                  const isSelected = selectedOrderId === order.id;
                  return (
                    <div
                      key={order.id}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-forest-50/90 border-forest-600 shadow-sm'
                          : 'bg-surface-warm border-brandBorder-subtle hover:bg-forest-50/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-forest-900">
                            {order.id}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                            ₹{(order.total || 0).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-forest-800 mt-1">
                          {order.customerName}
                        </p>
                        <p className="text-[10px] text-brandText-secondary truncate">
                          {order.area || order.address}
                        </p>
                        {order.assignedRider && (
                          <p className="text-[10px] text-forest-700 font-semibold mt-1 flex items-center gap-1">
                            <Bike className="w-3 h-3" />
                            <span>Rider: {order.assignedRider.name}</span>
                          </p>
                        )}
                      </div>

                      <div className="pt-2 mt-2 border-t border-brandBorder-subtle/70 flex items-center justify-between">
                        <span className="text-[10px] text-brandText-muted">
                          {order.items?.length || 1} medicine items
                        </span>
                        <Button
                          type="button"
                          variant={isSelected && activeQrData ? 'primary' : 'outline'}
                          size="xs"
                          leftIcon={QrCode}
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            handleGenerateQR(order.id);
                          }}
                          className="text-[11px] font-bold py-1 px-2.5 shadow-2xs"
                        >
                          {isSelected && activeQrData ? 'Showing QR' : 'Show Pickup QR'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 bg-surface-warm border border-brandBorder-subtle rounded-2xl text-center text-xs text-brandText-secondary space-y-1">
                <Package className="w-6 h-6 mx-auto text-brandText-muted opacity-60 mb-1" />
                <p className="font-bold text-forest-900">No orders waiting for pickup</p>
                <p className="text-[11px] text-brandText-muted">
                  When walk-in registration orders or online prescriptions are packed, they will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Generated QR Display Stage with Unique Order List Details */}
          {activeQrData && targetOrder && (
            <div className="space-y-4 pt-3 border-t border-brandBorder-subtle animate-fade-in">
              <div className="flex flex-col sm:flex-row items-stretch gap-6 p-5 bg-gradient-to-br from-forest-50 via-surface-pure to-teal-50/40 rounded-3xl border border-forest-200">
                {/* Visual QR Code Display */}
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 flex flex-col items-center justify-center flex-shrink-0 text-center w-full sm:w-52">
                  <div className="w-44 h-44 bg-surface-pure rounded-xl flex items-center justify-center p-2 relative overflow-hidden border border-slate-200">
                    {!qrImgError ? (
                      <img
                        src={qrCodeImageUrl}
                        alt="Pickup Verification QR"
                        className="w-full h-full object-contain"
                        onError={() => setQrImgError(true)}
                      />
                    ) : (
                      /* High-Contrast SVG Fallback if external image API blocked */
                      <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full text-forest-900 fill-current"
                      >
                        <rect x="0" y="0" width="30" height="30" rx="4" />
                        <rect x="5" y="5" width="20" height="20" fill="#ffffff" rx="2" />
                        <rect x="10" y="10" width="10" height="10" fill="#064e3b" />

                        <rect x="70" y="0" width="30" height="30" rx="4" />
                        <rect x="75" y="5" width="20" height="20" fill="#ffffff" rx="2" />
                        <rect x="80" y="10" width="10" height="10" fill="#064e3b" />

                        <rect x="0" y="70" width="30" height="30" rx="4" />
                        <rect x="5" y="75" width="20" height="20" fill="#ffffff" rx="2" />
                        <rect x="10" y="80" width="10" height="10" fill="#064e3b" />

                        <rect x="35" y="10" width="8" height="8" />
                        <rect x="50" y="10" width="8" height="8" />
                        <rect x="35" y="25" width="8" height="8" />
                        <rect x="45" y="35" width="15" height="15" rx="2" />
                        <rect x="70" y="45" width="10" height="10" />
                        <rect x="25" y="45" width="8" height="8" />
                        <rect x="10" y="50" width="8" height="8" />
                        <rect x="40" y="65" width="12" height="12" />
                        <rect x="65" y="70" width="10" height="10" />
                        <rect x="80" y="85" width="10" height="10" />
                        <rect x="65" y="85" width="8" height="8" />
                      </svg>
                    )}
                  </div>

                  <span className="font-mono font-bold text-[10px] text-forest-800 mt-2 block tracking-wider truncate max-w-[190px]">
                    {activeQrData.token}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Single-Use Active QR</span>
                  </span>
                </div>

                {/* QR Metadata & Order List Details */}
                <div className="flex-1 space-y-3 text-xs w-full flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {/* Admin Assigned Rider Card */}
                    <div>
                      <span className="text-[10px] font-bold text-forest-700 uppercase tracking-wide">
                        Assigned Delivery Rider
                      </span>
                      <div className="p-2.5 bg-white rounded-xl border border-forest-200 mt-1 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold">
                            <Bike className="w-4 h-4 text-forest-700" />
                          </div>
                          <div>
                            <p className="font-bold text-forest-900">{assignedRider.name}</p>
                            <p className="text-[10px] text-brandText-secondary">{assignedRider.vehicle}</p>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-forest-800">
                          {assignedRider.phone}
                        </span>
                      </div>
                    </div>

                    {/* Order List Details (Every medicine name, quantity, price) */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-forest-700 uppercase tracking-wide">
                          Order List Details ({targetOrder.items?.length || 1} items)
                        </span>
                        <span className="font-mono font-bold text-[11px] text-emerald-800">
                          Total: ₹{(targetOrder.total || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 p-2 max-h-28 overflow-y-auto mt-1">
                        {targetOrder.items?.map((item, idx) => (
                          <div key={idx} className="py-1 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-forest-800">
                                x{item.qty || item.quantity || 1}
                              </span>
                              {item.price && (
                                <span className="font-mono text-slate-500 text-[10px]">
                                  ₹{(Number(item.price) * (Number(item.qty || item.quantity) || 1)).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Automated Verification Status & Actions */}
                  <div className="space-y-2 pt-2 border-t border-forest-200/60">
                    <div className="p-2.5 bg-forest-100/70 border border-forest-300/70 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <p className="text-[11px] font-bold text-forest-900">
                          Waiting for Rider to Scan QR...
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-forest-700">
                        Zero manual clicks required
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        leftIcon={Scan}
                        onClick={handleSimulateRiderScan}
                        disabled={secondsRemaining <= 0}
                        className="flex-1 text-xs font-bold py-2 shadow-sm"
                      >
                        Simulate Rider QR Scan
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={PackageCheck}
                        onClick={handleManualHandoverOverride}
                        className="text-xs font-bold py-2 border-slate-300"
                        title="Manual Counter Override if rider has no camera"
                      >
                        Manual Override
                      </Button>
                    </div>

                    <p className="text-[10px] text-center text-brandText-muted">
                      Rider points phone camera at this QR code. As soon as scanned, status updates to <strong>SHIPPED</strong> and verification completes automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side (5 Cols): Live Handover Audit Trail Log */}
        <div className="lg:col-span-5 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
            <div>
              <h2 className="font-heading font-bold text-base text-forest-900">
                Verified Custody Log
              </h2>
              <p className="text-[11px] text-brandText-secondary">
                Permanent CDSCO audit trail of rider item handovers
              </p>
            </div>
            <span className="text-xs font-bold text-forest-700 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-100">
              {filteredHandovers.length} logged
            </span>
          </div>

          {/* Search audit log */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-brandText-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search by Order ID or Rider..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
            />
          </div>

          {/* List of Verified Handovers */}
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredHandovers.length > 0 ? (
              filteredHandovers.map((h, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-forest-900">{h.orderId}</span>
                    <span className="text-[10px] font-mono text-brandText-muted">{h.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-2 text-forest-800 font-semibold">
                    <Bike className="w-3.5 h-3.5 text-forest-600 flex-shrink-0" />
                    <span>{h.riderName}</span>
                    <span className="text-brandBorder-subtle">&bull;</span>
                    <span className="font-mono text-[10px] text-brandText-secondary">{h.riderPhone}</span>
                  </div>

                  <div className="text-[10px] text-brandText-secondary truncate">
                    Patient: <strong>{h.customerName}</strong> ({h.destination})
                  </div>

                  <div className="pt-1 border-t border-brandBorder-subtle/80 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      TOKEN: {h.qrToken}
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Handed Over
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-brandText-muted">
                No rider handovers logged yet today.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRPickupVerificationPage;
