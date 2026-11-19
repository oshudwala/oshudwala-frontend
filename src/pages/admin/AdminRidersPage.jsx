import React, { useState } from 'react';
import {
  Bike,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  DollarSign,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import MetricCard from '../../components/workspace/MetricCard';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';

export const AdminRidersPage = () => {
  const { riders, toggleRiderOnline } = useWorkspaceStore();
  const { addToast } = useToast();

  const activeRiders = riders.filter((r) => r.isOnline);
  const totalCashWithRiders = riders.reduce((sum, r) => sum + (r.cashInHand || 0), 0);

  const columns = [
    {
      header: 'Rider Name',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-secondary">{row.phone}</p>
        </div>
      ),
    },
    {
      header: 'Zone & Vehicle',
      key: 'zone',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-forest-800">{row.zone}</span>
          <p className="text-[11px] text-brandText-muted">{row.vehicle}</p>
        </div>
      ),
    },
    {
      header: 'Duty Status',
      key: 'isOnline',
      render: (row) => (
        <button
          onClick={() => {
            toggleRiderOnline(row.id, !row.isOnline);
            addToast(`${row.name} marked ${!row.isOnline ? 'Online' : 'Offline'}`, 'info');
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
            row.isOnline
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-gray-100 text-gray-600 border-gray-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${row.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
          <span>{row.isOnline ? 'Online & Available' : 'Offline'}</span>
        </button>
      ),
    },
    {
      header: 'Active Order',
      key: 'activeOrderId',
      render: (row) =>
        row.activeOrderId ? (
          <span className="font-mono text-xs font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded border border-forest-100">
            {row.activeOrderId}
          </span>
        ) : (
          <span className="text-xs text-brandText-muted">Idle</span>
        ),
    },
    {
      header: 'COD Cash in Hand',
      key: 'cashInHand',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-emerald-800">
          ₹{(row.cashInHand || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Rating / Trips',
      key: 'rating',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-xs text-amber-700 flex items-center justify-end gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{row.rating}</span>
          </span>
          <span className="text-[10px] text-brandText-muted">{row.deliveriesToday} trips today</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Rider Fleet Dispatch Desk
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Monitor real-time delivery rider locations, shift statuses, and COD cash balances.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Active Riders Online"
          value={`${activeRiders.length} / ${riders.length}`}
          change="Real-time"
          trend="up"
          caption="ready for dispatch"
          icon={Bike}
          colorScheme="emerald"
        />
        <MetricCard
          title="Total Cash with Riders"
          value={`₹${totalCashWithRiders.toFixed(2)}`}
          change="Pending Remittance"
          trend="neutral"
          caption="Kolkata fleet COD"
          icon={DollarSign}
          colorScheme="amber"
        />
        <MetricCard
          title="Avg Delivery Time"
          value="24 mins"
          change="-4 mins"
          trend="up"
          caption="within SLA"
          icon={Clock}
          colorScheme="blue"
        />
      </div>

      <DataTable
        columns={columns}
        data={riders}
        searchKey="name"
        searchPlaceholder="Search rider by name, phone, zone..."
      />
    </div>
  );
};

export default AdminRidersPage;
