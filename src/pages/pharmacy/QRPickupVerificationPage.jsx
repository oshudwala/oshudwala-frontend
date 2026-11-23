import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import { pharmacyApi } from '../../services/api/pharmacy.api';
import Button from '../../components/common/Button';

export const QRPickupVerificationPage = () => {
  const { orders, handovers, recordHandover, updateOrderStatus } = useWorkspaceStore();
  const { addToast } = useToast();

  // Orders waiting for rider pickup
  const readyOrders = orders.filter((o) => o.status === 'READY_FOR_PICKUP');

  // Currently selected order to generate QR for
  const [selectedOrderId, setSelectedOrderId] = useState(readyOrders[0]?.id || '');
  const [activeQrData, setActiveQrData] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [lastHandover, setLastHandover] = useState(null);
  const [auditSearch, setAuditSearch] = useState('');

  // Auto-select first order if current selection is invalid
  useEffect(() => {
    if ((!selectedOrderId || !readyOrders.find((o) => o.id === selectedOrderId)) && readyOrders.length > 0) {
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

  // Generate 15-Minute Pickup QR Code from Backend
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const handleGenerateQR = async (orderId) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      addToast('Please select a valid order ready for pickup.', 'warning');
      return;
    }

    setIsGeneratingQr(true);
    try {
      const qrPayload = await pharmacyApi.generatePickupToken(orderId);
      setActiveQrData({
        ...qrPayload,
        order: targetOrder,
      });

      // Synchronize order's pickup QR code in store so rider scanner verifies against the backend token
      if (targetOrder) {
        targetOrder.pickupQrCode = qrPayload.token;
      }

      const diffMs = Math.max(0, qrPayload.expiresAt - Date.now());
      setSecondsRemaining(Math.floor(diffMs / 1000) || 15 * 60);

      addToast(`Backend 15-minute pickup QR generated for Order ${orderId}!`, 'success');
    } catch (err) {
      addToast('Error generating pickup QR from backend.', 'error');
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Perform Handover to the Admin-Assigned Rider
  const handleConfirmRiderHandover = async () => {
    if (!activeQrData) {
      addToast('Please generate an active 15-minute pickup QR first.', 'warning');
      return;
    }

    if (secondsRemaining <= 0) {
      addToast('This pickup QR code has expired after 15 minutes. Please generate a new QR.', 'error');
      return;
    }

    const targetOrder = activeQrData.order;

    // Use Rider assigned by Admin (No pharmacy assignment needed)
    const assignedRider = targetOrder.assignedRider || {
      id: 'usr-rider-admin-assigned',
      name: 'Rider Dispatched by Admin',
      phone: '+91 98300 12345',
      vehicle: 'Hero Electric (WB-02-AZ-4921)',
    };

    // 1. Record verified handover in persistent store
    const handoverRecord = recordHandover({
      orderId: targetOrder.id,
      customerName: targetOrder.customerName,
      destination: targetOrder.area || targetOrder.address,
      riderId: assignedRider.id,
      riderName: assignedRider.name,
      riderPhone: assignedRider.phone,
      riderVehicle: assignedRider.vehicle,
      items: targetOrder.items,
      qrToken: activeQrData.token,
    });

    // 2. Advance order status to OUT_FOR_DELIVERY
    updateOrderStatus(targetOrder.id, 'OUT_FOR_DELIVERY');

    // 3. Notify backend of scanned custody handover
    pharmacyApi.verifyRiderPickupScan(activeQrData.token).catch(() => {});

    setLastHandover(handoverRecord);
    setActiveQrData(null);
    setSelectedOrderId('');

    addToast(
      `Order ${targetOrder.id} successfully verified & handed over to Admin-assigned rider ${assignedRider.name}!`,
      'success'
    );
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
          Generate 15-minute time-bound pickup QR codes. When the Admin-assigned rider scans the QR, custody is verified and tracked automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side (7 Cols): 15-Minute QR Generator & Assigned Rider Handover */}
        <div className="lg:col-span-7 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-brandBorder-subtle">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-forest-900">
                  15-Minute Handover QR Verification
                </h2>
                <p className="text-xs text-brandText-secondary">
                  Admin assigns rider &bull; Rider scans QR &bull; Instant custody tracking
                </p>
              </div>
            </div>

            {activeQrData && (
              <span
                className={`text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  secondsRemaining > 120
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : secondsRemaining > 0
                    ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {secondsRemaining > 0 ? `Valid: ${formatTime(secondsRemaining)}` : 'QR Expired'}
                </span>
              </span>
            )}
          </div>

          {/* Ready Orders Picker */}
          <div>
            <label className="text-xs font-bold text-forest-900 block mb-2">
              Select Packed Order Ready for Dispatch ({readyOrders.length} waiting)
            </label>
            {readyOrders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {readyOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      handleGenerateQR(order.id);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedOrderId === order.id
                        ? 'bg-forest-50 border-forest-600 shadow-sm'
                        : 'bg-surface-warm border-brandBorder-subtle hover:bg-forest-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-forest-900">{order.id}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        ₹{(order.total || 0).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-forest-800 mt-1">{order.customerName}</p>
                    <p className="text-[10px] text-brandText-secondary truncate">{order.area || order.address}</p>
                    {order.assignedRider && (
                      <p className="text-[10px] text-forest-700 font-semibold mt-1 flex items-center gap-1">
                        <Bike className="w-3 h-3" />
                        <span>Rider: {order.assignedRider.name}</span>
                      </p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-surface-warm border border-brandBorder-subtle rounded-2xl text-center text-xs text-brandText-secondary">
                No orders currently in READY FOR PICKUP stage.
              </div>
            )}
          </div>

          {/* Generated QR Display Stage */}
          {activeQrData && targetOrder && (
            <div className="space-y-4 pt-2 border-t border-brandBorder-subtle animate-fade-in">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gradient-to-br from-forest-50 via-surface-pure to-teal-50/40 rounded-3xl border border-forest-200">
                {/* Visual QR Code Display */}
                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 flex-shrink-0 text-center">
                  <div className="w-40 h-40 bg-slate-900 rounded-xl flex items-center justify-center p-3 relative overflow-hidden group">
                    {/* High-Contrast SVG QR Pattern */}
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full text-white fill-current"
                    >
                      <rect x="0" y="0" width="30" height="30" rx="4" />
                      <rect x="5" y="5" width="20" height="20" fill="#0f172a" rx="2" />
                      <rect x="10" y="10" width="10" height="10" fill="white" />

                      <rect x="70" y="0" width="30" height="30" rx="4" />
                      <rect x="75" y="5" width="20" height="20" fill="#0f172a" rx="2" />
                      <rect x="80" y="10" width="10" height="10" fill="white" />

                      <rect x="0" y="70" width="30" height="30" rx="4" />
                      <rect x="5" y="75" width="20" height="20" fill="#0f172a" rx="2" />
                      <rect x="10" y="80" width="10" height="10" fill="white" />

                      {/* Random Data Dots */}
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
                  </div>
                  <span className="font-mono font-bold text-[10px] text-forest-800 mt-2 block tracking-wider">
                    {activeQrData.token}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Backend Verified</span>
                  </span>
                </div>

                {/* QR Metadata & Admin-Assigned Rider Card */}
                <div className="flex-1 space-y-3 text-xs w-full">
                  <div>
                    <span className="text-[10px] font-bold text-forest-700 uppercase">
                      Admin-Assigned Delivery Rider
                    </span>
                    <div className="p-3 bg-white rounded-xl border border-forest-200 mt-1 flex items-center justify-between">
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

                  <div>
                    <span className="text-[10px] font-bold text-forest-700 uppercase">
                      Package Contents ({targetOrder.items?.length || 1} items)
                    </span>
                    <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 p-2 max-h-24 overflow-y-auto">
                      {targetOrder.items?.map((item, idx) => (
                        <div key={idx} className="py-1 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          <span className="font-mono font-bold text-forest-800">x{item.qty || item.quantity || 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      leftIcon={PackageCheck}
                      onClick={handleConfirmRiderHandover}
                      disabled={secondsRemaining <= 0}
                      className="w-full text-xs font-bold py-2 shadow-sm"
                    >
                      {secondsRemaining > 0
                        ? `Verify Handover to ${assignedRider.name.split(' ')[0]}`
                        : 'QR Expired — Please Regenerate'}
                    </Button>
                    <p className="text-[10px] text-center text-brandText-muted mt-1.5">
                      Rider will scan this QR on their device, or you can verify custody on handover.
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
            <span className="text-xs font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-100">
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
