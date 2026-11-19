import React, { useState } from 'react';
import { Coins, CheckCircle, ArrowDownLeft, Building, ShieldCheck, Printer } from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const RiderCashPage = () => {
  const { user } = useAuth();
  const { riders, reconcileCash } = useWorkspaceStore();
  const { addToast } = useToast();

  const currentRider = riders.find((r) => r.id === user?.id) || riders[0];
  const [depositAmount, setDepositAmount] = useState(String(currentRider?.cashInHand || 0));

  const handleDeposit = (e) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) return;

    reconcileCash(currentRider.id, amount);
    addToast(`Successfully deposited ₹${amount.toFixed(2)} at Kolkata Hub!`, 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Cash in Hand & Hub Remittance
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Record Cash on Delivery (COD) collections and generate deposit slip for Kolkata depot.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          title="Current Physical Cash in Hand"
          value={`₹${(currentRider?.cashInHand || 0).toFixed(2)}`}
          change="Pending Hub Deposit"
          trend="neutral"
          icon={Coins}
          colorScheme="amber"
        />
        <MetricCard
          title="Total Cash Deposited Today"
          value={`₹${(currentRider?.cashRemittedToday || 0).toFixed(2)}`}
          change="Reconciled & Cleared"
          trend="up"
          icon={CheckCircle}
          colorScheme="emerald"
        />
      </div>

      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-base text-forest-900">
              Kolkata Cash Deposit Depot
            </h2>
            <p className="text-xs text-brandText-secondary">
              Salt Lake Sector V Hub Cash Counter &bull; Open until 09:30 PM
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
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 text-base font-mono font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={(currentRider?.cashInHand || 0) <= 0}
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
    </div>
  );
};

export default RiderCashPage;
