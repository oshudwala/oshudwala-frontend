import React from 'react';
import { DollarSign, Wallet, ArrowDownRight, ArrowUpRight, Building2, Bike, ShieldCheck } from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';

export const AdminFinancePage = () => {
  const settlements = [
    { id: 'SET-9901', beneficiary: 'MedPlus Pharmacy - Sector V', type: 'PHARMACY_PAYOUT', amount: 48520.0, commissionDeducted: 7278.0, netPayout: 41242.0, status: 'COMPLETED', date: '18 Nov 2026', method: 'NEFT / Bank Transfer' },
    { id: 'SET-9902', beneficiary: 'Wellness Forever - Golpark', type: 'PHARMACY_PAYOUT', amount: 32150.0, commissionDeducted: 4822.5, netPayout: 27327.5, status: 'COMPLETED', date: '18 Nov 2026', method: 'NEFT / Bank Transfer' },
    { id: 'SET-9903', beneficiary: 'Rahul Das (Rider Fleet)', type: 'RIDER_PAYOUT', amount: 3450.0, commissionDeducted: 0.0, netPayout: 3450.0, status: 'COMPLETED', date: '19 Nov 2026', method: 'UPI (rahul@upi)' },
    { id: 'SET-9904', beneficiary: 'Sourav Mondal (Rider Fleet)', type: 'RIDER_PAYOUT', amount: 2890.0, commissionDeducted: 0.0, netPayout: 2890.0, status: 'PENDING', date: '19 Nov 2026', method: 'UPI (sourav@upi)' },
  ];

  const columns = [
    {
      header: 'Settlement Ref',
      key: 'id',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-forest-800">{row.id}</span>
          <p className="text-[10px] text-brandText-muted">{row.date}</p>
        </div>
      ),
    },
    {
      header: 'Beneficiary Entity',
      key: 'beneficiary',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.beneficiary}</p>
          <span className="text-[10px] text-brandText-secondary uppercase">{row.type.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      header: 'Gross Order Value',
      key: 'amount',
      render: (row) => <span className="font-mono text-xs">₹{row.amount.toFixed(2)}</span>,
    },
    {
      header: 'Platform Fee (15%)',
      key: 'commissionDeducted',
      render: (row) => <span className="font-mono text-xs text-forest-700 font-semibold">₹{row.commissionDeducted.toFixed(2)}</span>,
    },
    {
      header: 'Net Disbursed',
      key: 'netPayout',
      align: 'right',
      render: (row) => <span className="font-mono font-extrabold text-xs text-forest-900">₹{row.netPayout.toFixed(2)}</span>,
    },
    {
      header: 'Payout Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Financial Settlements & Platform Commissions
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Settlement ledger for pharmacy merchant payouts, rider disbursements, and platform margins.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Platform Take Rate"
          value="15.0%"
          change="Standard Margin"
          trend="neutral"
          icon={Wallet}
          colorScheme="forest"
        />
        <MetricCard
          title="Total Disbursed This Week"
          value="₹74,909.50"
          change="+12.3%"
          trend="up"
          icon={ArrowUpRight}
          colorScheme="emerald"
        />
        <MetricCard
          title="Next Scheduled Payout"
          value="Friday, 4:00 PM"
          change="Automated NEFT"
          trend="neutral"
          icon={ShieldCheck}
          colorScheme="blue"
        />
      </div>

      <DataTable
        columns={columns}
        data={settlements}
        searchKey="beneficiary"
        searchPlaceholder="Search settlements by beneficiary or ref ID..."
      />
    </div>
  );
};

export default AdminFinancePage;
