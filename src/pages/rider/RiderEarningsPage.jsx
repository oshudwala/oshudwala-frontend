import React from 'react';
import { Wallet, TrendingUp, ArrowDownLeft, Gift, ShieldCheck } from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const RiderEarningsPage = () => {
  const { addToast } = useToast();

  const handleWithdrawal = () => {
    addToast('Instant payout request of ₹2,450.00 initiated to linked UPI (rahul@upi)!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Rider Earnings & Instant Payouts
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Track trip delivery fees, high-speed delivery incentives, customer tips, and bank withdrawals.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Withdrawable Balance"
          value="₹2,450.00"
          change="Available Now"
          trend="up"
          icon={Wallet}
          colorScheme="emerald"
        />
        <MetricCard
          title="Today's Earnings"
          value="₹840.00"
          change="+₹120 Peak Bonus"
          trend="up"
          icon={TrendingUp}
          colorScheme="forest"
        />
        <MetricCard
          title="Customer Tips"
          value="₹140.00"
          change="100% credited"
          trend="up"
          icon={Gift}
          colorScheme="blue"
        />
      </div>

      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base text-forest-900">Linked Payout Account</h3>
            <p className="text-xs text-brandText-secondary">Direct Bank Transfer or Instant UPI</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
            Verified
          </span>
        </div>

        <div className="p-4 bg-surface-warm rounded-2xl border border-brandBorder-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-forest-900">State Bank of India &bull; UPI: rahul.das@oksbi</p>
            <p className="text-brandText-muted">A/C: *******8821 &bull; IFSC: SBIN0001234</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleWithdrawal}
            className="text-xs font-bold px-5"
          >
            Withdraw to UPI (₹2,450)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RiderEarningsPage;
