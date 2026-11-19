import React from 'react';
import { History, CheckCircle, MapPin, Building2, Clock } from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';

export const RiderHistoryPage = () => {
  const { orders } = useWorkspaceStore();
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED');

  const columns = [
    {
      header: 'Trip ID',
      key: 'id',
      render: (row) => <span className="font-mono font-bold text-xs text-forest-800">{row.id}</span>,
    },
    {
      header: 'Delivered To',
      key: 'customerName',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.customerName}</p>
          <p className="text-[11px] text-brandText-secondary">{row.area}</p>
        </div>
      ),
    },
    {
      header: 'Pharmacy Picked From',
      key: 'pharmacyName',
      render: (row) => <span className="text-xs text-brandText-main">{row.pharmacyName}</span>,
    },
    {
      header: 'Cash / COD Collected',
      key: 'total',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-mono font-bold text-xs text-forest-900">₹{row.total.toFixed(2)}</span>
          <p className="text-[10px] text-emerald-700 font-bold uppercase">{row.paymentMethod}</p>
        </div>
      ),
    },
    {
      header: 'Trip Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Completed Delivery Trips
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          History of all successfully handed-over medicine packages and collected cash.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={completedOrders}
        searchKey="customerName"
        searchPlaceholder="Search trip history..."
      />
    </div>
  );
};

export default RiderHistoryPage;
