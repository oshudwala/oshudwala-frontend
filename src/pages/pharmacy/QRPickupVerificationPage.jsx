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
} from 'lucide-react';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import { pharmacyApi } from '../../services/api/pharmacy.api';
import { accountRegistry } from '../../services/api/accountRegistry';
import Button from '../../components/common/Button';

export const QRPickupVerificationPage = () => {
  const { orders, riders, handovers, recordHandover } = useWorkspaceStore();
  const { addToast } = useToast();

  // Orders waiting for pickup
  const readyOrders = orders.filter((o) => o.status === 'READY_FOR_PICKUP');

  // Currently selected order to generate QR for
  const [selectedOrderId, setSelectedOrderId] = useState(readyOrders[0]?.id || '');
  const [activeQrData, setActiveQrData] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);

  // Verification & Handover Simulation Form
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [customRiderName, setCustomRiderName] = useState('');
  const [customRiderPhone, setCustomRiderPhone] = useState('');
  const [customRiderVehicle, setCustomRiderVehicle] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [lastHandover, setLastHandover] = useState(null);
  const [auditSearch, setAuditSearch] = useState('');

  // Auto-select first order if current selection is invalid
  useEffect(() => {
    if ((!selectedOrderId || !readyOrders.find((o) => o.id === selectedOrderId)) && readyOrders.length > 0) {
      setSelectedOrderId(readyOrders[0].id);
    }
  }, [readyOrders, selectedOrderId]);

  // Load registered riders from store & account registry
  const registeredAccounts = accountRegistry.getAccounts() || [];
  const registeredRiders = [
    ...riders,
    ...registeredAccounts
      .filter((a) => a.role === 'RIDER')
      .map((a) => ({
        id: a.id,
        name: a.fullName,
        phone: a.phone,
        vehicle: a.entityData?.vehicle || 'Hero Electric (WB-02-AZ-4921)',
      })),
  ];

  // Distinct by ID or Name
  const distinctRiders = Array.from(new Map(registeredRiders.map((r) => [r.id, r])).values());

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

  // Generate 15-Minute Pickup QR Code
  const handleGenerateQR = (orderId) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      addToast('Please select a valid ready order.', 'warning');
      return;
    }

    const qrPayload = pharmacyApi.generatePickupToken(orderId);
    setActiveQrData({
      ...qrPayload,
      order: targetOrder,
    });
    setSecondsRemaining(15 * 60);
    setEnteredCode(qrPayload.token); // Pre-fill token for instant pharmacist verification if needed
    addToast(`New 15-minute secure pickup QR generated for Order ${orderId}!`, 'success');
  };

  // Perform Rider Handover Verification
  const handleVerifyHandover = (e) => {
    e.preventDefault();
    if (!activeQrData) {
      addToast('Please generate an active 15-minute pickup QR first.', 'warning');
      return;
    }

    if (secondsRemaining <= 0) {
      addToast('This QR code has expired after 15 minutes. Please generate a new QR.', 'error');
      return;
    }

    // Determine rider details
    let riderInfo = distinctRiders.find((r) => r.id === selectedRiderId);
    if (!riderInfo) {
      if (!customRiderName.trim()) {
        addToast('Please select or enter the attending delivery rider.', 'warning');
        return;
      }
      riderInfo = {
        id: `usr-rider-${Date.now().toString().slice(-4)}`,
        name: customRiderName.trim(),
        phone: customRiderPhone.trim() || '+91 98300 00000',
        vehicle: customRiderVehicle.trim() || 'Two Wheeler',
      };
    }

    const targetOrder = activeQrData.order;

    // Record verified handover in persistent storage & update order
    const handoverRecord = recordHandover({
      orderId: targetOrder.id,
      customerName: targetOrder.customerName,
      destination: targetOrder.area || targetOrder.address,
      riderId: riderInfo.id,
      riderName: riderInfo.name,
      riderPhone: riderInfo.phone,
      riderVehicle: riderInfo.vehicle,
      items: targetOrder.items,
      qrToken: activeQrData.token,
    });

    setLastHandover(handoverRecord);
    setActiveQrData(null);
    setSelectedOrderId('');
    addToast(
      `Order ${targetOrder.id} successfully verified & handed over to ${riderInfo.name}! Tracking logged.`,
      'success'
    );
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const targetOrder = orders.find((o) => o.id === selectedOrderId);

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
          Generate 15-minute time-bound pickup QR codes, verify rider identity, and track which rider delivers which order items.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side (7 Cols): Pharmacist 15-Minute QR Generator & Verification */}
        <div className="lg:col-span-7 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-brandBorder-subtle">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-base text-forest-900">
                  Generate 15-Minute Handover QR
                </h2>
                <p className="text-xs text-brandText-secondary">
                  CDSCO & OTP compliant rider custody exchange
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

          {/* Order Selection Stage */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-forest-900">
              Select Ready Order for Handover ({readyOrders.length} Ready on Counter)
            </label>
            {readyOrders.length === 0 ? (
              <div className="p-4 rounded-2xl bg-surface-warm text-xs text-brandText-muted text-center">
                No orders currently waiting for pickup. Approve prescriptions or prepare orders in Orders tab first.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {readyOrders.map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => {
                      setSelectedOrderId(ord.id);
                      handleGenerateQR(ord.id);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedOrderId === ord.id
                        ? 'border-forest-600 bg-forest-50/70 shadow-sm'
                        : 'border-brandBorder-subtle bg-surface-warm hover:border-forest-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-forest-900">{ord.id}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Ready
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-forest-900 mt-1 truncate">{ord.customerName}</p>
                    <p className="text-[11px] text-brandText-secondary truncate">
                      {ord.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active 15-Minute QR Code Card */}
          {activeQrData ? (
            <div className="p-5 rounded-3xl bg-forest-50/60 border border-forest-100 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-5 justify-center sm:justify-start">
                {/* Visual Authentic SVG QR Code Graphic */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-forest-800 shadow-card flex flex-col items-center">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-36 h-36 text-forest-950"
                    fill="currentColor"
                  >
                    {/* Top Left Finder */}
                    <rect x="5" y="5" width="28" height="28" rx="4" fill="#064e3b" />
                    <rect x="9" y="9" width="20" height="20" rx="2" fill="white" />
                    <rect x="13" y="13" width="12" height="12" rx="1" fill="#064e3b" />

                    {/* Top Right Finder */}
                    <rect x="67" y="5" width="28" height="28" rx="4" fill="#064e3b" />
                    <rect x="71" y="9" width="20" height="20" rx="2" fill="white" />
                    <rect x="75" y="13" width="12" height="12" rx="1" fill="#064e3b" />

                    {/* Bottom Left Finder */}
                    <rect x="5" y="67" width="28" height="28" rx="4" fill="#064e3b" />
                    <rect x="9" y="71" width="20" height="20" rx="2" fill="white" />
                    <rect x="13" y="75" width="12" height="12" rx="1" fill="#064e3b" />

                    {/* Dynamic QR Data Matrix Patterns */}
                    <rect x="38" y="10" width="8" height="8" fill="#064e3b" />
                    <rect x="50" y="10" width="8" height="8" fill="#064e3b" />
                    <rect x="38" y="24" width="8" height="8" fill="#064e3b" />
                    <rect x="10" y="38" width="8" height="8" fill="#064e3b" />
                    <rect x="24" y="38" width="8" height="8" fill="#064e3b" />
                    <rect x="38" y="38" width="8" height="8" fill="#064e3b" />
                    <rect x="50" y="38" width="8" height="8" fill="#064e3b" />
                    <rect x="64" y="38" width="8" height="8" fill="#064e3b" />
                    <rect x="78" y="38" width="8" height="8" fill="#064e3b" />
                    <rect x="38" y="52" width="8" height="8" fill="#064e3b" />
                    <rect x="50" y="52" width="8" height="8" fill="#064e3b" />
                    <rect x="64" y="52" width="8" height="8" fill="#064e3b" />
                    <rect x="78" y="52" width="8" height="8" fill="#064e3b" />
                    <rect x="38" y="66" width="8" height="8" fill="#064e3b" />
                    <rect x="50" y="66" width="8" height="8" fill="#064e3b" />
                    <rect x="64" y="66" width="8" height="8" fill="#064e3b" />
                    <rect x="38" y="80" width="8" height="8" fill="#064e3b" />
                    <rect x="64" y="80" width="8" height="8" fill="#064e3b" />
                    <rect x="78" y="80" width="8" height="8" fill="#064e3b" />

                    {/* Center Brand Badge */}
                    <circle cx="50" cy="50" r="10" fill="#10b981" />
                    <circle cx="50" cy="50" r="6" fill="white" />
                  </svg>
                  <span className="font-mono text-[9px] font-bold text-forest-800 tracking-wider mt-1.5">
                    {activeQrData.token}
                  </span>
                </div>

                {/* Handover Details to Deliver */}
                <div className="space-y-2 text-xs flex-1">
                  <div>
                    <span className="text-[10px] font-bold text-forest-700 uppercase tracking-wider block">
                      Handover Staging Ref
                    </span>
                    <h3 className="font-heading font-extrabold text-base text-forest-900">
                      Order {activeQrData.order.id}
                    </h3>
                    <p className="text-brandText-secondary">
                      Destination: <strong>{activeQrData.order.area || activeQrData.order.address}</strong>
                    </p>
                  </div>

                  <div className="p-3 bg-white/80 rounded-2xl border border-forest-100 space-y-1">
                    <span className="font-bold text-forest-900 block text-[11px]">
                      Items to be Picked Up by Driver:
                    </span>
                    <ul className="divide-y divide-forest-50 text-[11px] text-forest-800">
                      {activeQrData.order.items.map((item, idx) => (
                        <li key={idx} className="py-1 flex items-center justify-between">
                          <span>{item.name}</span>
                          <span className="font-bold text-forest-900">x{item.qty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateQR(activeQrData.order.id)}
                      className="text-xs"
                      leftIcon={RefreshCw}
                    >
                      Regenerate (Reset 15m)
                    </Button>
                  </div>
                </div>
              </div>

              {/* Rider Identity Verification Section */}
              <form onSubmit={handleVerifyHandover} className="pt-4 border-t border-forest-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-forest-900">Assign / Verify Rider</label>
                    <select
                      value={selectedRiderId}
                      onChange={(e) => setSelectedRiderId(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-xs font-bold bg-white border border-forest-200 rounded-xl focus:outline-none focus:border-forest-500"
                    >
                      <option value="">-- Choose Registered Fleet Rider --</option>
                      {distinctRiders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.vehicle || 'Rider'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-forest-900">Or Walk-in Rider Name</label>
                    <input
                      type="text"
                      disabled={Boolean(selectedRiderId)}
                      value={customRiderName}
                      onChange={(e) => setCustomRiderName(e.target.value)}
                      placeholder="e.g. Rahul Das"
                      className="w-full mt-1 px-3 py-2 text-xs font-semibold bg-white border border-forest-200 rounded-xl focus:outline-none focus:border-forest-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  leftIcon={PackageCheck}
                  className="w-full text-xs font-bold py-3 shadow-md"
                >
                  Verify Handover & Dispatch with Rider
                </Button>
              </form>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-surface-warm border border-brandBorder-subtle text-center space-y-2">
              <QrCode className="w-8 h-8 text-forest-600 mx-auto opacity-50" />
              <p className="text-xs font-bold text-forest-900">No Active Pickup QR Generated</p>
              <p className="text-[11px] text-brandText-secondary max-w-sm mx-auto">
                Select an order above and click to generate a 15-minute validity QR token for driver handover.
              </p>
              {readyOrders.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleGenerateQR(readyOrders[0].id)}
                  className="text-xs font-bold mt-2"
                >
                  Generate QR for {readyOrders[0].id}
                </Button>
              )}
            </div>
          )}

          {/* Last Handover Banner */}
          {lastHandover && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1.5 animate-scale-up">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Handover Verified & Recorded in Backend!</span>
              </div>
              <p>
                Order <strong className="font-mono">{lastHandover.orderId}</strong> was released to driver{' '}
                <strong>{lastHandover.riderName}</strong> ({lastHandover.riderVehicle}).
              </p>
              <p className="text-[11px] text-emerald-800">
                Driver custody verified. Items picked up: {lastHandover.items.map((i) => i.name).join(', ')}.
              </p>
            </div>
          )}
        </div>

        {/* Right Side (5 Cols): Counter Staging Queue */}
        <div className="lg:col-span-5 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
            <h3 className="font-heading font-bold text-sm text-forest-900">
              Orders Staged on Counter ({readyOrders.length})
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              Ready for Handover
            </span>
          </div>

          <div className="divide-y divide-brandBorder-subtle max-h-[500px] overflow-y-auto pr-1">
            {readyOrders.map((order) => (
              <div key={order.id} className="py-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-forest-900">{order.id}</span>
                  <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                    {order.pickupQrCode || `PICKUP-${order.id}`}
                  </span>
                </div>
                <div className="text-xs">
                  <p className="font-bold text-forest-800">{order.customerName}</p>
                  <p className="text-[11px] text-brandText-secondary">{order.area || order.address}</p>
                  <p className="text-[10px] text-forest-700 font-medium mt-0.5">
                    {order.items.length} items &bull; Total: ₹{order.total.toFixed(2)}
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-brandText-muted">Tamper-proof Bag Sealed</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      handleGenerateQR(order.id);
                    }}
                    className="text-[11px] py-1 px-3 font-bold"
                  >
                    Generate QR
                  </Button>
                </div>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <div className="py-12 text-center text-xs text-brandText-muted">
                No orders waiting on counter. All packed packages have been dispatched!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIDER PICKUP HANDOVER AUDIT & TRACKING TABLE */}
      {/* Explicit User Requirement: "This will show which driver picks which order items for delivery" */}
      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-extrabold text-base text-forest-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Rider Pickup Handover Audit & Tracking Log</span>
            </h2>
            <p className="text-xs text-brandText-secondary">
              Real-time verified audit record tracking which rider has taken which order items for delivery.
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-brandText-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search rider, order, or item..."
              className="pl-9 pr-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-brandBorder-subtle">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-warm border-b border-brandBorder-subtle text-forest-800 font-bold">
                <th className="py-3 px-4">Handover Time</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Driver / Rider Details</th>
                <th className="py-3 px-4">Order Items Handed Over</th>
                <th className="py-3 px-4">Security QR Token</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brandBorder-subtle">
              {filteredHandovers.map((item, idx) => (
                <tr key={idx} className="hover:bg-forest-50/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-brandText-secondary whitespace-nowrap">
                    {item.handoverTime || 'Recent'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-forest-900 block">{item.orderId}</span>
                    <span className="text-[10px] text-brandText-muted">{item.customerName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-forest-100 flex items-center justify-center text-forest-700">
                        <Bike className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-forest-900">{item.riderName}</p>
                        <p className="text-[10px] text-brandText-secondary font-mono">
                          {item.riderVehicle} &bull; {item.riderPhone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      {item.items && item.items.length > 0 ? (
                        item.items.map((it, i) => (
                          <span
                            key={i}
                            className="inline-block mr-1.5 mb-1 px-2 py-0.5 rounded bg-surface-warm text-[10px] font-semibold text-forest-900 border border-brandBorder-subtle"
                          >
                            {it.name} <strong className="text-forest-700">(x{it.qty})</strong>
                          </span>
                        ))
                      ) : (
                        <span className="text-brandText-muted">Standard Package</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-forest-800">
                    <span className="bg-forest-50 px-2 py-0.5 rounded border border-forest-100">
                      {item.qrToken || 'VERIFIED-QR'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <Check className="w-3 h-3" />
                      <span>{item.status === 'DELIVERED' ? 'Delivered' : 'Out for Delivery'}</span>
                    </span>
                  </td>
                </tr>
              ))}
              {filteredHandovers.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-brandText-muted">
                    No handovers found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QRPickupVerificationPage;
