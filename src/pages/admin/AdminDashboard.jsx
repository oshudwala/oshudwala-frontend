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
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import adminApi from '../../services/api/admin.api';

export const AdminDashboard = () => {
  const { orders, tokens, prescriptions, inventory, riders } = useWorkspaceStore();
  const [entityCounts, setEntityCounts] = useState({
    clinics: 6,
    doctors: 12,
    pharmacies: 8,
    riders: 15,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [c, d, p, r] = await Promise.all([
          adminApi.getClinics(),
          adminApi.getDoctors(),
          adminApi.getPharmacies(),
          adminApi.getRiders(),
        ]);
        setEntityCounts({
          clinics: c.total || c.clinics?.length || 6,
          doctors: d.total || d.doctors?.length || 12,
          pharmacies: p.total || p.pharmacies?.length || 8,
          riders: r.total || r.riders?.length || 15,
        });
      } catch (err) {
        console.warn('Could not fetch real entity counts:', err);
      }
    };
    fetchCounts();
  }, []);

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingOrders = orders.filter((o) => ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status));
  const activeRiders = riders.filter((r) => r.isOnline);
  const pendingRx = prescriptions.filter((p) => p.status === 'PENDING_VERIFICATION');

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900 tracking-tight">
            Super Admin Control Center
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Real-time platform oversight across Kolkata & West Bengal healthcare network.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/orders"
            className="px-4 py-2 bg-forest-700 hover:bg-forest-600 text-white text-xs font-bold rounded-xl shadow-card transition-all flex items-center gap-2"
          >
            <span>Live Dispatch Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Platform Gross Volume"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          change="+18.4%"
          trend="up"
          caption="vs last week"
          icon={DollarSign}
          colorScheme="forest"
        />
        <MetricCard
          title="Orders In Pipeline"
          value={pendingOrders.length}
          change="+5 orders"
          trend="up"
          caption="awaiting completion"
          icon={ShoppingBag}
          colorScheme="blue"
        />
        <MetricCard
          title="Active Riders Online"
          value={`${activeRiders.length} / ${riders.length}`}
          change="85% on-time"
          trend="up"
          caption="Kolkata South & Salt Lake"
          icon={Bike}
          colorScheme="amber"
        />
        <MetricCard
          title="Rx Pending Audit"
          value={pendingRx.length}
          change="Action required"
          trend="down"
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
            {orders.slice(0, 4).map((order) => (
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
                    {order.items.length} items &bull; Fulfilled by{' '}
                    <strong className="text-forest-700">{order.pharmacyName}</strong>
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                  <span className="font-extrabold text-sm text-forest-900">
                    ₹{order.total.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-brandText-secondary uppercase font-semibold">
                    {order.paymentMethod} &bull; {order.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
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
            <div className="bg-forest-50/60 p-3.5 rounded-xl border border-forest-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-forest-900">
                <span>Dr. Priya Sharma</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                  Online Consulting
                </span>
              </div>
              <p className="text-[11px] text-brandText-secondary">
                Apollo Clinic, Salt Lake Kolkata &bull; Room 204
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
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <p className="font-bold">2 Medicines Expiring in &lt; 30 Days</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Azithral 500 & Pan 40 batch audit recommended at MedPlus Sector V.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <p className="font-bold">CDSCO & WBSPC Compliant</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
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
