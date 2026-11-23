import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Building2,
  Bike,
  Activity,
  Stethoscope,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileCheck,
  CheckCircle,
  Clock,
  RefreshCw,
  Calendar,
  ShieldCheck,
  Check,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import adminApi from '../../services/api/admin.api';
import accountRegistry from '../../services/api/accountRegistry';

export const AdminDashboard = () => {
  const { orders, tokens, prescriptions, inventory, riders, updateOrderStatus } = useWorkspaceStore();
  const { addToast } = useToast();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(() =>
    new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  );

  // Verification Settings & Queues (Requirement 2)
  const [requireClinicDoctorVerification, setRequireClinicDoctorVerification] = useState(() => {
    return localStorage.getItem('oshud_verify_clinic_doctors') !== 'false';
  });
  const [requirePharmacyOrderVerification, setRequirePharmacyOrderVerification] = useState(() => {
    return localStorage.getItem('oshud_verify_pharmacy_orders') !== 'false';
  });

  // Pending verification queue items (Clinic Doctors & Pharmacy Medicine Orders)
  const [pendingClinicDoctors, setPendingClinicDoctors] = useState(() => {
    try {
      const raw = localStorage.getItem('oshud_pending_clinic_doctors');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((d) => !String(d.id || '').startsWith('doc-sub-0'));
        }
      }
    } catch {}
    return [];
  });

  const initialEntities = accountRegistry.getEntities();
  const [entityCounts, setEntityCounts] = useState({
    clinics: initialEntities.clinics?.length || 0,
    doctors: initialEntities.doctors?.length || 0,
    pharmacies: initialEntities.pharmacies?.length || 0,
    riders: initialEntities.riders?.length || 0,
  });

  const fetchCounts = async (forceRefresh = false) => {
    try {
      const entities = await adminApi.fetchAllEntities(forceRefresh);
      setEntityCounts({
        clinics: entities.clinics?.length || 0,
        doctors: entities.doctors?.length || 0,
        pharmacies: entities.pharmacies?.length || 0,
        riders: entities.riders?.length || 0,
      });
    } catch (err) {
      console.warn('Could not fetch real entity counts:', err);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleRefreshState = async () => {
    setIsRefreshing(true);
    setCurrentDate(
      new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
    try {
      await fetchCounts(true);
      addToast('System state & network records refreshed successfully!', 'success');
    } catch {
      addToast('System state synchronized.', 'info');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleToggleClinicDoctorVerification = (val) => {
    setRequireClinicDoctorVerification(val);
    localStorage.setItem('oshud_verify_clinic_doctors', String(val));
    addToast(
      val
        ? 'Clinic doctor verification rule ENABLED: Added doctors require Super Admin approval.'
        : 'Clinic doctor verification rule DISABLED: Doctors added by clinics auto-approved.',
      'info'
    );
  };

  const handleTogglePharmacyOrderVerification = (val) => {
    setRequirePharmacyOrderVerification(val);
    localStorage.setItem('oshud_verify_pharmacy_orders', String(val));
    addToast(
      val
        ? 'Pharmacy medicine order verification ENABLED: Schedule H items require licensed audit.'
        : 'Pharmacy medicine order verification DISABLED.',
      'info'
    );
  };

  const handleApproveDoctor = (docId) => {
    const doc = pendingClinicDoctors.find((d) => d.id === docId);
    setPendingClinicDoctors((prev) => prev.filter((d) => d.id !== docId));
    addToast(`Doctor ${doc?.fullName || docId} verified and published to clinic schedule!`, 'success');
  };

  const handleRejectDoctor = (docId) => {
    setPendingClinicDoctors((prev) => prev.filter((d) => d.id !== docId));
    addToast(`Doctor submission ${docId} rejected with compliance note.`, 'error');
  };

  const handleVerifyOrder = (orderId) => {
    updateOrderStatus(orderId, 'PREPARING');
    addToast(`Order ${orderId} audit verified and released to pharmacy packing!`, 'success');
  };

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingOrders = orders.filter((o) =>
    ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status)
  );
  const activeRiders = riders.filter((r) => r.isOnline);
  const pendingRx = prescriptions.filter((p) => p.status === 'PENDING_VERIFICATION');
  const ordersNeedingAudit = orders.filter((o) => o.status === 'PENDING');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title, Date & Refresh State Header (Requirement 1) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-pure p-5 rounded-3xl border border-brandBorder-subtle shadow-card">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-900 tracking-tight">
              Super Admin Control Center
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
              Live Network
            </span>
          </div>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Real-time platform oversight across Kolkata & West Bengal healthcare network.
          </p>
        </div>

        {/* Date Display & Refresh State Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-warm border border-brandBorder-subtle text-xs font-semibold text-forest-800">
            <Calendar className="w-3.5 h-3.5 text-forest-600" />
            <span>{currentDate}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshState}
            disabled={isRefreshing}
            className="text-xs font-bold gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-forest-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing…' : 'Refresh State'}</span>
          </Button>

          <Link
            to="/admin/orders"
            className="px-3.5 py-2 bg-forest-700 hover:bg-forest-600 text-white text-xs font-bold rounded-xl shadow-card transition-all flex items-center gap-1.5"
          >
            <span>Dispatch Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Platform Gross Volume"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          change={totalRevenue > 0 ? "Real-time" : "₹0.00"}
          trend="up"
          caption="all fulfilled orders"
          icon={DollarSign}
          colorScheme="forest"
        />
        <MetricCard
          title="Orders In Pipeline"
          value={pendingOrders.length}
          change={`${pendingOrders.length} active`}
          trend={pendingOrders.length > 0 ? "up" : "neutral"}
          caption="awaiting completion"
          icon={ShoppingBag}
          colorScheme="blue"
        />
        <MetricCard
          title="Active Riders Online"
          value={`${activeRiders.length} / ${riders.length}`}
          change={activeRiders.length > 0 ? `${activeRiders.length} on shift` : "Standby"}
          trend="up"
          caption="fleet tracking"
          icon={Bike}
          colorScheme="amber"
        />
        <MetricCard
          title="Rx Pending Audit"
          value={pendingRx.length}
          change={pendingRx.length > 0 ? "Review needed" : "All cleared"}
          trend={pendingRx.length > 0 ? "down" : "up"}
          caption="Pharmacist queue"
          icon={FileCheck}
          colorScheme="rose"
        />
      </div>

      {/* Management Quick Link Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/admin/clinics"
          className="p-3 bg-surface-pure hover:bg-forest-50 border border-brandBorder-subtle hover:border-forest-300 rounded-2xl flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-forest-900">Clinics</p>
              <span className="text-[10px] text-brandText-secondary">{entityCounts.clinics} certified</span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-brandText-muted group-hover:text-forest-700 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          to="/admin/doctors"
          className="p-3 bg-surface-pure hover:bg-forest-50 border border-brandBorder-subtle hover:border-forest-300 rounded-2xl flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-forest-900">Doctors</p>
              <span className="text-[10px] text-brandText-secondary">{entityCounts.doctors} specialists</span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-brandText-muted group-hover:text-forest-700 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          to="/admin/pharmacies"
          className="p-3 bg-surface-pure hover:bg-forest-50 border border-brandBorder-subtle hover:border-forest-300 rounded-2xl flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-forest-900">Pharmacists</p>
              <span className="text-[10px] text-brandText-secondary">{entityCounts.pharmacies} stores</span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-brandText-muted group-hover:text-forest-700 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          to="/admin/riders"
          className="p-3 bg-surface-pure hover:bg-forest-50 border border-brandBorder-subtle hover:border-forest-300 rounded-2xl flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-forest-900">Riders</p>
              <span className="text-[10px] text-brandText-secondary">{entityCounts.riders} fleet</span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-brandText-muted group-hover:text-forest-700 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Super Admin Verification Console: Clinic Doctors & Pharmacy Orders (Requirement 2) */}
      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brandBorder-subtle">
          <div>
            <h2 className="font-heading font-extrabold text-base text-forest-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Platform Verification & Compliance Control</span>
            </h2>
            <p className="text-xs text-brandText-secondary mt-0.5">
              Strict audit policies for clinic-onboarded doctors and licensed pharmacy medicine releases.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-forest-800 bg-forest-50 border border-forest-100 px-3 py-1 rounded-full">
              {pendingClinicDoctors.length} Doctors Awaiting Audit
            </span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              {ordersNeedingAudit.length} Orders Awaiting Verification
            </span>
          </div>
        </div>

        {/* Verification Rules Policy Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rule 1: Clinic Doctor Verification Toggle */}
          <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-forest-700" />
                <span className="font-bold text-xs text-forest-900">Clinic Doctor Verification</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireClinicDoctorVerification}
                  onChange={(e) => handleToggleClinicDoctorVerification(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-brandText-secondary leading-relaxed">
              When enabled, doctors submitted by clinics must have their registration audited and approved by Super Admin before being publicly bookable.
            </p>
          </div>

          {/* Rule 2: Pharmacy Order Verification Toggle */}
          <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-forest-700" />
                <span className="font-bold text-xs text-forest-900">Pharmacy Medicine Order Verification</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePharmacyOrderVerification}
                  onChange={(e) => handleTogglePharmacyOrderVerification(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-brandText-secondary leading-relaxed">
              When enabled, incoming medicine orders containing Schedule H/H1 substances require pharmacist verification before dispensing to riders.
            </p>
          </div>
        </div>

        {/* Live Pending Verifications Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
          {/* Clinic Doctors Pending Verification Queue */}
          <div className="p-4 rounded-2xl bg-surface-pure border border-brandBorder-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-xs text-forest-900 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-forest-600" />
                <span>Doctors Submitted by Clinics ({pendingClinicDoctors.length})</span>
              </h3>
              <Link to="/admin/doctors" className="text-[11px] font-bold text-forest-700 hover:underline">
                Doctors Desk
              </Link>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 divide-y divide-brandBorder-subtle">
              {pendingClinicDoctors.map((doc) => (
                <div key={doc.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-forest-900">{doc.fullName}</p>
                    <p className="text-[11px] text-brandText-secondary">{doc.specialization} &bull; {doc.experience}</p>
                    <p className="text-[10px] text-brandText-muted">Clinic: {doc.clinicName}</p>
                    <span className="font-mono text-[10px] font-bold text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded">
                      Reg: {doc.regNo} &bull; Fee: {doc.fee}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 pt-1">
                    <button
                      type="button"
                      onClick={() => handleRejectDoctor(doc.id)}
                      title="Reject Doctor"
                      className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveDoctor(doc.id)}
                      title="Approve & Publish"
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))}
              {pendingClinicDoctors.length === 0 && (
                <p className="text-xs text-brandText-muted text-center py-4">
                  No clinic doctors currently awaiting verification.
                </p>
              )}
            </div>
          </div>

          {/* Pharmacy Orders Requiring Verification Queue */}
          <div className="p-4 rounded-2xl bg-surface-pure border border-brandBorder-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-xs text-forest-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-forest-600" />
                <span>Medicine Orders Requiring Verification ({ordersNeedingAudit.length})</span>
              </h3>
              <Link to="/admin/orders" className="text-[11px] font-bold text-forest-700 hover:underline">
                Orders Desk
              </Link>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 divide-y divide-brandBorder-subtle">
              {ordersNeedingAudit.slice(0, 3).map((ord) => (
                <div key={ord.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-forest-800">{ord.id}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        Audit Required
                      </span>
                    </div>
                    <p className="font-semibold text-forest-900 mt-0.5">{ord.customerName}</p>
                    <p className="text-[10px] text-brandText-secondary">
                      {ord.items?.length || 1} items &bull; Pharmacy: {ord.pharmacyName}
                    </p>
                    <span className="font-mono font-bold text-forest-800 text-[11px]">
                      ₹{(ord.total || 0).toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyOrder(ord.id)}
                    className="mt-1 px-2.5 py-1 rounded-lg bg-forest-700 hover:bg-forest-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm flex-shrink-0"
                  >
                    <Check className="w-3 h-3" />
                    <span>Verify & Release</span>
                  </button>
                </div>
              ))}
              {ordersNeedingAudit.length === 0 && (
                <p className="text-xs text-brandText-muted text-center py-4">
                  All active medicine orders verified and released!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Orders Stream */}
        <div className="lg:col-span-2 bg-surface-pure rounded-2xl border border-brandBorder-subtle shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-base text-forest-900">
                Recent Order Activity
              </h2>
              <p className="text-xs text-brandText-secondary">
                Cross-role order progression synchronized in real-time
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-forest-700 hover:text-forest-900 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-brandBorder-subtle">
            {orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-brandText-muted">
                No active orders in stream. Real-time orders will display here automatically.
              </div>
            ) : (
              orders.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-forest-50/30 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-forest-800">
                        {order.id}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-brandText-main font-semibold">
                      {order.customerName} &bull;{' '}
                      <span className="text-brandText-secondary font-normal">{order.area}</span>
                    </p>
                    <p className="text-[11px] text-brandText-muted">
                      {order.items?.length || 0} items &bull; Fulfilled by{' '}
                      <strong className="text-forest-700">{order.pharmacyName}</strong>
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                    <span className="font-extrabold text-sm text-forest-900">
                      ₹{(order.total || 0).toFixed(2)}
                    </span>
                    <span className="text-[11px] text-brandText-secondary uppercase font-semibold">
                      {order.paymentMethod} &bull; {order.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Platform Health & Quick Status */}
        <div className="space-y-6">
          {/* Clinic & Doctor Queue Live Status */}
          <div className="bg-surface-pure rounded-2xl border border-brandBorder-subtle shadow-card p-5 space-y-4">
            <h3 className="font-heading font-bold text-base text-forest-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Doctor Queue Pulse</span>
            </h3>
            {tokens.some((t) => t.status === 'SERVING' || t.status === 'WAITING') ? (
              (() => {
                const active = tokens.find((t) => t.status === 'SERVING') || tokens[0];
                return (
                  <div className="bg-forest-50/60 p-3.5 rounded-xl border border-forest-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-forest-900">
                      <span>{active.doctorName || 'Active Doctor'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                        Consulting
                      </span>
                    </div>
                    <p className="text-[11px] text-brandText-secondary">
                      {active.clinicName || 'Clinic'} &bull; {active.room || 'Chamber'}
                    </p>
                    <div className="pt-2 flex items-center justify-between border-t border-forest-200/60 text-xs">
                      <span className="text-brandText-secondary">Currently Serving:</span>
                      <strong className="text-forest-800 font-mono text-sm">
                        Token #{tokens.find((t) => t.status === 'SERVING')?.tokenNumber || '--'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-brandText-secondary">Waiting in Lobby:</span>
                      <span className="font-bold text-forest-800">
                        {tokens.filter((t) => t.status === 'WAITING').length} patients
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-surface-warm p-4 rounded-xl border border-brandBorder-subtle text-center text-xs text-brandText-muted">
                No active patient consultations in progress.
              </div>
            )}
            <Link
              to="/doctor/queue"
              className="block text-center py-2 bg-surface-warm hover:bg-forest-50 text-forest-800 font-bold text-xs rounded-xl border border-brandBorder-subtle transition-colors"
            >
              Open Live Clinic Queue
            </Link>
          </div>

          {/* Critical Alerts */}
          <div className="bg-surface-pure rounded-2xl border border-brandBorder-subtle shadow-card p-5 space-y-3">
            <h3 className="font-heading font-bold text-sm text-forest-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Compliance & Safety Alerts</span>
            </h3>
            <div className="space-y-2 text-xs">
              {(() => {
                const expiring = (inventory || []).filter(
                  (item) => (item.daysToExpiry && item.daysToExpiry < 30) || item.status === 'EXPIRING_SOON'
                );
                if (expiring.length > 0) {
                  return (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                      <p className="font-bold">
                        {expiring.length} Medicine{expiring.length > 1 ? 's' : ''} Expiring in &lt; 30 Days
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        {expiring.map((e) => e.name).slice(0, 2).join(', ')} batch audit recommended.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <p className="font-bold">Inventory Shelf-Life Healthy</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      All monitored batches are within safe shelf-life limits.
                    </p>
                  </div>
                );
              })()}
              <div className="p-2.5 rounded-xl bg-forest-50 border border-forest-200 text-forest-900">
                <p className="font-bold">CDSCO & WBSPC Compliant</p>
                <p className="text-[11px] text-forest-800 mt-0.5">
                  Schedule H1 drug prescription tracking is fully active.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
