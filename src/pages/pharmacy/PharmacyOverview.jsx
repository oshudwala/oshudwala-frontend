import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  FileText,
  ShoppingBag,
  QrCode,
  Layers,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Bike,
  RefreshCw,
  Phone,
  MapPin,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { pharmacyApi } from '../../services/api/pharmacy.api';
import { prescriptionApi } from '../../services/api/prescription.api';
import { orderApi } from '../../services/api/order.api';
import { accountRegistry } from '../../services/api/accountRegistry';
import Button from '../../components/common/Button';

export const PharmacyOverview = () => {
  const { user } = useAuth();
  const { orders, prescriptions, inventory, updateOrderStatus } = useWorkspaceStore();
  const { addToast } = useToast();

  const [pharmacyDetails, setPharmacyDetails] = useState(null);
  const [backendPrescriptions, setBackendPrescriptions] = useState([]);
  const [backendOrders, setBackendOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeStatus, setStoreStatus] = useState(() =>
    pharmacyApi.getPharmacyStatus(user?.pharmacyId || user?.id)
  );

  // Load real pharmacy data, prescriptions & orders from backend
  const loadPharmacyData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch real pharmacy info, prescriptions, and orders in parallel
      const [myRes, rxRes, ordersRes] = await Promise.allSettled([
        pharmacyApi.getMyPharmacy().catch(() => null),
        prescriptionApi.getPharmacyPrescriptions().catch(() => []),
        orderApi.getPharmacyOrders().catch(() => []),
      ]);

      let realPharm = null;
      if (myRes.status === 'fulfilled' && myRes.value && !myRes.value.unmounted && myRes.value.id) {
        realPharm = myRes.value;
      }

      // Check registered pharmacies in account registry if not found
      if (!realPharm) {
        const registeredPharmacies = accountRegistry.getEntities().pharmacies || [];
        const matched = registeredPharmacies.find(
          (p) =>
            p.id === user?.id ||
            p.email?.toLowerCase() === user?.email?.toLowerCase() ||
            (user?.phone && p.phone && p.phone.replace(/[^0-9]/g, '') === user.phone.replace(/[^0-9]/g, ''))
        );
        realPharm = matched || registeredPharmacies[0] || null;
      }

      if (!realPharm) {
        realPharm = {
          id: user?.id || 'pharma-01',
          name: user?.pharmacyName || user?.entityData?.name || (user?.fullName ? `${user.fullName} Pharmacy` : 'Oshud Wala Partner Pharmacy'),
          licenseNumber: user?.entityData?.licenseNumber || 'WB-PHARM-2026-ACTIVE',
          line1: user?.entityData?.line1 || 'Sector V, Salt Lake',
          city: user?.entityData?.city || 'Kolkata',
          state: user?.entityData?.state || 'West Bengal',
          pincode: user?.entityData?.pincode || '700091',
          phone: user?.phone || '+91 33 2357 8900',
        };
      }

      setPharmacyDetails(realPharm);
      const currentStatus = pharmacyApi.getPharmacyStatus(realPharm.id);
      setStoreStatus(currentStatus);

      // Map backend prescriptions
      if (rxRes.status === 'fulfilled' && Array.isArray(rxRes.value)) {
        const mappedRx = rxRes.value.map((r) => ({
          id: r.id,
          prescriptionNumber: r.prescriptionNumber || r.id,
          patientName: r.patient?.fullName || 'Walk-in / App Patient',
          patientPhone: r.patient?.phone || '',
          doctorName: r.doctorName || 'Registered Medical Practitioner',
          status: r.status === 'SUBMITTED' ? 'PENDING_VERIFICATION' : r.status,
          extractedMedicines: r.items?.map((it) => ({
            name: it.nameAsWritten || 'Prescribed Medicine',
            qty: it.quantity || 1,
          })) || [],
          createdAt: r.createdAt || new Date().toISOString(),
        }));
        setBackendPrescriptions(mappedRx);
      }

      // Map backend orders
      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
        setBackendOrders(ordersRes.value);
      }
    } catch (e) {
      console.warn('Error loading pharmacy data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPharmacyData();
  }, [user]);

  // Real-time synchronization on events & storage
  useEffect(() => {
    const handleSync = () => {
      loadPharmacyData();
    };

    window.addEventListener('oshud_order_created', handleSync);
    window.addEventListener('oshud_order_status_updated', handleSync);
    window.addEventListener('oshud_prescription_created', handleSync);
    window.addEventListener('oshud_prescription_verified', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('oshud_order_created', handleSync);
      window.removeEventListener('oshud_order_status_updated', handleSync);
      window.removeEventListener('oshud_prescription_created', handleSync);
      window.removeEventListener('oshud_prescription_verified', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleStatusChange = async (newStatus) => {
    const pharmId = pharmacyDetails?.id || user?.id || 'pharma-01';
    setStoreStatus(newStatus);
    await pharmacyApi.updatePharmacyStatus(pharmId, newStatus);
    const messages = {
      OPEN: 'Pharmacy set to OPEN: Patients can place orders and request express delivery.',
      BUSY: 'Pharmacy set to HIGH VOLUME: Patients will see a high volume delay notice.',
      CLOSED: 'Pharmacy set to CLOSED: Delivery orders temporarily paused for store maintenance.',
    };
    addToast(messages[newStatus] || `Status updated to ${newStatus}`, newStatus === 'CLOSED' ? 'info' : 'success');
  };

  // Merge real backend prescriptions with workspace store
  const allPrescriptions = useMemo(() => {
    const map = new Map();
    // 1. Real backend records first
    backendPrescriptions.forEach((rx) => {
      map.set(rx.id, rx);
      if (rx.prescriptionNumber) map.set(rx.prescriptionNumber, rx);
    });

    // 2. Overlay workspace store records
    (prescriptions || []).forEach((rx) => {
      const key = rx.prescriptionNumber || rx.id;
      if (!map.has(key) && !map.has(rx.id)) {
        map.set(key, rx);
      }
    });

    return Array.from(new Set(map.values()));
  }, [backendPrescriptions, prescriptions]);

  const pendingRx = useMemo(() => {
    return allPrescriptions.filter(
      (p) => p.status === 'SUBMITTED' || p.status === 'PENDING_VERIFICATION' || p.status === 'PENDING'
    );
  }, [allPrescriptions]);

  // Merge real backend orders with workspace store
  const myOrders = useMemo(() => {
    const map = new Map();

    backendOrders.forEach((bo) => {
      const key = bo.orderNumber || bo.id;
      const subtotal = bo.subtotalPaise ? bo.subtotalPaise / 100 : 0;
      const total = bo.totalPaise ? bo.totalPaise / 100 : subtotal;

      map.set(key, {
        id: bo.orderNumber || bo.id,
        backendId: bo.id,
        orderNumber: bo.orderNumber,
        status: bo.status,
        customerName: bo.deliveryAddress?.fullName || bo.patient?.fullName || 'Walk-in Customer',
        customerPhone: bo.deliveryAddress?.phone || bo.patient?.phone || '',
        address: bo.deliveryAddress?.line1 || '',
        area: bo.deliveryAddress?.area || '',
        total,
        subtotal,
        paymentMethod: bo.paymentMethod || 'COD',
        items: (bo.items || []).map((it) => ({
          name: it.nameSnapshot || it.name || 'Prescription Medicine',
          qty: it.quantity || 1,
          quantity: it.quantity || 1,
          price: (it.unitPricePaise || it.mrpPaise || 0) / 100,
        })),
        createdAt: bo.placedAt || bo.createdAt || new Date().toISOString(),
      });
    });

    (orders || []).forEach((o) => {
      const key = o.orderNumber || o.id;
      if (!map.has(key) && !map.has(o.backendId || o.id)) {
        map.set(key, o);
      }
    });

    return Array.from(new Set(map.values()));
  }, [backendOrders, orders]);

  const preparingOrders = useMemo(() => {
    return myOrders.filter((o) => o.status === 'PREPARING' || o.status === 'APPROVED_PREPARING');
  }, [myOrders]);

  const readyPickupOrders = useMemo(() => {
    return myOrders.filter((o) => o.status === 'READY_FOR_PICKUP' || o.status === 'APPROVED_PREPARED');
  }, [myOrders]);

  const expiringStock = useMemo(() => {
    return (inventory || []).filter((i) => i.status === 'EXPIRING_SOON');
  }, [inventory]);

  const handleMarkPrepared = async (order) => {
    updateOrderStatus(order.id, 'READY_FOR_PICKUP');
    try {
      if (order.backendId || (order.id && !order.id.startsWith('OW-WALK-'))) {
        await orderApi.updateOrderStatus(order.backendId || order.id, 'READY_FOR_PICKUP').catch(() => {});
      }
    } catch {}

    window.dispatchEvent(
      new CustomEvent('oshud_order_status_updated', {
        detail: { orderId: order.id, status: 'READY_FOR_PICKUP' },
      })
    );
    try {
      localStorage.setItem(
        'oshud_last_status_event',
        JSON.stringify({ orderId: order.id, status: 'READY_FOR_PICKUP', time: Date.now() })
      );
    } catch (e) {}

    loadPharmacyData();
    addToast(
      `Order ${order.id} marked Approved & Prepared! Admin will now assign a delivery rider.`,
      'success'
    );
  };

  const pharmacyDisplayName =
    pharmacyDetails?.name || user?.pharmacyName || user?.fullName || 'Oshud Wala Partner Pharmacy';
  const pharmacyLicense = pharmacyDetails?.licenseNumber || 'WB-DL-ACTIVE-2026';
  const pharmacyLocation = `${pharmacyDetails?.line1 || 'Main Market'}, ${pharmacyDetails?.city || 'Kolkata'}${
    pharmacyDetails?.pincode ? ` - ${pharmacyDetails.pincode}` : ''
  }`;

  return (
    <div className="space-y-6">
      {/* Top Banner / Real Pharmacy Info & Status */}
      <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 flex-shrink-0 shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-900">
                {pharmacyDisplayName}
              </h1>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                  storeStatus === 'OPEN'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : storeStatus === 'BUSY'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    storeStatus === 'OPEN'
                      ? 'bg-emerald-600 animate-pulse'
                      : storeStatus === 'BUSY'
                      ? 'bg-amber-600'
                      : 'bg-rose-600'
                  }`}
                />
                <span>{storeStatus === 'OPEN' ? 'Open for Delivery' : storeStatus === 'BUSY' ? 'High Volume' : 'Closed'}</span>
              </span>
            </div>
            <p className="text-xs text-forest-700 font-semibold mt-0.5 flex items-center gap-1.5 flex-wrap">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>License: {pharmacyLicense}</span>
              <span>&bull;</span>
              <MapPin className="w-3.5 h-3.5 text-brandText-muted" />
              <span>{pharmacyLocation}</span>
            </p>
            <p className="text-[11px] text-brandText-secondary mt-0.5">
              Pharmacist on Duty: <strong>{user?.fullName || user?.name || 'Licensed In-Charge Pharmacist'}</strong>
              {user?.phone ? ` • Phone: ${user.phone}` : ''}
            </p>
          </div>
        </div>

        {/* Operating Status Selector & Refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-warm p-1.5 rounded-2xl border border-brandBorder-subtle shadow-sm">
            <button
              type="button"
              onClick={() => handleStatusChange('OPEN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                storeStatus === 'OPEN'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-brandText-secondary hover:text-emerald-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              <span>Open for Delivery</span>
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('BUSY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                storeStatus === 'BUSY'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-brandText-secondary hover:text-amber-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-300" />
              <span>High Volume</span>
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('CLOSED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                storeStatus === 'CLOSED'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'text-brandText-secondary hover:text-rose-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-300" />
              <span>Closed</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadPharmacyData}
            title="Refresh from Backend"
            className="p-2 sm:px-3 text-xs"
          >
            <RefreshCw className={`w-4 h-4 text-forest-700 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Prescriptions to Audit"
          value={pendingRx.length}
          change="Schedule H / H1"
          trend="neutral"
          caption="awaiting approval"
          icon={FileText}
          colorScheme="rose"
        />
        <MetricCard
          title="Orders In Packing"
          value={preparingOrders.length}
          change="In Dispensation"
          trend="up"
          caption="assembly queue"
          icon={ShoppingBag}
          colorScheme="blue"
        />
        <MetricCard
          title="Ready for Rider Pickup"
          value={readyPickupOrders.length}
          change="Awaiting Rider Handover"
          trend="neutral"
          caption="packed & sealed"
          icon={QrCode}
          colorScheme="emerald"
        />
        <MetricCard
          title="Batches Expiring Soon"
          value={expiringStock.length}
          change="< 30 days"
          trend="down"
          caption="requires audit"
          icon={AlertTriangle}
          colorScheme="amber"
        />
      </div>

      {/* 2-Column Working Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Orders Packing & Handover Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-extrabold text-base text-forest-900">
                  Orders Requiring Fulfillment
                </h2>
                <p className="text-xs text-brandText-secondary">
                  Dispense, pack with tamper-proof seal, and generate pickup QR code
                </p>
              </div>
              <Link
                to="/pharmacy/orders"
                className="text-xs font-bold text-forest-700 hover:underline flex items-center gap-1"
              >
                <span>Full Orders Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-brandBorder-subtle">
              {myOrders
                .filter((o) => ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status))
                .map((order) => (
                  <div
                    key={order.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-forest-900">
                          {order.id}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs font-bold text-forest-900">{order.customerName}</p>
                      <p className="text-[11px] text-brandText-secondary">
                        {order.items?.map((i) => `${i.name} (x${i.qty || i.quantity || 1})`).join(', ') || 'Prescription Items'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {(order.status === 'PREPARING' || order.status === 'APPROVED_PREPARING') && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleMarkPrepared(order)}
                          className="text-xs font-bold bg-forest-800 hover:bg-forest-900 flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Prepared</span>
                        </Button>
                      )}
                      {(order.status === 'READY_FOR_PICKUP' || order.status === 'APPROVED_PREPARED') && (
                        <Link
                          to="/pharmacy/pickup"
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Handover to Rider</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              {myOrders.filter((o) => ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status)).length === 0 && (
                <div className="py-8 text-center text-xs text-brandText-muted">
                  No orders currently waiting for preparation or pickup.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Prescriptions Waiting for Verification */}
        <div className="space-y-6">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-forest-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-forest-600" />
                <span>Pending Prescriptions ({pendingRx.length})</span>
              </h3>
              <Link
                to="/pharmacy/prescriptions"
                className="text-xs font-bold text-forest-700 hover:underline"
              >
                Audit Desk
              </Link>
            </div>

            <div className="divide-y divide-brandBorder-subtle">
              {pendingRx.map((rx) => (
                <div key={rx.id} className="py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-forest-800">
                      {rx.prescriptionNumber || rx.id}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Needs Sign-off
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-forest-900">{rx.patientName}</p>
                    <p className="text-[11px] text-brandText-secondary">{rx.doctorName}</p>
                    {rx.extractedMedicines && rx.extractedMedicines.length > 0 && (
                      <p className="text-[10px] text-brandText-muted mt-0.5">
                        {rx.extractedMedicines.map((m) => m.name).slice(0, 2).join(', ')}
                        {rx.extractedMedicines.length > 2 ? ` +${rx.extractedMedicines.length - 2} more` : ''}
                      </p>
                    )}
                  </div>
                  <Link
                    to="/pharmacy/prescriptions"
                    className="block text-center py-1.5 bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    Open Verification Deck
                  </Link>
                </div>
              ))}
              {pendingRx.length === 0 && (
                <p className="text-xs text-brandText-muted py-6 text-center">
                  All prescriptions audited and verified!
                </p>
              )}
            </div>
          </div>

          {/* Quick Access to Wallet & Daily Bills */}
          <div className="bg-gradient-to-br from-forest-900 to-forest-950 rounded-3xl p-5 text-white shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-forest-800/80 text-emerald-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-white">
                    Pharmacy Wallet & Billing
                  </h3>
                  <p className="text-[11px] text-forest-200">
                    Daily order list & bill statements
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-forest-200/90 leading-relaxed">
              Track itemized bills for all daily prescriptions and orders, request payouts, and monitor COD settlements.
            </p>
            <Link
              to="/pharmacy/wallet"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-forest-950 font-heading font-bold text-xs transition-colors shadow-sm"
            >
              <span>Open Wallet & Daily Bills</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyOverview;
