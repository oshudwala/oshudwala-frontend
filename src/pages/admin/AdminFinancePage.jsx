import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Bike,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  Building2,
  Search,
  Filter,
  Package,
  Receipt,
  ArrowRight,
  Plus,
  Coins,
  ShieldCheck,
  MapPin,
  Phone,
  Layers,
  Sparkles,
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { riderApi } from '../../services/api/rider.api';
import adminApi from '../../services/api/admin.api';
import accountRegistry from '../../services/api/accountRegistry';
import { calculateOrderBill } from '../../services/pricingRules';

export const AdminFinancePage = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Main Tab: 'settlements' | 'cash-workflow'
  const initialMainTab = searchParams.get('tab') === 'cash-workflow' ? 'cash-workflow' : 'settlements';
  const [mainTab, setMainTab] = useState(initialMainTab);

  // Sync mainTab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'cash-workflow') {
      setMainTab('cash-workflow');
    } else {
      setMainTab('settlements');
    }
  }, [searchParams]);

  const handleMainTabChange = (tab) => {
    setMainTab(tab);
    setSearchParams(tab === 'cash-workflow' ? { tab: 'cash-workflow' } : {});
  };

  // Sub-tab inside Cash Workflow: 'riders' | 'pharmacies'
  const [cashWorkflowSubTab, setCashWorkflowSubTab] = useState('riders');

  // Real-time workspace orders & rider data
  const { orders, riders: storeRiders, reconcileCash } = useWorkspaceStore();

  // Network entities (Riders & Pharmacies)
  const [pharmacies, setPharmacies] = useState(() => accountRegistry.getEntities().pharmacies || []);
  const [platformRiders, setPlatformRiders] = useState(() => accountRegistry.getEntities().riders || []);
  const [isLoadingEntities, setIsLoadingEntities] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadEntities = async () => {
      try {
        const res = await adminApi.fetchAllEntities();
        if (!isMounted) return;
        if (res.pharmacies?.length) setPharmacies(res.pharmacies);
        if (res.riders?.length) setPlatformRiders(res.riders);
      } catch (err) {
        console.warn('Failed to load network entities for finance:', err);
      } finally {
        if (isMounted) {
          setIsLoadingEntities(false);
        }
      }
    };
    loadEntities();
    return () => {
      isMounted = false;
    };
  }, []);

  // ==============================================================
  // CASH WORKFLOW STATE (Rider & Pharmacy Selection)
  // ==============================================================
  const [activeRiderId, setActiveRiderId] = useState(null);
  const [riderSearchQuery, setRiderSearchQuery] = useState('');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositRefNote, setDepositRefNote] = useState('');

  const [activePharmacyId, setActivePharmacyId] = useState(null);
  const [pharmacySearchQuery, setPharmacySearchQuery] = useState('');

  // Default selection to first available item
  useEffect(() => {
    if (!activeRiderId && platformRiders.length > 0) {
      setActiveRiderId(platformRiders[0].id || platformRiders[0].userId);
    }
  }, [platformRiders, activeRiderId]);

  useEffect(() => {
    if (!activePharmacyId && pharmacies.length > 0) {
      setActivePharmacyId(pharmacies[0].id);
    }
  }, [pharmacies, activePharmacyId]);

  // Selected Rider in Cash Workflow
  const selectedRiderObj =
    platformRiders.find((r) => r.id === activeRiderId || r.userId === activeRiderId) ||
    platformRiders[0];

  // Rider Orders
  const riderOrders = selectedRiderObj
    ? orders.filter(
        (o) =>
          o.assignedRider?.id === selectedRiderObj.id ||
          o.assignedRider?.userId === selectedRiderObj.userId ||
          (selectedRiderObj.phone && o.assignedRider?.phone === selectedRiderObj.phone) ||
          (selectedRiderObj.fullName && o.assignedRider?.name === selectedRiderObj.fullName)
      )
    : [];

  const completedRiderOrders = riderOrders.filter((o) => o.status === 'DELIVERED');
  const todayDateStr = new Date().toDateString();

  // Per day COD cash collected today
  const todayCodOrders = completedRiderOrders.filter(
    (o) =>
      o.paymentMethod === 'COD' &&
      new Date(o.createdAt || Date.now()).toDateString() === todayDateStr
  );
  const todayCodCollected = todayCodOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // All-time COD cash collected by rider
  const totalCodCollected = completedRiderOrders
    .filter((o) => o.paymentMethod === 'COD')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Cash received / deposited from rider
  const riderFinance = selectedRiderObj
    ? riderApi.getFinanceOverview(selectedRiderObj.id || selectedRiderObj.userId)
    : { cashDeposited: 0, cashInHand: 0 };
  const cashReceivedFromRider = riderFinance.cashDeposited || selectedRiderObj?.cashRemittedToday || 0;
  const pendingCashInHand = Math.max(0, totalCodCollected - cashReceivedFromRider);

  // Handle Recording Cash Received from Rider
  const handleRecordDeposit = (e) => {
    e.preventDefault();
    if (!selectedRiderObj) return;
    const num = Number(depositAmount);
    if (!num || num <= 0) {
      addToast('Please enter a valid deposit amount greater than ₹0.', 'error');
      return;
    }
    const targetId = selectedRiderObj.id || selectedRiderObj.userId;
    const ref = depositRefNote.trim() || `DEP-${Math.floor(100000 + Math.random() * 900000)}`;

    riderApi.recordCashDeposit(targetId, num, ref);
    reconcileCash(targetId, num);

    addToast(
      `Recorded cash deposit of ₹${num.toLocaleString('en-IN')} from ${selectedRiderObj.fullName || selectedRiderObj.name}! (Ref: ${ref})`,
      'success'
    );
    setIsDepositModalOpen(false);
    setDepositAmount('');
    setDepositRefNote('');
  };

  // Selected Pharmacy in Cash Workflow
  const selectedPharmacyObj =
    pharmacies.find((p) => p.id === activePharmacyId) || pharmacies[0];

  // Pharmacy Orders
  const pharmacyOrders = selectedPharmacyObj
    ? orders.filter(
        (o) =>
          o.pharmacyId === selectedPharmacyObj.id ||
          (selectedPharmacyObj.name && o.pharmacyName?.toLowerCase() === selectedPharmacyObj.name?.toLowerCase()) ||
          (selectedPharmacyObj.email && o.pharmacyEmail?.toLowerCase() === selectedPharmacyObj.email?.toLowerCase())
      )
    : [];

  // Per day sales (Today's GMV)
  const todayPharmacyOrders = pharmacyOrders.filter(
    (o) =>
      o.status !== 'CANCELLED' &&
      new Date(o.createdAt || Date.now()).toDateString() === todayDateStr
  );
  const perDaySales = todayPharmacyOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Total amount of sales (All-time GMV)
  const totalSalesAmount = pharmacyOrders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Extra charges calculation
  let totalDeliveryCharges = 0;
  let totalPackagingCharges = 0;
  let totalPlatformCharges = 0;

  pharmacyOrders.forEach((o) => {
    const bill = calculateOrderBill({
      items: o.items || [],
      customSubtotal: o.subtotal || o.total,
      deliveryFee: o.deliveryFee,
    });
    totalPackagingCharges += o.packagingFee !== undefined ? o.packagingFee : bill.packagingFee;
    totalPlatformCharges += o.platformFee !== undefined ? o.platformFee : bill.platformFee;
    totalDeliveryCharges += o.deliveryFee !== undefined ? o.deliveryFee : bill.deliveryFee;
  });

  const totalExtraCharges = totalDeliveryCharges + totalPackagingCharges + totalPlatformCharges;

  // ==============================================================
  // SETTLEMENTS & WALLET TAB STATE
  // ==============================================================
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [selectedRider, setSelectedRider] = useState(null);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disburseNote, setDisburseNote] = useState('');

  const monthlyMetrics = {
    '2026-11': {
      monthLabel: 'November 2026',
      totalOrders: 1482,
      lastMonthOrders: 1251,
      orderGrowth: 18.47,
      totalAmountReceived: 684250.0,
      lastMonthAmountReceived: 558100.0,
      revenueGrowth: 22.6,
      riderTotal: 88400.0,
      riderGiven: 64200.0,
      riderDue: 24200.0,
    },
    '2026-10': {
      monthLabel: 'October 2026',
      totalOrders: 1251,
      lastMonthOrders: 1110,
      orderGrowth: 12.7,
      totalAmountReceived: 558100.0,
      lastMonthAmountReceived: 504000.0,
      revenueGrowth: 10.73,
      riderTotal: 74200.0,
      riderGiven: 74200.0,
      riderDue: 0.0,
    },
    '2026-09': {
      monthLabel: 'September 2026',
      totalOrders: 1110,
      lastMonthOrders: 1040,
      orderGrowth: 6.73,
      totalAmountReceived: 504000.0,
      lastMonthAmountReceived: 480000.0,
      revenueGrowth: 5.0,
      riderTotal: 66000.0,
      riderGiven: 66000.0,
      riderDue: 0.0,
    },
  };

  const currentMetrics = monthlyMetrics[selectedMonth] || monthlyMetrics['2026-11'];

  const [ridersPayments, setRidersPayments] = useState([
    {
      id: 'rider-01',
      name: 'Rahul Das',
      phone: '+91 98765 00001',
      vehicle: 'Hero Splendor (WB-02-AK-9921)',
      area: 'Salt Lake & New Town',
      monthDeliveries: 164,
      totalEarning: 16400.0,
      givenAmount: 12000.0,
      dueAmount: 4400.0,
      status: 'PARTIALLY_PAID',
      upiId: 'rahul.das@okaxis',
      dailyBreakdown: [
        { date: '20 Nov 2026', deliveries: 12, codCollected: 5400, dailyEarning: 1200, status: 'DUE', ref: 'Pending' },
        { date: '19 Nov 2026', deliveries: 14, codCollected: 6200, dailyEarning: 1400, status: 'DUE', ref: 'Pending' },
        { date: '18 Nov 2026', deliveries: 10, codCollected: 4100, dailyEarning: 1000, status: 'DUE', ref: 'Pending' },
      ],
    },
    {
      id: 'rider-02',
      name: 'Sourav Mondal',
      phone: '+91 98765 00002',
      vehicle: 'Honda Activa (WB-04-EK-1120)',
      area: 'Gariahat & Ballygunge',
      monthDeliveries: 182,
      totalEarning: 18200.0,
      givenAmount: 18200.0,
      dueAmount: 0.0,
      status: 'SETTLED',
      upiId: 'sourav.mondal@paytm',
      dailyBreakdown: [
        { date: '20 Nov 2026', deliveries: 15, codCollected: 7200, dailyEarning: 1500, status: 'PAID', ref: 'UPI/63891048' },
        { date: '19 Nov 2026', deliveries: 16, codCollected: 7500, dailyEarning: 1600, status: 'PAID', ref: 'UPI/63811294' },
      ],
    },
  ]);

  const handleDisbursePayment = (e) => {
    e.preventDefault();
    if (!selectedRider) return;

    const amount = Number(disburseAmount) || selectedRider.dueAmount;
    if (amount <= 0 || amount > selectedRider.dueAmount) {
      addToast('Please enter an amount between ₹1 and current due balance.', 'error');
      return;
    }

    const refNo = `NEFT-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      riderApi.recordSuperAdminPayout(selectedRider.id, amount, refNo);
    } catch (err) {
      console.warn('Error recording superadmin payout in riderApi:', err);
    }

    const updatedRiders = ridersPayments.map((r) => {
      if (r.id === selectedRider.id) {
        const nextDue = Math.max(0, r.dueAmount - amount);
        const nextGiven = r.givenAmount + amount;
        const nextStatus = nextDue === 0 ? 'SETTLED' : 'PARTIALLY_PAID';

        const updatedDaily = r.dailyBreakdown.map((d) => ({
          ...d,
          status: 'PAID',
          ref: d.ref === 'Pending' ? refNo : d.ref,
        }));

        const updatedRider = {
          ...r,
          dueAmount: nextDue,
          givenAmount: nextGiven,
          status: nextStatus,
          dailyBreakdown: updatedDaily,
        };

        setSelectedRider(updatedRider);
        return updatedRider;
      }
      return r;
    });

    setRidersPayments(updatedRiders);
    setIsDisbursing(false);
    setDisburseAmount('');
    addToast(
      `Disbursed ₹${amount.toLocaleString('en-IN')} to ${selectedRider.name} successfully! (Ref: ${refNo})`,
      'success'
    );
  };

  const riderColumns = [
    {
      header: 'Rider Profile',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-secondary font-mono">{row.phone}</p>
          <p className="text-[10px] text-brandText-muted">{row.vehicle}</p>
        </div>
      ),
    },
    {
      header: 'Operating Zone',
      key: 'area',
      render: (row) => <span className="text-xs text-forest-800 font-medium">{row.area}</span>,
    },
    {
      header: 'Month Deliveries',
      key: 'monthDeliveries',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-xs text-forest-900 font-mono">
          {row.monthDeliveries} orders
        </span>
      ),
    },
    {
      header: 'Total Earnings',
      key: 'totalEarning',
      align: 'right',
      render: (row) => (
        <span className="font-extrabold text-xs text-forest-900 font-mono">
          ₹{row.totalEarning.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Paid (Given)',
      key: 'givenAmount',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-xs text-emerald-700 font-mono">
          ₹{row.givenAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Due Balance',
      key: 'dueAmount',
      align: 'right',
      render: (row) => (
        <span
          className={`font-extrabold text-xs font-mono ${
            row.dueAmount > 0 ? 'text-amber-700' : 'text-brandText-muted'
          }`}
        >
          ₹{row.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Daily Details',
      key: 'action',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedRider(row);
            setDisburseAmount(row.dueAmount.toString());
          }}
          rightIcon={ChevronRight}
          className="text-xs py-1 px-3 shadow-xs font-semibold"
        >
          View Daily
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title & Main Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900 tracking-tight">
            Finance & Cash Operations
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Reconcile live COD cash collections, pharmacy store sales, extra charges, and rider disbursement ledgers.
          </p>
        </div>

        {/* Top-Level Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-pure rounded-2xl border border-brandBorder-subtle shadow-xs">
          <button
            type="button"
            onClick={() => handleMainTabChange('settlements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mainTab === 'settlements'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Settlements & Wallet</span>
          </button>

          <button
            type="button"
            onClick={() => handleMainTabChange('cash-workflow')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              mainTab === 'cash-workflow'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Cash Workflow</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW A: CASH WORKFLOW (PHARMACY & RIDER SUB-TABS)             */}
      {/* ============================================================== */}
      {mainTab === 'cash-workflow' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub-tab Switcher: Rider vs Pharmacy */}
          <div className="flex items-center gap-2 border-b border-brandBorder-subtle pb-3">
            <button
              type="button"
              onClick={() => setCashWorkflowSubTab('riders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                cashWorkflowSubTab === 'riders'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'bg-surface-pure border border-brandBorder-subtle text-brandText-secondary hover:bg-forest-50'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Rider Cash Workflow {isLoadingEntities ? '(...)' : `(${platformRiders.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setCashWorkflowSubTab('pharmacies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                cashWorkflowSubTab === 'pharmacies'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'bg-surface-pure border border-brandBorder-subtle text-brandText-secondary hover:bg-forest-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Pharmacy Cash Workflow {isLoadingEntities ? '(...)' : `(${pharmacies.length})`}</span>
            </button>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* 1. RIDER CASH WORKFLOW                                       */}
          {/* ------------------------------------------------------------ */}
          {cashWorkflowSubTab === 'riders' && (
            isLoadingEntities ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
                {/* Left Column Skeleton */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="bg-surface-pure rounded-3xl p-4 border border-brandBorder-subtle shadow-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-28 bg-forest-100 rounded-md" />
                      <div className="h-3 w-16 bg-forest-50 rounded" />
                    </div>
                    <div className="h-8 bg-surface-warm rounded-xl border border-brandBorder-subtle" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-3 rounded-2xl border border-brandBorder-subtle space-y-2 bg-surface-pure">
                          <div className="flex items-center justify-between">
                            <div className="h-3.5 w-24 bg-forest-100 rounded" />
                            <div className="h-4 w-14 bg-forest-100/70 rounded-full" />
                          </div>
                          <div className="h-2.5 w-20 bg-forest-50 rounded" />
                          <div className="pt-2 border-t border-brandBorder-light flex items-center justify-between">
                            <div className="h-2.5 w-12 bg-forest-50 rounded" />
                            <div className="h-3 w-16 bg-forest-100 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="lg:col-span-8 space-y-5">
                  {/* Banner Skeleton */}
                  <div className="bg-surface-pure p-5 rounded-3xl border border-brandBorder-subtle shadow-card flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-forest-100/80 flex-shrink-0" />
                      <div className="space-y-2">
                        <div className="h-4 w-36 bg-forest-100 rounded" />
                        <div className="h-3 w-48 bg-forest-50 rounded" />
                      </div>
                    </div>
                    <div className="h-8 w-32 bg-forest-100 rounded-xl" />
                  </div>

                  {/* 4 Metric Cards Skeleton */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs space-y-2">
                        <div className="h-2.5 w-20 bg-forest-50 rounded" />
                        <div className="h-5 w-24 bg-forest-100 rounded" />
                        <div className="h-2 w-16 bg-forest-50 rounded" />
                      </div>
                    ))}
                  </div>

                  {/* Pending Cash Banner Skeleton */}
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
                    <div className="h-4 w-52 bg-amber-100 rounded" />
                    <div className="h-5 w-20 bg-amber-200/80 rounded" />
                  </div>

                  {/* Orders Table Skeleton */}
                  <div className="bg-surface-pure rounded-3xl p-5 border border-brandBorder-subtle shadow-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-40 bg-forest-100 rounded" />
                      <div className="h-3 w-28 bg-forest-50 rounded" />
                    </div>
                    <div className="space-y-2 pt-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 bg-surface-warm/70 rounded-xl flex items-center justify-between px-3">
                          <div className="h-3 w-16 bg-forest-100 rounded" />
                          <div className="h-3 w-24 bg-forest-100 rounded" />
                          <div className="h-3 w-12 bg-forest-50 rounded" />
                          <div className="h-3 w-16 bg-forest-100 rounded" />
                          <div className="h-3 w-14 bg-forest-100/70 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (4 cols): Rider Selector List */}
              <div className="lg:col-span-4 space-y-3">
                <div className="bg-surface-pure rounded-3xl p-4 border border-brandBorder-subtle shadow-card space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-forest-900 flex items-center gap-1.5">
                      <Bike className="w-4 h-4 text-forest-700" />
                      <span>Riders Fleet ({platformRiders.length})</span>
                    </h3>
                    <span className="text-[10px] text-brandText-muted">Select rider</span>
                  </div>

                  {/* Rider Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brandText-muted" />
                    <input
                      type="text"
                      value={riderSearchQuery}
                      onChange={(e) => setRiderSearchQuery(e.target.value)}
                      placeholder="Search rider by name, phone..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                  </div>

                  {/* Riders List */}
                  <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                    {platformRiders
                      .filter((r) => {
                        const q = riderSearchQuery.toLowerCase();
                        return (
                          (r.fullName || r.name || '').toLowerCase().includes(q) ||
                          (r.phone || '').includes(q) ||
                          (r.vehicleType || '').toLowerCase().includes(q)
                        );
                      })
                      .map((r) => {
                        const rId = r.id || r.userId;
                        const isSelected = activeRiderId === rId;
                        const rOrders = orders.filter(
                          (o) =>
                            o.assignedRider?.id === r.id ||
                            o.assignedRider?.userId === r.userId ||
                            (r.phone && o.assignedRider?.phone === r.phone)
                        );
                        const rCodOrders = rOrders.filter((o) => o.paymentMethod === 'COD' && o.status === 'DELIVERED');
                        const rCod = rCodOrders.reduce((sum, o) => sum + (o.total || 0), 0);

                        return (
                          <div
                            key={rId}
                            onClick={() => setActiveRiderId(rId)}
                            className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                              isSelected
                                ? 'bg-forest-50/90 border-forest-400 shadow-sm'
                                : 'bg-surface-pure hover:bg-forest-50/40 border-brandBorder-subtle'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-xs text-forest-900">{r.fullName || r.name || 'Rider'}</p>
                              <StatusBadge status={r.status || 'AVAILABLE'} />
                            </div>
                            <p className="text-[11px] text-brandText-secondary font-mono mt-0.5">{r.phone || 'No phone'}</p>
                            <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-brandBorder-light">
                              <span className="text-brandText-muted">{rOrders.length} orders</span>
                              <span className="font-mono font-bold text-forest-800">COD: ₹{rCod.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                    {platformRiders.length === 0 && (
                      <p className="text-xs text-brandText-muted text-center py-6">No riders registered in network.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (8 cols): Rider Detail Cash Dashboard & Orders List */}
              <div className="lg:col-span-8 space-y-5">
                {selectedRiderObj ? (
                  <>
                    {/* Rider Banner Header */}
                    <div className="bg-surface-pure p-5 rounded-3xl border border-brandBorder-subtle shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700 flex-shrink-0">
                          {selectedRiderObj.imageUrl ? (
                            <img
                              src={selectedRiderObj.imageUrl}
                              alt="Rider"
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            <Bike className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base sm:text-lg font-heading font-extrabold text-forest-900">
                              {selectedRiderObj.fullName || selectedRiderObj.name}
                            </h2>
                            <StatusBadge status={selectedRiderObj.status || 'AVAILABLE'} />
                          </div>
                          <p className="text-xs text-brandText-secondary mt-0.5">
                            {selectedRiderObj.phone} &bull; {selectedRiderObj.vehicleNumber || 'WB-01-Verified'} &bull;{' '}
                            {selectedRiderObj.vehicleType || 'Motorcycle'}
                          </p>
                        </div>
                      </div>

                      {/* Deposit Cash Button */}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setDepositAmount(pendingCashInHand > 0 ? String(pendingCashInHand) : '');
                          setIsDepositModalOpen(true);
                        }}
                        leftIcon={Coins}
                        className="text-xs font-bold shadow-card px-4"
                      >
                        Record Cash Deposit
                      </Button>
                    </div>

                    {/* Dashboard Metrics (Requirement: COD collect per day, total number of orders, orders completed, cash received) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Metric 1: Today's COD Cash */}
                      <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                        <span className="text-[10px] font-bold text-brandText-secondary uppercase tracking-wider block">
                          Today's COD Cash
                        </span>
                        <p className="text-lg font-heading font-extrabold text-forest-900 mt-1 font-mono">
                          ₹{todayCodCollected.toFixed(2)}
                        </p>
                        <span className="text-[10px] text-brandText-muted">Collected per day</span>
                      </div>

                      {/* Metric 2: Total Orders */}
                      <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                        <span className="text-[10px] font-bold text-brandText-secondary uppercase tracking-wider block">
                          Total Orders
                        </span>
                        <p className="text-lg font-heading font-extrabold text-forest-900 mt-1 font-mono">
                          {riderOrders.length}
                        </p>
                        <span className="text-[10px] text-brandText-muted">Assigned to rider</span>
                      </div>

                      {/* Metric 3: Orders Completed */}
                      <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                          Orders Completed
                        </span>
                        <p className="text-lg font-heading font-extrabold text-emerald-700 mt-1 font-mono">
                          {completedRiderOrders.length}
                        </p>
                        <span className="text-[10px] text-emerald-600 font-semibold">Delivered successfully</span>
                      </div>

                      {/* Metric 4: Cash Received from Rider */}
                      <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                        <span className="text-[10px] font-bold text-brandText-secondary uppercase tracking-wider block">
                          Cash Received
                        </span>
                        <p className="text-lg font-heading font-extrabold text-forest-900 mt-1 font-mono">
                          ₹{cashReceivedFromRider.toFixed(2)}
                        </p>
                        <span className="text-[10px] text-brandText-muted">Deposited / Remitted</span>
                      </div>
                    </div>

                    {/* Pending Cash In Hand Alert Banner */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-amber-900">
                            Current Pending Cash in Hand: ₹{pendingCashInHand.toFixed(2)}
                          </span>
                          <p className="text-[11px] text-amber-800">
                            Total COD Collected (₹{totalCodCollected.toFixed(2)}) minus Cash Received (₹{cashReceivedFromRider.toFixed(2)}).
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-extrabold text-sm text-amber-900">
                        ₹{pendingCashInHand.toFixed(2)}
                      </span>
                    </div>

                    {/* Orders List Below for this Rider (Requirement: list below of all the orders of them) */}
                    <div className="bg-surface-pure rounded-3xl p-5 border border-brandBorder-subtle shadow-card space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-bold text-sm text-forest-900">
                          Assigned Orders Ledger ({riderOrders.length})
                        </h3>
                        <span className="text-xs text-brandText-muted">Live dispatch synchronization</span>
                      </div>

                      <div className="border border-brandBorder-subtle rounded-2xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-surface-warm text-brandText-secondary font-semibold border-b border-brandBorder-subtle">
                            <tr>
                              <th className="py-2.5 px-3">Order ID</th>
                              <th className="py-2.5 px-3">Customer & Area</th>
                              <th className="py-2.5 px-3">Payment</th>
                              <th className="py-2.5 px-3 text-right">COD Collected</th>
                              <th className="py-2.5 px-3 text-right">Order Amount</th>
                              <th className="py-2.5 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brandBorder-light bg-surface-pure">
                            {riderOrders.map((ord) => (
                              <tr key={ord.id} className="hover:bg-forest-50/40 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-bold text-forest-800">{ord.id}</td>
                                <td className="py-2.5 px-3">
                                  <p className="font-bold text-forest-900">{ord.customerName}</p>
                                  <p className="text-[10px] text-brandText-muted">{ord.area || ord.address || 'Kolkata'}</p>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      ord.paymentMethod === 'COD'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {ord.paymentMethod || 'COD'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-forest-900">
                                  {ord.paymentMethod === 'COD' && ord.status === 'DELIVERED'
                                    ? `₹${(ord.total || 0).toFixed(2)}`
                                    : '₹0.00'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-forest-900">
                                  ₹{(ord.total || 0).toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <StatusBadge status={ord.status} />
                                </td>
                              </tr>
                            ))}
                            {riderOrders.length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-xs text-brandText-muted">
                                  No orders assigned to this rider yet. Live dispatches will appear here.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-surface-pure rounded-3xl p-12 text-center border border-brandBorder-subtle">
                    <Bike className="w-10 h-10 text-brandText-muted mx-auto mb-2" />
                    <p className="text-xs text-brandText-secondary font-semibold">Select a rider to view their cash dashboard</p>
                  </div>
                )}
              </div>
            </div>
            )
          )}

          {/* ------------------------------------------------------------ */}
          {/* 2. PHARMACY CASH WORKFLOW                                    */}
          {/* ------------------------------------------------------------ */}
          {cashWorkflowSubTab === 'pharmacies' && (
            isLoadingEntities ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
                {/* Left Column Skeleton */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="bg-surface-pure rounded-3xl p-4 border border-brandBorder-subtle shadow-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-28 bg-forest-100 rounded-md" />
                      <div className="h-3 w-16 bg-forest-50 rounded" />
                    </div>
                    <div className="h-8 bg-surface-warm rounded-xl border border-brandBorder-subtle" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-3 rounded-2xl border border-brandBorder-subtle space-y-2 bg-surface-pure">
                          <div className="flex items-center justify-between">
                            <div className="h-3.5 w-28 bg-forest-100 rounded" />
                            <div className="h-4 w-14 bg-forest-100/70 rounded-full" />
                          </div>
                          <div className="h-2.5 w-24 bg-forest-50 rounded" />
                          <div className="pt-2 border-t border-brandBorder-light flex items-center justify-between">
                            <div className="h-2.5 w-12 bg-forest-50 rounded" />
                            <div className="h-3 w-20 bg-forest-100 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="lg:col-span-8 space-y-5">
                  {/* Pharmacy Banner Skeleton */}
                  <div className="bg-surface-pure p-5 rounded-3xl border border-brandBorder-subtle shadow-card flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-forest-100/80 flex-shrink-0" />
                      <div className="space-y-2">
                        <div className="h-4 w-40 bg-forest-100 rounded" />
                        <div className="h-3 w-52 bg-forest-50 rounded" />
                      </div>
                    </div>
                    <div className="h-7 w-28 bg-forest-100 rounded-xl" />
                  </div>

                  {/* 3 Metric Cards Skeleton */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs space-y-2">
                        <div className="h-2.5 w-24 bg-forest-50 rounded" />
                        <div className="h-6 w-28 bg-forest-100 rounded" />
                        <div className="h-2 w-20 bg-forest-50 rounded" />
                      </div>
                    ))}
                  </div>

                  {/* Extra Charges Breakdown Skeleton */}
                  <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs space-y-3">
                    <div className="h-3 w-36 bg-forest-100 rounded" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 bg-surface-warm rounded-xl space-y-1.5">
                          <div className="h-2.5 w-16 bg-forest-50 rounded" />
                          <div className="h-4 w-20 bg-forest-100 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Orders Table Skeleton */}
                  <div className="bg-surface-pure rounded-3xl p-5 border border-brandBorder-subtle shadow-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-40 bg-forest-100 rounded" />
                      <div className="h-3 w-28 bg-forest-50 rounded" />
                    </div>
                    <div className="space-y-2 pt-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 bg-surface-warm/70 rounded-xl flex items-center justify-between px-3">
                          <div className="h-3 w-16 bg-forest-100 rounded" />
                          <div className="h-3 w-20 bg-forest-100 rounded" />
                          <div className="h-3 w-12 bg-forest-50 rounded" />
                          <div className="h-3 w-16 bg-forest-100 rounded" />
                          <div className="h-3 w-14 bg-forest-100/70 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (4 cols): Pharmacy Selector List */}
              <div className="lg:col-span-4 space-y-3">
                <div className="bg-surface-pure rounded-3xl p-4 border border-brandBorder-subtle shadow-card space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-forest-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-forest-700" />
                      <span>Pharmacies ({pharmacies.length})</span>
                    </h3>
                    <span className="text-[10px] text-brandText-muted">Select store</span>
                  </div>

                  {/* Pharmacy Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brandText-muted" />
                    <input
                      type="text"
                      value={pharmacySearchQuery}
                      onChange={(e) => setPharmacySearchQuery(e.target.value)}
                      placeholder="Search pharmacy by name, city..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                  </div>

                  {/* Pharmacy List */}
                  <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                    {pharmacies
                      .filter((p) => {
                        const q = pharmacySearchQuery.toLowerCase();
                        return (
                          (p.name || '').toLowerCase().includes(q) ||
                          (p.city || '').toLowerCase().includes(q) ||
                          (p.licenseNumber || '').toLowerCase().includes(q)
                        );
                      })
                      .map((p) => {
                        const isSelected = activePharmacyId === p.id;
                        const pOrders = orders.filter(
                          (o) =>
                            o.pharmacyId === p.id ||
                            (p.name && o.pharmacyName?.toLowerCase() === p.name?.toLowerCase())
                        );
                        const pGmv = pOrders.reduce((sum, o) => sum + (o.total || 0), 0);

                        return (
                          <div
                            key={p.id}
                            onClick={() => setActivePharmacyId(p.id)}
                            className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                              isSelected
                                ? 'bg-forest-50/90 border-forest-400 shadow-sm'
                                : 'bg-surface-pure hover:bg-forest-50/40 border-brandBorder-subtle'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-xs text-forest-900">{p.name}</p>
                              <StatusBadge status={p.status || 'ACTIVE'} />
                            </div>
                            <p className="text-[11px] text-brandText-secondary mt-0.5">{p.city || 'Kolkata'} &bull; {p.phone || 'Store'}</p>
                            <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-brandBorder-light">
                              <span className="text-brandText-muted">{pOrders.length} orders</span>
                              <span className="font-mono font-bold text-forest-800">Sales: ₹{pGmv.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                    {pharmacies.length === 0 && (
                      <p className="text-xs text-brandText-muted text-center py-6">No pharmacies registered in network.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (8 cols): Pharmacy Sales & Extra Charges Dashboard */}
              <div className="lg:col-span-8 space-y-5">
                {selectedPharmacyObj ? (
                  <>
                    {/* Pharmacy Header Banner */}
                    <div className="bg-surface-pure p-5 rounded-3xl border border-brandBorder-subtle shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700 flex-shrink-0">
                          {selectedPharmacyObj.imageUrl ? (
                            <img
                              src={selectedPharmacyObj.imageUrl}
                              alt="Store"
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            <Building2 className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base sm:text-lg font-heading font-extrabold text-forest-900">
                              {selectedPharmacyObj.name}
                            </h2>
                            <StatusBadge status={selectedPharmacyObj.status || 'ACTIVE'} />
                          </div>
                          <p className="text-xs text-brandText-secondary mt-0.5">
                            {selectedPharmacyObj.line1 || 'Main Street'}, {selectedPharmacyObj.city || 'Kolkata'} &bull; Lic: {selectedPharmacyObj.licenseNumber || 'WB-DL-Reg'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-forest-50 text-forest-800 font-bold text-xs border border-forest-100">
                          {pharmacyOrders.length} Orders Fulfilled
                        </span>
                      </div>
                    </div>

                    {/* KPI Dashboard (Requirement: per day sales, total amount of sales, extra charges like delivery, packaging, platform fee) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Metric 1: Per Day Sales */}
                      <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                        <span className="text-[10px] font-bold text-brandText-secondary uppercase tracking-wider block">
                          Per Day Sales (Today)
                        </span>
                        <p className="text-xl font-heading font-extrabold text-forest-900 mt-1 font-mono">
                          ₹{perDaySales.toFixed(2)}
                        </p>
                        <span className="text-[10px] text-brandText-muted">
                          {todayPharmacyOrders.length} orders billed today
                        </span>
                      </div>

                      {/* Metric 2: Total Amount of Sales */}
                      <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                        <span className="text-[10px] font-bold text-brandText-secondary uppercase tracking-wider block">
                          Total Amount of Sales
                        </span>
                        <p className="text-xl font-heading font-extrabold text-forest-900 mt-1 font-mono">
                          ₹{totalSalesAmount.toFixed(2)}
                        </p>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          All-time fulfilled GMV
                        </span>
                      </div>

                      {/* Metric 3: Total Extra Charges */}
                      <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                        <span className="text-[10px] font-bold text-brandText-secondary uppercase tracking-wider block">
                          Total Extra Charges
                        </span>
                        <p className="text-xl font-heading font-extrabold text-forest-900 mt-1 font-mono">
                          ₹{totalExtraCharges.toFixed(2)}
                        </p>
                        <span className="text-[10px] text-brandText-muted">
                          Platform, packing & delivery
                        </span>
                      </div>
                    </div>

                    {/* Extra Charges Breakdown Detail Card */}
                    <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs space-y-2">
                      <h4 className="text-xs font-bold text-forest-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-forest-700" />
                        <span>Extra Charges Breakdown Summary</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-forest-50/60 border border-forest-100">
                          <span className="text-[10px] text-brandText-secondary block">Delivery Charges</span>
                          <p className="font-mono font-bold text-sm text-forest-900">₹{totalDeliveryCharges.toFixed(2)}</p>
                          <span className="text-[9px] text-brandText-muted">&lt; ₹499: ₹30 | &gt; ₹499: Free</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-forest-50/60 border border-forest-100">
                          <span className="text-[10px] text-brandText-secondary block">Packaging Fees</span>
                          <p className="font-mono font-bold text-sm text-forest-900">₹{totalPackagingCharges.toFixed(2)}</p>
                          <span className="text-[9px] text-brandText-muted">Fixed ₹6 per order</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-forest-50/60 border border-forest-100">
                          <span className="text-[10px] text-brandText-secondary block">Platform Fees</span>
                          <p className="font-mono font-bold text-sm text-forest-900">₹{totalPlatformCharges.toFixed(2)}</p>
                          <span className="text-[9px] text-brandText-muted">Tiered ₹9 - ₹30 per order</span>
                        </div>
                      </div>
                    </div>

                    {/* Orders List for this Pharmacy (Requirement: show the list of orders from that pharmacy) */}
                    <div className="bg-surface-pure rounded-3xl p-5 border border-brandBorder-subtle shadow-card space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-bold text-sm text-forest-900">
                          Pharmacy Orders Ledger ({pharmacyOrders.length})
                        </h3>
                        <span className="text-xs text-brandText-muted">Detailed billing & extra fees</span>
                      </div>

                      <div className="border border-brandBorder-subtle rounded-2xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-surface-warm text-brandText-secondary font-semibold border-b border-brandBorder-subtle">
                            <tr>
                              <th className="py-2.5 px-3">Order ID</th>
                              <th className="py-2.5 px-3">Customer</th>
                              <th className="py-2.5 px-3 text-right">Subtotal</th>
                              <th className="py-2.5 px-3 text-right">Extra Charges</th>
                              <th className="py-2.5 px-3 text-right">Total Bill</th>
                              <th className="py-2.5 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brandBorder-light bg-surface-pure">
                            {pharmacyOrders.map((ord) => {
                              const bill = calculateOrderBill({
                                items: ord.items || [],
                                customSubtotal: ord.subtotal || ord.total,
                                deliveryFee: ord.deliveryFee,
                              });
                              const pkg = ord.packagingFee !== undefined ? ord.packagingFee : bill.packagingFee;
                              const plt = ord.platformFee !== undefined ? ord.platformFee : bill.platformFee;
                              const del = ord.deliveryFee !== undefined ? ord.deliveryFee : bill.deliveryFee;

                              return (
                                <tr key={ord.id} className="hover:bg-forest-50/40 transition-colors">
                                  <td className="py-2.5 px-3 font-mono font-bold text-forest-800">{ord.id}</td>
                                  <td className="py-2.5 px-3">
                                    <p className="font-bold text-forest-900">{ord.customerName}</p>
                                    <p className="text-[10px] text-brandText-muted">
                                      {ord.items?.length || 1} items &bull; {ord.paymentMethod || 'COD'}
                                    </p>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-brandText-secondary">
                                    ₹{(ord.subtotal || bill.subtotal).toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono">
                                    <div className="text-[10px] text-brandText-muted">
                                      Pkg: ₹{pkg} | Plt: ₹{plt} | Del: {del > 0 ? `₹${del}` : 'FREE'}
                                    </div>
                                    <span className="font-bold text-forest-800">
                                      +₹{(pkg + plt + del).toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-extrabold text-forest-900">
                                    ₹{(ord.total || bill.finalTotal).toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <StatusBadge status={ord.status} />
                                  </td>
                                </tr>
                              );
                            })}
                            {pharmacyOrders.length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-xs text-brandText-muted">
                                  No orders dispatched to this pharmacy yet. Dispatched orders will appear here automatically.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-surface-pure rounded-3xl p-12 text-center border border-brandBorder-subtle">
                    <Building2 className="w-10 h-10 text-brandText-muted mx-auto mb-2" />
                    <p className="text-xs text-brandText-secondary font-semibold">Select a pharmacy to view its sales & extra charges</p>
                  </div>
                )}
              </div>
            </div>
            )
          )}

          {/* Deposit Modal for Rider Cash Collection */}
          {isDepositModalOpen && selectedRiderObj && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div
                className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
                onClick={() => setIsDepositModalOpen(false)}
              />
              <div className="min-h-full flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-surface-pure rounded-3xl p-6 shadow-floating border border-brandBorder-subtle text-left relative animate-scale-up space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-heading font-extrabold text-base text-forest-900">
                          Record Rider Cash Deposit
                        </h3>
                        <p className="text-[11px] text-brandText-secondary">
                          {selectedRiderObj.fullName || selectedRiderObj.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsDepositModalOpen(false)}
                      className="p-1.5 text-brandText-muted hover:text-forest-700 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleRecordDeposit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Cash Received Amount (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="e.g. 1500"
                        className="w-full px-3 py-2 text-sm font-bold font-mono text-forest-900 bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                      <p className="text-[10px] text-brandText-muted mt-0.5">
                        Current pending in hand: ₹{pendingCashInHand.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Deposit Reference / Receipt No.
                      </label>
                      <input
                        type="text"
                        value={depositRefNote}
                        onChange={(e) => setDepositRefNote(e.target.value)}
                        placeholder="e.g. CASH-REMIT-01 or Bank Slip"
                        className="w-full px-3 py-2 text-xs font-mono bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDepositModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        className="font-bold shadow-card px-4"
                      >
                        Confirm Receipt
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW B: SETTLEMENTS & WALLET (MONTHLY PLATFORM LEDGERS)        */}
      {/* ============================================================== */}
      {mainTab === 'settlements' && (
        <div className="space-y-6 animate-fade-in">
          {/* Month Selector Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-card">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-forest-700" />
              <span className="text-xs font-bold text-forest-800">Monthly Billing Cycle:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-bold text-forest-900 bg-surface-warm px-3 py-1.5 rounded-xl border border-brandBorder-subtle focus:outline-none focus:border-forest-500"
              >
                <option value="2026-11">November 2026 (Current Cycle)</option>
                <option value="2026-10">October 2026</option>
                <option value="2026-09">September 2026</option>
              </select>
            </div>

            <span className="text-xs font-bold text-forest-700 bg-forest-50 px-3 py-1 rounded-full border border-forest-100">
              Platform Gross Reconciliation
            </span>
          </div>

          {/* KPI Cards: Orders per month & Amounts received with last month relation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Total Orders per Month */}
            <div className="bg-surface-pure rounded-3xl p-5 sm:p-6 border border-brandBorder-subtle shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brandText-secondary uppercase tracking-wider">
                  Total Orders Per Month
                </span>
                <div className="w-9 h-9 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3">
                <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900">
                  {currentMetrics.totalOrders.toLocaleString('en-IN')}
                </h2>
                <p className="text-xs text-brandText-muted mt-0.5">
                  Across Kolkata, Durgapur & Hooghly corridors
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-brandBorder-subtle flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{currentMetrics.orderGrowth}%</span>
                </span>
                <span className="text-brandText-secondary text-[11px]">
                  vs {currentMetrics.lastMonthOrders.toLocaleString('en-IN')} last month
                </span>
              </div>
            </div>

            {/* Card 2: Total Amount Received in Month */}
            <div className="bg-surface-pure rounded-3xl p-5 sm:p-6 border border-brandBorder-subtle shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brandText-secondary uppercase tracking-wider">
                  Total Amounts Received
                </span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3">
                <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900">
                  ₹{currentMetrics.totalAmountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h2>
                <p className="text-xs text-brandText-muted mt-0.5">
                  Net collected order GMV for {currentMetrics.monthLabel}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-brandBorder-subtle flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{currentMetrics.revenueGrowth}%</span>
                </span>
                <span className="text-brandText-secondary text-[11px]">
                  vs ₹{currentMetrics.lastMonthAmountReceived.toLocaleString('en-IN')} last month
                </span>
              </div>
            </div>

            {/* Card 3: Monthly Riders Settlements (Total, Given, Due) */}
            <div className="bg-surface-pure rounded-3xl p-5 sm:p-6 border border-brandBorder-subtle shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brandText-secondary uppercase tracking-wider">
                  Riders Monthly Settlements
                </span>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                  <Bike className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3">
                <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900">
                  ₹{currentMetrics.riderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h2>
                <p className="text-xs text-brandText-muted mt-0.5">
                  Total monthly rider delivery disbursement
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-brandBorder-subtle grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-brandText-secondary uppercase block">Given (Paid)</span>
                  <p className="font-bold text-emerald-700">
                    ₹{currentMetrics.riderGiven.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-brandText-secondary uppercase block">Due Balance</span>
                  <p className="font-extrabold text-amber-700">
                    ₹{currentMetrics.riderDue.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Riders Payment Details Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-heading font-bold text-forest-900">
                  Rider Fleet Monthly Earnings & Payment Status
                </h3>
                <p className="text-xs text-brandText-secondary">
                  Monthly breakdown of rider delivery incentives, disbursed amounts, and outstanding dues.
                </p>
              </div>

              <span className="text-xs font-bold text-forest-700 bg-forest-50 px-3 py-1 rounded-full border border-forest-100">
                {ridersPayments.length} Active Riders
              </span>
            </div>

            <DataTable
              columns={riderColumns}
              data={ridersPayments}
              searchKey="name"
              searchPlaceholder="Search rider by name, phone, or vehicle number..."
            />
          </div>

          {/* MODAL: DAILY PAYMENT DETAILS FOR CLICKED RIDER */}
          {selectedRider && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div
                className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm transition-opacity"
                onClick={() => {
                  setSelectedRider(null);
                  setIsDisbursing(false);
                }}
              />
              <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
                <div className="w-full max-w-3xl bg-surface-pure rounded-3xl p-5 sm:p-7 shadow-floating border border-brandBorder-subtle text-left relative overflow-hidden animate-scale-up my-6 space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-brandBorder-subtle">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700">
                        <Bike className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-heading font-extrabold text-forest-900">
                            {selectedRider.name}
                          </h2>
                          <StatusBadge status={selectedRider.status} />
                        </div>
                        <p className="text-xs text-brandText-secondary">
                          {selectedRider.phone} &bull; {selectedRider.vehicle} &bull; UPI: {selectedRider.upiId}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRider(null);
                        setIsDisbursing(false);
                      }}
                      className="p-1.5 text-brandText-secondary hover:text-forest-700 hover:bg-forest-50 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Rider Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                      <span className="text-[11px] font-semibold text-brandText-secondary block">
                        Total Monthly Earning
                      </span>
                      <p className="text-lg font-heading font-extrabold text-forest-900 mt-0.5">
                        ₹{selectedRider.totalEarning.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-brandText-muted">
                        {selectedRider.monthDeliveries} deliveries
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                      <span className="text-[11px] font-semibold text-emerald-800 block">
                        Given (Disbursed)
                      </span>
                      <p className="text-lg font-heading font-extrabold text-emerald-700 mt-0.5">
                        ₹{selectedRider.givenAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-emerald-600">Settled to bank/UPI</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
                      <span className="text-[11px] font-semibold text-amber-800 block">
                        Outstanding Due
                      </span>
                      <p className="text-lg font-heading font-extrabold text-amber-700 mt-0.5">
                        ₹{selectedRider.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-amber-600">Awaiting disbursement</span>
                    </div>
                  </div>

                  {/* Disburse Action Trigger */}
                  {selectedRider.dueAmount > 0 && !isDisbursing && (
                    <div className="p-3.5 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-forest-900">
                          Pending payout of ₹{selectedRider.dueAmount.toLocaleString('en-IN')} available
                        </p>
                        <p className="text-[11px] text-brandText-secondary">
                          Transfer funds to registered UPI ID ({selectedRider.upiId})
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsDisbursing(true)}
                        className="text-xs font-bold shadow-card px-4"
                      >
                        Disburse Due Balance
                      </Button>
                    </div>
                  )}

                  {/* Inline Disburse Form */}
                  {isDisbursing && (
                    <form
                      onSubmit={handleDisbursePayment}
                      className="p-4 bg-forest-50/90 border border-forest-200 rounded-2xl space-y-3 animate-fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-forest-700" />
                          <span>Execute Rider Disbursal</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsDisbursing(false)}
                          className="text-xs text-brandText-secondary hover:underline"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-brandText-main mb-1">
                            Disbursement Amount (₹) *
                          </label>
                          <input
                            type="number"
                            required
                            max={selectedRider.dueAmount}
                            min={1}
                            value={disburseAmount}
                            onChange={(e) => setDisburseAmount(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-bold text-forest-900 bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brandText-main mb-1">
                            Bank / UPI Reference No.
                          </label>
                          <input
                            type="text"
                            value={disburseNote}
                            onChange={(e) => setDisburseNote(e.target.value)}
                            placeholder="e.g. UPI/6391104820"
                            className="w-full px-3 py-2 text-xs font-mono bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          className="text-xs font-bold shadow-card px-5"
                        >
                          Confirm Payout of ₹{Number(disburseAmount || selectedRider.dueAmount).toLocaleString('en-IN')}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Daily Payment Breakdown Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-forest-900 uppercase tracking-wider">
                        Daily Payment & Delivery Breakdown ({selectedRider.dailyBreakdown.length} days recorded)
                      </h4>
                      <span className="text-[11px] text-brandText-secondary">
                        Rate: ₹100 per successful delivery
                      </span>
                    </div>

                    <div className="border border-brandBorder-subtle rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-surface-warm/80 text-brandText-secondary font-semibold border-b border-brandBorder-subtle sticky top-0 bg-surface-warm">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3 text-right">Deliveries Done</th>
                            <th className="py-2.5 px-3 text-right">COD Collected</th>
                            <th className="py-2.5 px-3 text-right">Daily Payout</th>
                            <th className="py-2.5 px-3">Payment Status</th>
                            <th className="py-2.5 px-3 text-right">Reference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brandBorder-light bg-surface-pure">
                          {selectedRider.dailyBreakdown.map((day, idx) => (
                            <tr key={idx} className="hover:bg-forest-50/40 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-forest-900">{day.date}</td>
                              <td className="py-2.5 px-3 text-right font-medium">{day.deliveries} orders</td>
                              <td className="py-2.5 px-3 text-right font-mono text-brandText-secondary">
                                ₹{day.codCollected.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-forest-900">
                                ₹{day.dailyEarning.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    day.status === 'PAID'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {day.status === 'PAID' ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-amber-600" />
                                  )}
                                  <span>{day.status}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-[11px] text-brandText-muted">
                                {day.ref}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRider(null);
                        setIsDisbursing(false);
                      }}
                      className="text-xs"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFinancePage;
