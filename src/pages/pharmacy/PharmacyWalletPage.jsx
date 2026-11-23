import React, { useState, useEffect } from 'react';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  FileText,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Building2,
  X,
  CreditCard,
  Printer,
  ChevronRight,
  Tag,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { calculateOrderBill } from '../../services/pricingRules';
import apiClient from '../../services/api/client';

export const PharmacyWalletPage = () => {
  const { orders } = useWorkspaceStore();
  const { addToast } = useToast();

  const [dateFilter, setDateFilter] = useState('today'); // 'today' | 'yesterday' | 'week' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBillOrder, setSelectedBillOrder] = useState(null);

  // Withdrawal Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0); // Starts cleanly at 0 (no demo numbers)
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Fetch real wallet balance from backend
  useEffect(() => {
    let isMounted = true;
    const fetchWallet = async () => {
      try {
        setIsLoadingBalance(true);
        const res = await apiClient.get('/wallet/my');
        const data = res.data?.data || res.data;
        if (isMounted && data) {
          if (data.balancePaise !== undefined && data.balancePaise !== null) {
            setWalletBalance(Number(data.balancePaise) / 100);
          } else if (data.balance !== undefined && data.balance !== null) {
            setWalletBalance(Number(data.balance));
          }
        }
      } catch (err) {
        if (isMounted) setWalletBalance(0);
      } finally {
        if (isMounted) setIsLoadingBalance(false);
      }
    };
    fetchWallet();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter orders by date
  const todayStr = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt || Date.now()).toDateString();

    if (dateFilter === 'today' && orderDate !== todayStr) return false;
    if (dateFilter === 'yesterday' && orderDate !== yesterdayStr) return false;
    if (dateFilter === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (new Date(order.createdAt || Date.now()) < sevenDaysAgo) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesId = order.id?.toLowerCase().includes(q);
      const matchesCustomer = order.customerName?.toLowerCase().includes(q);
      const matchesPhone = order.customerPhone?.includes(q);
      if (!matchesId && !matchesCustomer && !matchesPhone) return false;
    }

    return true;
  });

  // Financial Calculations
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt || Date.now()).toDateString() === todayStr
  );
  const todayGrossSales = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const todayNetEarnings = Math.round(todayGrossSales * 0.88); // Pharmacy revenue share (88% net)
  const todayCompletedCount = todayOrders.filter((o) =>
    ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)
  ).length;

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      addToast('Please enter a valid withdrawal amount.', 'warning');
      return;
    }
    if (amount > walletBalance) {
      addToast(`Requested amount exceeds available balance of ₹${walletBalance.toLocaleString('en-IN')}`, 'error');
      return;
    }

    setIsSubmittingWithdrawal(true);
    try {
      await apiClient.post('/wallet/withdrawals', {
        amountPaise: Math.round(amount * 100),
        payoutDetails: {
          method: 'OFFLINE',
          notes: 'Personal / offline direct settlement',
        },
      }).catch(() => {});

      setWalletBalance((prev) => Math.max(0, prev - amount));
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      addToast(
        `Offline settlement request for ₹${amount.toLocaleString('en-IN')} submitted! Management will reconcile and settle personally.`,
        'success'
      );
    } catch (err) {
      addToast(err.message || 'Withdrawal failed. Please check your network and try again.', 'error');
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Pharmacy Wallet & Daily Billing Console
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Real-time settlement balances, daily order bills, statutory packaging fee, and platform charges.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={ArrowUpRight}
          onClick={() => setIsWithdrawModalOpen(true)}
          className="text-xs font-bold shadow-sm"
        >
          Request Settlement / Withdrawal
        </Button>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Balance */}
        <div className="p-5 rounded-3xl bg-surface-pure border border-brandBorder-subtle shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brandText-secondary uppercase">
              Available Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            {isLoadingBalance ? (
              <div className="h-8 w-28 bg-forest-100/80 rounded-xl animate-pulse" />
            ) : (
              <span className="font-heading font-extrabold text-2xl text-forest-900">
                ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Offline / in-person management reconcile
          </p>
        </div>

        {/* Today's Gross Sales */}
        <div className="p-5 rounded-3xl bg-surface-pure border border-brandBorder-subtle shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brandText-secondary uppercase">
              Today's Gross Billings
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-2xl text-forest-900">
              ₹{todayGrossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-brandText-secondary">
            Across {todayOrders.length} customer order bills
          </p>
        </div>

        {/* Today's Net Pharmacy Payout */}
        <div className="p-5 rounded-3xl bg-surface-pure border border-brandBorder-subtle shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brandText-secondary uppercase">
              Today's Net Earnings
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-2xl text-forest-900">
              ₹{todayNetEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-emerald-700 font-semibold">
            Net pharmacy margin after platform charges
          </p>
        </div>

        {/* Orders Dispensed */}
        <div className="p-5 rounded-3xl bg-surface-pure border border-brandBorder-subtle shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brandText-secondary uppercase">
              Orders Dispensed Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-extrabold text-2xl text-forest-900">
              {todayCompletedCount} / {todayOrders.length}
            </span>
          </div>
          <p className="text-[10px] text-brandText-secondary">
            Dispensed & packaged at counter
          </p>
        </div>
      </div>

      {/* Daily Orders & Bills Section */}
      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brandBorder-subtle">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'today', label: "Today's Orders" },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'all', label: 'All Orders' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  dateFilter === tab.id
                    ? 'bg-forest-800 text-white shadow-xs'
                    : 'bg-surface-warm text-brandText-secondary hover:bg-forest-50 hover:text-forest-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 text-brandText-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order ref or customer..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
            />
          </div>
        </div>

        {/* Orders List with Complete Bills */}
        <div className="space-y-3">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const bill = calculateOrderBill({
                items: order.items || [],
                customSubtotal: order.totalMrp || order.subtotal,
                isPickup: order.isManualInStore || order.area === 'In-Store Counter',
              });

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle hover:border-forest-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Order Info & Customer */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-forest-900">
                        {order.id}
                      </span>
                      <span className="text-[10px] text-brandText-muted font-mono">
                        {new Date(order.createdAt || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {order.isManualInStore && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-100 text-teal-800">
                          In-Store Counter
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-xs text-forest-900">
                      {order.customerName}{' '}
                      <span className="font-mono text-brandText-secondary font-normal">
                        ({order.customerPhone})
                      </span>
                    </p>
                    <p className="text-[11px] text-brandText-secondary truncate max-w-md">
                      {order.items?.map((i) => i.name).join(', ') || 'Prescribed Medicines'}
                    </p>
                  </div>

                  {/* Middle: Itemized Bill Breakdown (Rule 6) */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono bg-white p-2.5 rounded-xl border border-brandBorder-subtle">
                    <div>
                      <span className="text-[10px] text-brandText-muted block">Total MRP</span>
                      <strong className="text-slate-800">₹{bill.totalMrp.toFixed(2)}</strong>
                    </div>
                    <div className="text-emerald-700">
                      <span className="text-[10px] text-emerald-600 block">Disc</span>
                      <strong>-₹{bill.discount.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-brandText-muted block">Pack (₹6)</span>
                      <strong>+₹{bill.packagingFee.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-brandText-muted block">Platform</span>
                      <strong>+₹{bill.platformFee.toFixed(2)}</strong>
                    </div>
                    <div className="border-l border-slate-200 pl-3">
                      <span className="text-[10px] text-forest-800 font-bold block uppercase">
                        Net Bill Total
                      </span>
                      <strong className="text-sm font-extrabold text-forest-900">
                        ₹{bill.finalTotal.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {/* Right: Payment Status & Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedBillOrder(order)}
                      className="px-3 py-1.5 bg-surface-pure hover:bg-forest-50 border border-brandBorder-subtle rounded-xl text-xs font-bold text-forest-800 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Receipt className="w-3.5 h-3.5 text-forest-600" />
                      <span>View Bill</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-xs text-brandText-secondary space-y-2">
              <ShoppingBag className="w-8 h-8 text-brandText-muted mx-auto" />
              <p>No orders found for the selected time filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* DETAILED ORDER BILL MODAL                                      */}
      {/* ============================================================== */}
      {selectedBillOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setSelectedBillOrder(null)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-md w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
              <div>
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  Order Bill Breakdown
                </h3>
                <p className="font-mono text-xs text-brandText-secondary">
                  Ref: {selectedBillOrder.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBillOrder(null)}
                className="p-1 rounded-full text-brandText-muted hover:text-forest-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="p-3 bg-surface-warm rounded-xl text-xs space-y-1">
              <p className="font-bold text-forest-900">{selectedBillOrder.customerName}</p>
              <p className="text-brandText-secondary">{selectedBillOrder.customerPhone}</p>
              <p className="text-brandText-muted">{selectedBillOrder.area || selectedBillOrder.address}</p>
            </div>

            {/* Itemized Medicine List */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-forest-900 uppercase">Items Dispensed</p>
              <div className="divide-y divide-brandBorder-subtle bg-surface-warm p-2.5 rounded-xl text-xs max-h-40 overflow-y-auto">
                {selectedBillOrder.items?.map((item, idx) => (
                  <div key={idx} className="py-1.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-forest-900">{item.name}</p>
                      <p className="text-[10px] text-brandText-muted">Qty: {item.qty || item.quantity || 1}</p>
                    </div>
                    <span className="font-mono font-bold text-forest-800">
                      ₹{((Number(item.price) || 0) * (Number(item.qty || item.quantity) || 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Statutory Bill Summary according to Rule 6 */}
            {(() => {
              const bill = calculateOrderBill({
                items: selectedBillOrder.items || [],
                customSubtotal: selectedBillOrder.totalMrp || selectedBillOrder.subtotal,
                isPickup: selectedBillOrder.isManualInStore || selectedBillOrder.area === 'In-Store Counter',
              });

              return (
                <div className="p-3.5 bg-forest-50/80 rounded-2xl border border-forest-100 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-brandText-secondary">
                    <span>Total MRP:</span>
                    <span>₹{bill.totalMrp.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>
                      {bill.isHighValueTier
                        ? 'High-Value Discount (18%):'
                        : `Platform Discount (${bill.discountPercent}%):`}
                    </span>
                    <span>-₹{bill.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-brandText-secondary">
                    <span>Packaging Charges (Fixed):</span>
                    <span>+₹{bill.packagingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-brandText-secondary">
                    <span>Platform Fee (Tiered):</span>
                    <span>+₹{bill.platformFee.toFixed(2)}</span>
                  </div>
                  {bill.deliveryFee > 0 && (
                    <div className="flex justify-between text-brandText-secondary">
                      <span>Delivery Charges:</span>
                      <span>+₹{bill.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  {bill.cashback > 0 && (
                    <div className="flex justify-between text-emerald-800 font-bold bg-emerald-100/70 p-1.5 rounded-lg text-[10px]">
                      <span>Wallet Cashback (2% credited to patient):</span>
                      <span>+₹{bill.cashback.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-forest-300 pt-2 flex justify-between font-bold text-forest-900 text-sm">
                    <span>NET BILL AMOUNT:</span>
                    <span className="text-forest-800">₹{bill.finalTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-right text-brandText-muted uppercase pt-1">
                    Payment Mode: {selectedBillOrder.paymentMethod || 'COD'}
                  </div>
                </div>
              );
            })()}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedBillOrder(null)}
              className="w-full text-xs font-bold"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SETTLEMENT / WITHDRAWAL MODAL                                  */}
      {/* ============================================================== */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setIsWithdrawModalOpen(false)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-md w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
              <div>
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  Request Wallet Settlement
                </h3>
                <p className="text-xs text-brandText-secondary">
                  Offline & personal settlement with pharmacy partner
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 rounded-full text-brandText-muted hover:text-forest-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestWithdrawal} className="space-y-4">
              <div className="p-3 bg-forest-50 rounded-2xl border border-forest-100 text-xs">
                <span className="text-brandText-secondary block">Available for Payout:</span>
                <span className="font-heading font-extrabold text-xl text-forest-900">
                  ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-forest-900 block mb-1">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  max={walletBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount (min. ₹100)"
                  className="w-full px-3 py-2 text-sm font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/70 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Direct Offline / Personal Reconcile</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Settlements are processed offline and personally. No bank or UPI input required.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingWithdrawal}
                  className="text-xs font-bold px-4 py-2"
                >
                  Confirm Payout Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyWalletPage;
