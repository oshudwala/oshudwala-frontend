import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  DollarSign,
  ArrowDownLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  CreditCard,
  ShieldCheck,
  History,
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { riderApi } from '../../services/api/rider.api';

export const RiderEarningsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [metrics, setMetrics] = useState(() => riderApi.getRiderMetrics(user?.id, user));
  const [profile, setProfile] = useState(() => riderApi.getRiderProfile(user?.id, user));

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('UPI'); // 'UPI' | 'BANK'
  const [withdrawNote, setWithdrawNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync when finance updates or super admin disburses
  useEffect(() => {
    const handleUpdate = () => {
      setMetrics(riderApi.getRiderMetrics(user?.id, user));
      setProfile(riderApi.getRiderProfile(user?.id, user));
    };

    window.addEventListener('oshud_rider_finance_updated', handleUpdate);
    window.addEventListener('oshud_rider_profile_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('oshud_rider_finance_updated', handleUpdate);
      window.removeEventListener('oshud_rider_profile_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  const handleWithdrawalSubmit = (e) => {
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

    setIsSubmitting(true);
    try {
      const destination =
        payoutMethod === 'UPI'
          ? `UPI (${profile.upiId})`
          : `Bank (${profile.bankAccount.split('•')[0]})`;
      const record = riderApi.requestWithdrawal(
        user?.id || 'usr-rider-01',
        amount,
        destination,
        withdrawNote || 'Instant self-service withdrawal'
      );

      addToast(
        `Instant payout of ₹${amount.toFixed(2)} successfully sent to ${destination}! Ref: ${record.id}`,
        'success'
      );

      setWithdrawAmount('');
      setWithdrawNote('');
      setMetrics(riderApi.getRiderMetrics(user?.id, user));
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Rider Earnings & Instant Payouts
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Real-time delivery fees, COD handling bonuses, Super Admin disbursements, and instant UPI bank withdrawals.
        </p>
      </div>

      {/* Top 3 Metric Cards as requested */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Withdrawable Balance"
          value={`₹${metrics.withdrawableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          change="Available for Instant Withdrawal"
          trend="up"
          icon={Wallet}
          colorScheme="emerald"
        />
        <MetricCard
          title="Total Earnings (Per Day / Today)"
          value={`₹${metrics.earningsToday.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          change={`${metrics.deliveriesToday} completed today`}
          trend="up"
          icon={TrendingUp}
          colorScheme="forest"
        />
        <MetricCard
          title="Monthly Total Earnings"
          value={`₹${metrics.monthlyTotalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
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
              Withdraw any amount within your available balance. Super Admin disbursements also auto-credit here.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-brandText-muted block">
              Max Withdrawable
            </span>
            <span className="font-mono font-extrabold text-lg text-emerald-700">
              ₹{metrics.withdrawableBalance.toFixed(2)}
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
                  placeholder="e.g. 500"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-2.5 text-base font-mono font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                />
              </div>
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(Math.min(metrics.withdrawableBalance, 250)))}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface-warm hover:bg-forest-100 text-forest-900 border border-brandBorder-subtle"
                >
                  ₹250
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(Math.min(metrics.withdrawableBalance, 500)))}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface-warm hover:bg-forest-100 text-forest-900 border border-brandBorder-subtle"
                >
                  ₹500
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
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 text-xs font-semibold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
              >
                <option value="UPI">Instant UPI ({profile.upiId})</option>
                <option value="BANK">Bank Transfer (NEFT/IMPS)</option>
              </select>
              <p className="text-[10px] text-brandText-muted mt-1 truncate">
                {payoutMethod === 'UPI' ? profile.upiId : profile.bankAccount}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-forest-800">
              Withdrawal Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Weekly settlement or Fuel expense"
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
              className="text-xs font-bold px-6 shadow-md bg-emerald-700 hover:bg-emerald-800"
            >
              {isSubmitting ? 'Processing Payout...' : 'Confirm Instant Withdrawal'}
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
              Synchronized in real-time. Payments disbursed by Super Admin from their portal show here automatically.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-surface-warm border border-brandBorder-subtle">
            {metrics.withdrawals.length} Transactions
          </span>
        </div>

        {metrics.withdrawals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brandBorder-subtle text-brandText-muted uppercase tracking-wider font-bold">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Reference / Slip</th>
                  <th className="py-2.5 px-3">Initiated By</th>
                  <th className="py-2.5 px-3">Channel / Method</th>
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
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          w.disbursedBy === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {w.disbursedBy === 'SUPER_ADMIN' ? 'Super Admin Portal' : 'Rider Self-Service'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-brandText-secondary">{w.paymentMethod}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 text-sm">
                      ₹{Number(w.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{w.status || 'COMPLETED'}</span>
                      </span>
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
              When you withdraw funds or Super Admin executes a payout, it will appear here in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderEarningsPage;
