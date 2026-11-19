import React, { useState } from 'react';
import { Coins, CheckCircle, Shield, ArrowUpRight, User, Bike } from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import DataTable from '../../components/workspace/DataTable';
import ConfirmationModal from '../../components/workspace/ConfirmationModal';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const AdminCashCollectionPage = () => {
  const { riders, reconcileCash } = useWorkspaceStore();
  const { addToast } = useToast();

  const [selectedRider, setSelectedRider] = useState(null);
  const [reconcileAmount, setReconcileAmount] = useState('');

  const totalOutstandingCash = riders.reduce((acc, r) => acc + (r.cashInHand || 0), 0);
  const totalRemittedToday = riders.reduce((acc, r) => acc + (r.cashRemittedToday || 0), 0);

  const handleConfirmReconcile = () => {
    if (!selectedRider) return;
    const amount = Number(reconcileAmount) || selectedRider.cashInHand;
    reconcileCash(selectedRider.id, amount);
    addToast(`Reconciled ₹${amount.toFixed(2)} from ${selectedRider.name}`, 'success');
    setSelectedRider(null);
    setReconcileAmount('');
  };

  const columns = [
    {
      header: 'Rider Partner',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-secondary">{row.phone} &bull; {row.zone}</p>
        </div>
      ),
    },
    {
      header: 'Pending Cash In Hand',
      key: 'cashInHand',
      render: (row) => (
        <span className="font-mono font-extrabold text-sm text-forest-900">
          ₹{(row.cashInHand || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Remitted Today',
      key: 'cashRemittedToday',
      render: (row) => (
        <span className="font-mono font-semibold text-xs text-emerald-700">
          ₹{(row.cashRemittedToday || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) =>
        (row.cashInHand || 0) > 0 ? (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Pending Deposit
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Reconciled
          </span>
        ),
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          disabled={(row.cashInHand || 0) <= 0}
          onClick={() => {
            setSelectedRider(row);
            setReconcileAmount(String(row.cashInHand));
          }}
          className="text-xs py-1"
        >
          Collect / Deposit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Cash on Delivery (COD) Reconciliation
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Audit and record cash deposits collected by delivery partners across Kolkata zones.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Cash Outstanding"
          value={`₹${totalOutstandingCash.toFixed(2)}`}
          change="Awaiting Deposit"
          trend="neutral"
          icon={Coins}
          colorScheme="amber"
        />
        <MetricCard
          title="Remitted to Bank Today"
          value={`₹${totalRemittedToday.toFixed(2)}`}
          change="Deposited"
          trend="up"
          icon={CheckCircle}
          colorScheme="emerald"
        />
        <MetricCard
          title="Reconciliation Rate"
          value="98.2%"
          change="Audit Passed"
          trend="up"
          icon={Shield}
          colorScheme="forest"
        />
      </div>

      <DataTable
        columns={columns}
        data={riders}
        searchKey="name"
        searchPlaceholder="Filter by rider name..."
      />

      {/* Reconcile Modal */}
      {selectedRider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setSelectedRider(null)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-sm w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4">
            <h3 className="font-heading font-bold text-base text-forest-900">
              Reconcile Cash Deposit
            </h3>
            <p className="text-xs text-brandText-secondary">
              Record verified physical cash deposit from <strong>{selectedRider.name}</strong>.
            </p>
            <div>
              <label className="text-xs font-bold text-forest-800">Deposit Amount (₹)</label>
              <input
                type="number"
                value={reconcileAmount}
                onChange={(e) => setReconcileAmount(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-mono font-bold bg-surface-warm focus:outline-none focus:border-forest-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRider(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReconcile}
                className="text-xs"
              >
                Confirm Deposit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCashCollectionPage;
