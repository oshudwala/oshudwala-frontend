import React, { useState, useEffect } from 'react';
import {
  Coins,
  Building,
  Printer,
  History,
  FileText,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { riderApi } from '../../services/api/rider.api';

export const RiderCashPage = () => {
  const { user } = useAuth();
  const { orders, riders } = useWorkspaceStore();
  const { addToast } = useToast();

  const [cashData, setCashData] = useState(() => {
    const initial = riderApi.getRiderMetrics(user?.id, user);
    return {
      cashInHand: initial.cashInHand || 0,
      collections: initial.codTransactions || [],
      deposits: [],
    };
  });
  const [depositAmount, setDepositAmount] = useState('');
  const [remittanceHistory, setRemittanceHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadCashData = async () => {
    setIsLoading(true);
    try {
      const summary = await riderApi.fetchCashSummary(user?.id, user);
      if (summary) {
        setCashData(summary);
        if (summary.deposits && summary.deposits.length > 0) {
          setRemittanceHistory(summary.deposits);
        }
      }
    } catch (err) {
      console.warn('loadCashData fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCashData();

    const handleUpdate = () => {
      loadCashData();
    };

    window.addEventListener('oshud_rider_finance_updated', handleUpdate);
    window.addEventListener('oshud_order_status_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('oshud_rider_finance_updated', handleUpdate);
      window.removeEventListener('oshud_order_status_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  useEffect(() => {
    loadCashData();
  }, [orders, riders]);

  // Keep deposit input aligned with current available cash
  useEffect(() => {
    if (cashData.cashInHand > 0 && (!depositAmount || Number(depositAmount) > cashData.cashInHand)) {
      setDepositAmount(String(cashData.cashInHand));
    } else if (cashData.cashInHand <= 0) {
      setDepositAmount('0');
    }
  }, [cashData.cashInHand]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      addToast('Please enter a valid deposit amount greater than ₹0.', 'error');
      return;
    }
    if (amount > cashData.cashInHand) {
      addToast(
        `Deposit amount (₹${amount.toFixed(2)}) exceeds physical cash in hand (₹${cashData.cashInHand.toFixed(2)}).`,
        'error'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const slip = await riderApi.submitCashDeposit(
        user?.id || 'usr-rider-01',
        amount,
        'CASH_HANDOVER',
        'Central Hub Cash Depot Remittance'
      );

      setRemittanceHistory((prev) => [slip, ...prev.filter((p) => p.depositId !== slip.depositId)]);
      addToast(`Successfully remitted ₹${amount.toFixed(2)} to Depot! Slip: ${slip.depositId}`, 'success');

      // Reload real cash data immediately from backend
      await loadCashData();
    } catch (err) {
      addToast(err?.message || 'Error remitting cash deposit.', 'error');
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
            Cash in Hand & Hub Remittance (COD)
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Automatic real-time ledger of physical Cash on Delivery payments collected from patients.
          </p>
        </div>
        <button
          type="button"
          onClick={loadCashData}
          disabled={isLoading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-brandBorder-subtle bg-surface-pure text-xs font-bold text-forest-800 hover:bg-forest-50 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-forest-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Ledger</span>
        </button>
      </div>

      {/* Prominent Physical Cash in Hand Box (COD Only - Excluding UPI) */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-3xl border border-amber-200/90 shadow-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100/90 text-amber-800 flex items-center justify-center flex-shrink-0 shadow-xs border border-amber-200">
            <Coins className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Physical Cash in Hand (COD)
            </span>
            <div className="font-mono font-extrabold text-3xl sm:text-4xl text-amber-950 mt-0.5">
              ₹{Number(cashData.cashInHand || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-amber-900/80 mt-1 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
              <span>Real-time COD collected &bull; Deducted automatically upon hub remittance</span>
            </p>
          </div>
        </div>
        <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-amber-200/80 pt-3 sm:pt-0 sm:pl-6">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">
            COD Deliveries Recorded
          </span>
          <span className="font-mono font-extrabold text-xl text-amber-950">
            {cashData.collections?.length || 0} Orders
          </span>
          <p className="text-[11px] text-brandText-muted mt-0.5">
            UPI QR payments excluded
          </p>
        </div>
      </div>

      {/* Hub Remittance Action Form: Cash Handover Depot */}
      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-base text-forest-900">
              Cash Handover Depot
            </h2>
            <p className="text-xs text-brandText-secondary">
              Sector V Central Hub Cash Counter &bull; Remit physical cash to deduct from Cash in Hand
            </p>
          </div>
        </div>

        <form onSubmit={handleDeposit} className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-bold text-forest-800">
              Deposit Amount to Hand Over (₹)
            </label>
            <input
              type="number"
              required
              min={1}
              max={cashData.cashInHand > 0 ? cashData.cashInHand : 1}
              step="any"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 text-base font-mono font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
            />
            <div className="flex items-center justify-between text-[11px] text-brandText-secondary mt-1">
              <span>
                Available Cash to Remit:{' '}
                <strong className="font-mono text-forest-900">
                  ₹{Number(cashData.cashInHand || 0).toFixed(2)}
                </strong>
              </span>
              {cashData.cashInHand > 0 && (
                <button
                  type="button"
                  onClick={() => setDepositAmount(String(cashData.cashInHand))}
                  className="font-bold text-amber-800 hover:underline"
                >
                  Deposit Full
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={cashData.cashInHand <= 0 || isSubmitting}
              className="text-xs font-bold px-5 bg-amber-700 hover:bg-amber-800 text-white"
            >
              {isSubmitting ? 'Submitting Deposit...' : 'Confirm Hub Deposit'}
            </Button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 border border-brandBorder-subtle rounded-xl text-xs font-bold text-forest-800 hover:bg-forest-50 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-forest-600" />
              <span>Print Slip</span>
            </button>
          </div>
        </form>
      </div>

      {/* Auto-populated COD Collections Ledger */}
      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-forest-900 flex items-center gap-2">
              <History className="w-4 h-4 text-forest-700" />
              <span>Cash Collections Ledger</span>
            </h2>
            <p className="text-xs text-brandText-secondary">
              Real COD transaction history with collected amounts, timestamps, and order references.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-surface-warm border border-brandBorder-subtle">
            {cashData.collections?.length || 0} Recorded
          </span>
        </div>

        {cashData.collections && cashData.collections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brandBorder-subtle text-brandText-muted uppercase tracking-wider font-bold">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3 text-right">Cash Collected</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brandBorder-light font-semibold">
                {cashData.collections.map((tx) => (
                  <tr key={tx.id} className="hover:bg-forest-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-forest-900">{tx.orderId}</td>
                    <td className="py-2.5 px-3 text-forest-900">{tx.customerName}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900">
                      ₹{Number(tx.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-brandText-secondary">
                      {tx.date ? `${tx.date} at ${tx.time}` : tx.time}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          tx.status === 'DEPOSITED' || tx.status === 'VERIFIED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {tx.status || 'COLLECTED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-brandText-muted space-y-1">
            <Coins className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-xs font-semibold text-brandText-secondary">
              No COD cash collections recorded yet.
            </p>
            <p className="text-[11px] text-brandText-muted">
              Once you complete Cash on Delivery orders, each collected amount will automatically appear here.
            </p>
          </div>
        )}
      </div>

      {/* Hub Remittance Deposit Slips */}
      {remittanceHistory.length > 0 && (
        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-3">
          <h3 className="font-heading font-bold text-sm text-forest-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-forest-700" />
            <span>Today's Remittance Deposit Slips</span>
          </h3>
          <div className="space-y-2">
            {remittanceHistory.map((slip) => (
              <div
                key={slip.id || slip.depositId}
                className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-forest-900">{slip.depositId || slip.id}</span>
                  <span className="text-brandText-muted ml-2">
                    &bull; {slip.date} {slip.time ? `at ${slip.time}` : ''}
                  </span>
                  <p className="text-[11px] text-brandText-secondary">{slip.note || slip.method || 'Hub Remittance'}</p>
                </div>
                <span className="font-mono font-extrabold text-sm text-emerald-700">
                  ₹{Number(slip.amount || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderCashPage;
