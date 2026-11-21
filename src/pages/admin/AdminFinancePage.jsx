import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  Bike,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Coins,
  ArrowUpRight,
  X,
  CreditCard,
  FileCheck
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { riderApi } from '../../services/api/rider.api';

export const AdminFinancePage = () => {
  const { addToast } = useToast();

  // Selected Month filter
  const [selectedMonth, setSelectedMonth] = useState('2026-11'); // YYYY-MM
  const [selectedRider, setSelectedRider] = useState(null);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disburseNote, setDisburseNote] = useState('');

  // Monthly aggregated data with comparisons to last month
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

  // Monthly Riders Payments dataset with real daily breakdowns
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
        { date: '17 Nov 2026', deliveries: 8, codCollected: 3500, dailyEarning: 800, status: 'DUE', ref: 'Pending' },
        { date: '16 Nov 2026', deliveries: 15, codCollected: 7100, dailyEarning: 1500, status: 'PAID', ref: 'UPI/63892019' },
        { date: '15 Nov 2026', deliveries: 16, codCollected: 6800, dailyEarning: 1600, status: 'PAID', ref: 'UPI/63811942' },
        { date: '14 Nov 2026', deliveries: 14, codCollected: 5900, dailyEarning: 1400, status: 'PAID', ref: 'UPI/63799014' },
      ],
    },
    {
      id: 'rider-02',
      name: 'Sourav Mondal',
      phone: '+91 98765 00002',
      vehicle: 'Honda Activa (WB-01-EE-4412)',
      area: 'Gariahat & South Kolkata',
      monthDeliveries: 152,
      totalEarning: 15200.0,
      givenAmount: 11000.0,
      dueAmount: 4200.0,
      status: 'PARTIALLY_PAID',
      upiId: 'sourav.m@okhdfcbank',
      dailyBreakdown: [
        { date: '20 Nov 2026', deliveries: 11, codCollected: 4800, dailyEarning: 1100, status: 'DUE', ref: 'Pending' },
        { date: '19 Nov 2026', deliveries: 13, codCollected: 5900, dailyEarning: 1300, status: 'DUE', ref: 'Pending' },
        { date: '18 Nov 2026', deliveries: 9, codCollected: 3900, dailyEarning: 900, status: 'DUE', ref: 'Pending' },
        { date: '17 Nov 2026', deliveries: 9, codCollected: 4200, dailyEarning: 900, status: 'DUE', ref: 'Pending' },
        { date: '16 Nov 2026', deliveries: 14, codCollected: 6100, dailyEarning: 1400, status: 'PAID', ref: 'UPI/63844201' },
      ],
    },
    {
      id: 'rider-03',
      name: 'Bikash Roy',
      phone: '+91 98765 00003',
      vehicle: 'TVS Jupiter (WB-04-MM-8801)',
      area: 'Howrah & Central',
      monthDeliveries: 148,
      totalEarning: 14800.0,
      givenAmount: 14800.0,
      dueAmount: 0.0,
      status: 'SETTLED',
      upiId: 'bikash.roy@paytm',
      dailyBreakdown: [
        { date: '20 Nov 2026', deliveries: 10, codCollected: 4300, dailyEarning: 1000, status: 'PAID', ref: 'UPI/63901429' },
        { date: '19 Nov 2026', deliveries: 12, codCollected: 5100, dailyEarning: 1200, status: 'PAID', ref: 'UPI/63889120' },
        { date: '18 Nov 2026', deliveries: 11, codCollected: 4700, dailyEarning: 1100, status: 'PAID', ref: 'UPI/63877192' },
      ],
    },
    {
      id: 'rider-04',
      name: 'Anirban Mukherjee',
      phone: '+91 98765 00004',
      vehicle: 'Bajaj Pulsar (WB-24-BC-2291)',
      area: 'Durgapur City Centre',
      monthDeliveries: 138,
      totalEarning: 13800.0,
      givenAmount: 8800.0,
      dueAmount: 5000.0,
      status: 'PARTIALLY_PAID',
      upiId: 'anirban.m@sbi',
      dailyBreakdown: [
        { date: '20 Nov 2026', deliveries: 12, codCollected: 5000, dailyEarning: 1200, status: 'DUE', ref: 'Pending' },
        { date: '19 Nov 2026', deliveries: 14, codCollected: 6100, dailyEarning: 1400, status: 'DUE', ref: 'Pending' },
        { date: '18 Nov 2026', deliveries: 12, codCollected: 5200, dailyEarning: 1200, status: 'DUE', ref: 'Pending' },
        { date: '17 Nov 2026', deliveries: 12, codCollected: 4900, dailyEarning: 1200, status: 'DUE', ref: 'Pending' },
      ],
    },
    {
      id: 'rider-05',
      name: 'Deepak Shaw',
      phone: '+91 98765 00005',
      vehicle: 'Ather EV (WB-02-EV-1102)',
      area: 'Alipore & Behala',
      monthDeliveries: 126,
      totalEarning: 12600.0,
      givenAmount: 7000.0,
      dueAmount: 5600.0,
      status: 'PARTIALLY_PAID',
      upiId: 'deepak.shaw@icici',
      dailyBreakdown: [
        { date: '20 Nov 2026', deliveries: 14, codCollected: 6300, dailyEarning: 1400, status: 'DUE', ref: 'Pending' },
        { date: '19 Nov 2026', deliveries: 14, codCollected: 5800, dailyEarning: 1400, status: 'DUE', ref: 'Pending' },
        { date: '18 Nov 2026', deliveries: 14, codCollected: 6100, dailyEarning: 1400, status: 'DUE', ref: 'Pending' },
        { date: '17 Nov 2026', deliveries: 14, codCollected: 5900, dailyEarning: 1400, status: 'DUE', ref: 'Pending' },
      ],
    },
  ]);

  // Handle Disbursing Due Payment
  const handleDisbursePayment = (e) => {
    e.preventDefault();
    if (!selectedRider) return;

    const amount = Number(disburseAmount) || selectedRider.dueAmount;
    if (amount <= 0 || amount > selectedRider.dueAmount) {
      addToast('Please enter an amount between ₹1 and current due balance.', 'error');
      return;
    }

    const refNo = `NEFT-${Math.floor(100000 + Math.random() * 900000)}`;

    // Sync with Rider Portal and persistent wallet
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

        // Update daily breakdown entries to PAID
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
    addToast(`Disbursed ₹${amount.toLocaleString('en-IN')} to ${selectedRider.name} successfully! (Ref: ${refNo})`, 'success');
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
      header: 'Deliveries',
      key: 'monthDeliveries',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-xs text-forest-900">{row.monthDeliveries}</span>
          <p className="text-[10px] text-brandText-muted">orders</p>
        </div>
      ),
    },
    {
      header: 'Total Earning',
      key: 'totalEarning',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-forest-900">
          ₹{row.totalEarning.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Given (Paid)',
      key: 'givenAmount',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-emerald-700">
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
          className={`font-mono font-extrabold text-xs ${
            row.dueAmount > 0 ? 'text-amber-700' : 'text-emerald-700'
          }`}
        >
          ₹{row.dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Payout Status',
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
      {/* Page Title & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900 tracking-tight">
            Settlement & Wallet
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Monthly platform order volumes, total revenue comparisons, and rider payment ledgers.
          </p>
        </div>

        {/* Month Selector Filter */}
        <div className="flex items-center gap-2 bg-surface-pure p-1.5 rounded-2xl border border-brandBorder-subtle shadow-xs">
          <Calendar className="w-4 h-4 text-forest-700 ml-2" />
          <span className="text-xs font-bold text-forest-800">Billing Cycle:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold text-forest-900 bg-surface-warm px-3 py-1.5 rounded-xl border border-brandBorder-subtle focus:outline-none focus:border-forest-500"
          >
            <option value="2026-11">November 2026 (Current)</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-09">September 2026</option>
          </select>
        </div>
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

      {/* ============================================================== */}
      {/* MODAL: DAILY PAYMENT DETAILS FOR CLICKED RIDER                 */}
      {/* ============================================================== */}
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
              {/* Header */}
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

              {/* Rider Summary Cards for Selected Month */}
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

              {/* Close Button */}
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
  );
};

export default AdminFinancePage;
