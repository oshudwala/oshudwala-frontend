import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { pharmacyApi } from '../../services/api/pharmacy.api';
import { accountRegistry } from '../../services/api/accountRegistry';
import Button from '../../components/common/Button';

export const PharmacyOverview = () => {
  const { user } = useAuth();
  const { orders, prescriptions, inventory, updateOrderStatus } = useWorkspaceStore();
  const { addToast } = useToast();

  const [pharmacyDetails, setPharmacyDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storeStatus, setStoreStatus] = useState(() =>
    pharmacyApi.getPharmacyStatus(user?.pharmacyId || user?.id)
  );

  // Load real pharmacy data from backend & account registry
  const loadPharmacyData = async () => {
    setIsLoading(true);
    try {
      // 1. Try backend /pharmacies/my or /pharmacies
      let realPharm = null;
      try {
        const myRes = await pharmacyApi.getMyPharmacy();
        if (myRes && !myRes.unmounted && myRes.id) {
          realPharm = myRes;
        }
      } catch (err) {
        console.warn('Backend /pharmacies/my note:', err);
      }

      // 2. Check registered pharmacies in account registry
      if (!realPharm) {
        const registeredPharmacies = accountRegistry.getEntities().pharmacies || [];
        // Match by user email, phone, or owner ID
        const matched = registeredPharmacies.find(
          (p) =>
            p.id === user?.id ||
            p.email?.toLowerCase() === user?.email?.toLowerCase() ||
            (user?.phone && p.phone && p.phone.replace(/[^0-9]/g, '') === user.phone.replace(/[^0-9]/g, ''))
        );
        if (matched) {
          realPharm = matched;
        } else if (registeredPharmacies.length > 0) {
          realPharm = registeredPharmacies[0];
        }
      }

      // 3. Fallback to user context or primary partner pharmacy info
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
    } catch (e) {
      console.warn('Error loading pharmacy data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPharmacyData();
  }, [user]);

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

  const myOrders = orders;
  const pendingRx = prescriptions.filter((p) => p.status === 'PENDING_VERIFICATION');
  const preparingOrders = myOrders.filter((o) => o.status === 'PREPARING');
  const readyPickupOrders = myOrders.filter((o) => o.status === 'READY_FOR_PICKUP');
  const expiringStock = inventory.filter((i) => i.status === 'EXPIRING_SOON');

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
                        {order.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {order.status === 'PREPARING' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            updateOrderStatus(order.id, 'READY_FOR_PICKUP');
                            addToast(`Order ${order.id} marked Packed & Ready for Pickup!`, 'success');
                          }}
                          className="text-xs font-bold"
                        >
                          Mark Ready for Pickup
                        </Button>
                      )}
                      {order.status === 'READY_FOR_PICKUP' && (
                        <Link
                          to="/pharmacy/pickup"
                          className="px-3 py-1.5 bg-forest-800 hover:bg-forest-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Handover to Rider</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Prescriptions Waiting for Verification */}
        <div className="space-y-6">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-forest-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-forest-600" />
                <span>Pending Prescriptions</span>
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
                    <span className="font-mono text-xs font-bold text-forest-800">{rx.id}</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Needs Sign-off
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-forest-900">{rx.patientName}</p>
                    <p className="text-[11px] text-brandText-secondary">{rx.doctorName}</p>
                  </div>
                  <Link
                    to="/pharmacy/prescriptions"
                    className="block text-center py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-800 text-xs font-bold rounded-xl border border-forest-100 transition-colors"
                  >
                    Open Verification Deck
                  </Link>
                </div>
              ))}
              {pendingRx.length === 0 && (
                <p className="text-xs text-brandText-muted py-4 text-center">
                  All prescriptions audited and verified!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyOverview;
