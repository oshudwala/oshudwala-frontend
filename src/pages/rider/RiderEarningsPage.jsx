import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Building2,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  History,
  RefreshCw,
  Coins,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { riderApi } from '../../services/api/rider.api';

export const RiderEarningsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [metrics, setMetrics] = useState(() => {
    const initial = riderApi.getRiderMetrics(user?.id, user);
    return {
      deliveriesToday: initial.deliveriesToday || 0,
      earningsToday: initial.earningsToday || 0,
      totalDeliveriesMonth: initial.totalDeliveriesMonth || 0,
      monthlyTotalEarnings: initial.monthlyTotalEarnings || 0,
      withdrawableBalance: initial.withdrawableBalance || 0,
      totalWithdrawn: initial.totalWithdrawn || 0,
      withdrawals: initial.withdrawals || [],
    };
  });
  const [profile, setProfile] = useState(() => riderApi.getRiderProfile(user?.id, user));

  // Withdrawal form state: payoutMethod defaults to 'UPI', can be 'OFFLINE_CASH' or 'UPI'
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('UPI'); // 'OFFLINE_CASH' | 'UPI'
  const [upiId, setUpiId] = useState(profile?.upiId || '');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadEarningsData = async () => {
    setIsLoading(true);
    try {
      const data = await riderApi.fetchEarningsAndWallet(user?.id, user);
      if (data) {
        setMetrics(data);
      }
      const prof = riderApi.getRiderProfile(user?.id, user);
      setProfile(prof);
      if (prof?.upiId && !upiId) {
        setUpiId(prof.upiId);
      }
    } catch (err) {
      console.warn('loadEarningsData error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync when finance updates or super admin disburses
  useEffect(() => {
    loadEarningsData();

    const handleUpdate = () => {
      loadEarningsData();
    };

    window.addEventListener('oshud_rider_finance_updated', handleUpdate);
    window.addEventListener('oshud_rider_profile_updated', handleUpdate);
    window.addEventListener('oshud_order_status_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('oshud_rider_finance_updated', handleUpdate);
      window.removeEventListener('oshud_rider_profile_updated', handleUpdate);
      window.removeEventListener('oshud_order_status_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);

    if (!amount || amount <= 0) {
      addToast('Please enter a valid withdrawal amount.', 'error');
      return;
    }

    if (amount > metrics.withdrawableBalance) {
      addToast(
        `Withdrawal amount (₹${amount.toFixed(2)}) cannot exceed available withdrawable balance (₹${metrics.withdrawableBalance.toFixed(2)}).`,
        'error'
      );
      return;
    }

    if (payoutMethod === 'UPI' && !upiId.trim()) {
      addToast('Please provide a valid UPI ID for payout.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const channelLabel = payoutMethod === 'OFFLINE_CASH' ? 'Offline Cash in Hand' : `UPI (${upiId})`;
      const record = await riderApi.submitWithdrawal(
        user?.id || 'usr-rider-01',
        amount,
        payoutMethod,
        withdrawNote || `Rider self-service withdrawal via ${channelLabel}`,
        upiId
      );

      addToast(
        `Withdrawal request of ₹${amount.toFixed(2)} (${channelLabel}) submitted! Waiting for Admin verification with password.`,
        'info'
      );

      setWithdrawAmount('');
      setWithdrawNote('');
      await loadEarningsData();
    } catch (err) {
      addToast(err?.message || 'Error processing withdrawal request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Rider Earnings & Instant Payouts
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Transparent ₹30/order delivery earnings, instant withdrawals, and real-time ledger.
          </p>
        </div>
        <button
          type="button"
          onClick={loadEarningsData}
          disabled={isLoading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-brandBorder-subtle bg-surface-pure text-xs font-bold text-forest-800 hover:bg-forest-50 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-forest-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Earnings</span>
        </button>
      </div>

      {/* Top 3 Metric Cards as requested */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Withdrawable Balance: starts at 0, adds ₹30 per delivery, deducts on withdrawal */}
        <MetricCard
          title="Total Withdrawable Balance"
          value={`₹${Number(metrics.withdrawableBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={metrics.withdrawableBalance > 0 ? "Available for Instant Withdrawal" : "Initial zero balance"}
          trend="up"
          icon={Wallet}
          colorScheme="emerald"
        />

        {/* Total Earnings (Per Day / Today): ₹30 per order delivered today */}
        <MetricCard
          title="Total Earnings (Per Day / Today)"
          value={`₹${Number(metrics.earningsToday || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={`${metrics.deliveriesToday} completed today (₹30.00 / order)`}
          trend="up"
          icon={TrendingUp}
          colorScheme="forest"
        />

        {/* Monthly Total Earnings: adding everyday earnings */}
        <MetricCard
          title="Monthly Total Earnings"
          value={`₹${Number(metrics.monthlyTotalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={`${metrics.totalDeliveriesMonth} trips this month`}
          trend="up"
          icon={DollarSign}
          colorScheme="blue"
        />
      </div>

      {/* Withdrawal Form Section */}
      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brandBorder-subtle pb-4">
          <div>
            <h2 className="font-heading font-bold text-base text-forest-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-forest-700" />
              <span>Request Withdrawal</span>
            </h2>
            <p className="text-xs text-brandText-secondary">
              Withdraw funds from your balance via Offline Cash in Hand or instant UPI.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-brandText-muted block">
              Available to Withdraw
            </span>
            <span className="font-mono font-extrabold text-xl text-emerald-700">
              ₹{Number(metrics.withdrawableBalance || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <form onSubmit={handleWithdrawalSubmit} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-forest-800">
                Withdrawal Amount (₹)
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  required
                  min={1}
                  max={metrics.withdrawableBalance > 0 ? metrics.withdrawableBalance : 1}
                  step="any"
                  placeholder="e.g. 150"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-2.5 text-base font-mono font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                />
              </div>
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(Math.min(metrics.withdrawableBalance, 90)))}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface-warm hover:bg-forest-100 text-forest-900 border border-brandBorder-subtle"
                >
                  ₹90 (3 Trips)
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(Math.min(metrics.withdrawableBalance, 300)))}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface-warm hover:bg-forest-100 text-forest-900 border border-brandBorder-subtle"
                >
                  ₹300 (10 Trips)
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(metrics.withdrawableBalance))}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300"
                >
                  Full Balance
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-forest-800">
                Payout Channel
              </label>
              {/* Exactly two options as requested: offline cash in hand & UPI */}
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 text-xs font-semibold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
              >
                <option value="OFFLINE_CASH">Offline Cash in Hand</option>
                <option value="UPI">UPI</option>
              </select>

              <div className="mt-2 text-xs">
                {payoutMethod === 'OFFLINE_CASH' ? (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                    <span>Collect physical cash payout</span>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Enter UPI ID (e.g. 9830455667@upi)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-mono"
                    />
                    <p className="text-[10px] text-brandText-muted mt-0.5">
                      Instant transfer to your verified UPI ID
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-forest-800">
              Withdrawal Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Daily settlement, fuel or maintenance"
              value={withdrawNote}
              onChange={(e) => setWithdrawNote(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={metrics.withdrawableBalance <= 0 || isSubmitting}
              className="text-xs font-bold px-6 shadow-md bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {isSubmitting ? 'Processing Payout...' : 'Confirm Withdrawal'}
            </Button>
          </div>
        </form>
      </div>

      {/* Synced Disbursals & Withdrawals Ledger */}
      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-forest-900 flex items-center gap-2">
              <History className="w-4 h-4 text-forest-700" />
              <span>Withdrawals & Super Admin Disbursals History</span>
            </h2>
            <p className="text-xs text-brandText-secondary">
              Real-time ledger of withdrawals with date, time, and payout method.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-surface-warm border border-brandBorder-subtle">
            {metrics.withdrawals?.length || 0} Transactions
          </span>
        </div>

        {metrics.withdrawals && metrics.withdrawals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brandBorder-subtle text-brandText-muted uppercase tracking-wider font-bold">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Reference / Slip</th>
                  <th className="py-2.5 px-3">Payout Method</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brandBorder-light font-semibold">
                {metrics.withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-forest-50/40 transition-colors">
                    <td className="py-3 px-3 text-forest-900">
                      <div>{w.date}</div>
                      <div className="text-[10px] text-brandText-secondary">{w.time}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-forest-900">
                      {w.id}
                      {w.note && <p className="text-[10px] text-brandText-muted font-normal">{w.note}</p>}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-lg bg-surface-warm text-forest-900 font-bold border border-brandBorder-subtle">
                        {w.paymentMethod === 'OFFLINE_CASH' || w.rawMethod === 'OFFLINE_CASH'
                          ? 'Offline Cash in Hand'
                          : w.paymentMethod === 'UPI' || w.rawMethod === 'UPI'
                          ? 'UPI'
                          : w.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 text-sm">
                      ₹{Number(w.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {w.status === 'WAITING_VERIFICATION' || w.status === 'REQUESTED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                          <span>Waiting for Admin Verification</span>
                        </span>
                      ) : w.status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertCircle className="w-3 h-3 text-rose-700" />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Verified & Disbursed</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-brandText-muted space-y-1">
            <Wallet className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-xs font-semibold text-brandText-secondary">
              No withdrawals or disbursements recorded yet.
            </p>
            <p className="text-[11px] text-brandText-muted">
              When you withdraw funds via Offline Cash in Hand or UPI, it will appear here in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderEarningsPage;
