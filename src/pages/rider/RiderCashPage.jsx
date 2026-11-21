import React, { useState, useEffect } from 'react';
import {
  Coins,
  CheckCircle,
  Building,
  Printer,
  History,
  FileText,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { riderApi } from '../../services/api/rider.api';

export const RiderCashPage = () => {
  const { user } = useAuth();
  const { orders, riders, reconcileCash } = useWorkspaceStore();
  const { addToast } = useToast();

  const [metrics, setMetrics] = useState(() => riderApi.getRiderMetrics(user?.id, user));
  const [depositAmount, setDepositAmount] = useState(
    metrics.cashInHand > 0 ? String(metrics.cashInHand) : '0'
  );
  const [remittanceHistory, setRemittanceHistory] = useState([]);

  useEffect(() => {
    const handleUpdate = () => {
      const nextMetrics = riderApi.getRiderMetrics(user?.id, user);
      setMetrics(nextMetrics);
      setDepositAmount(nextMetrics.cashInHand > 0 ? String(nextMetrics.cashInHand) : '0');
    };

    window.addEventListener('oshud_rider_finance_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('oshud_rider_finance_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  useEffect(() => {
    const nextMetrics = riderApi.getRiderMetrics(user?.id, user);
    setMetrics(nextMetrics);
    setDepositAmount(nextMetrics.cashInHand > 0 ? String(nextMetrics.cashInHand) : '0');
  }, [orders, riders, user]);

  const handleDeposit = (e) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      addToast('Please enter a valid deposit amount greater than ₹0.', 'error');
      return;
    }
    if (amount > metrics.cashInHand) {
      addToast(`Deposit amount (₹${amount}) exceeds physical cash in hand (₹${metrics.cashInHand.toFixed(2)}).`, 'error');
      return;
    }

    try {
      const depositSlip = riderApi.depositCash(user?.id || 'usr-rider-01', amount, 'Hub Cash Counter Handover');
      setRemittanceHistory((prev) => [depositSlip, ...prev]);
      addToast(`Successfully remitted ₹${amount.toFixed(2)} at Kolkata Hub! Slip: ${depositSlip.depositId}`, 'success');
      const updated = riderApi.getRiderMetrics(user?.id, user);
      setMetrics(updated);
      setDepositAmount(updated.cashInHand > 0 ? String(updated.cashInHand) : '0');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Cash in Hand & Hub Remittance (COD)
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Automatic ledger of Cash on Delivery payments collected from patients and reconciled with Kolkata Hub.
        </p>
      </div>

      {/* Dynamic Metric Cards (Zero base, no demo numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Physical Cash in Hand (COD)"
          value={`₹${metrics.cashInHand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          change="Pending Hub Deposit"
          trend="neutral"
          icon={Coins}
          colorScheme="amber"
        />
        <MetricCard
          title="Total Cash Remitted Today"
          value={`₹${metrics.cashDeposited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          change="Reconciled & Cleared"
          trend="up"
          icon={CheckCircle}
          colorScheme="emerald"
        />
        <MetricCard
          title="Completed COD Deliveries"
          value={`${metrics.codTransactions.length} Orders`}
          change="Auto-incremented on delivery"
          trend="up"
          icon={FileText}
          colorScheme="blue"
        />
      </div>

      {/* Hub Remittance Action Form */}
      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-base text-forest-900">
              Kolkata Hub Cash Handover Depot
            </h2>
            <p className="text-xs text-brandText-secondary">
              Sector V Central Hub Cash Counter &bull; Open daily until 10:00 PM
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
              max={metrics.cashInHand > 0 ? metrics.cashInHand : 1}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 text-base font-mono font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
            />
            <p className="text-[11px] text-brandText-secondary mt-1">
              Current Available Cash to Deposit: <strong className="font-mono text-forest-900">₹{metrics.cashInHand.toFixed(2)}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={metrics.cashInHand <= 0}
              className="text-xs font-bold px-5"
            >
              Confirm Hub Deposit
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
              Automatically populated when each Cash on Delivery order is completed.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-surface-warm border border-brandBorder-subtle">
            {metrics.codTransactions.length} Recorded
          </span>
        </div>

        {metrics.codTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brandBorder-subtle text-brandText-muted uppercase tracking-wider font-bold">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3 text-right">Cash Collected</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brandBorder-light font-semibold">
                {metrics.codTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-forest-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-forest-900">{tx.orderId}</td>
                    <td className="py-2.5 px-3 text-forest-900">{tx.customerName}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900">
                      ₹{Number(tx.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-brandText-secondary">{tx.time}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                        {tx.status}
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
              Once you complete cash-on-delivery orders, they will appear here automatically.
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
                key={slip.depositId}
                className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-forest-900">{slip.depositId}</span>
                  <span className="text-brandText-muted ml-2">&bull; {slip.date} at {slip.time}</span>
                  <p className="text-[11px] text-brandText-secondary">{slip.note}</p>
                </div>
                <span className="font-mono font-extrabold text-sm text-emerald-700">
                  ₹{slip.amount.toFixed(2)}
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
