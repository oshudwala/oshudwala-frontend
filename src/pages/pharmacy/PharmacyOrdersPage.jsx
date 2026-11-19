import React, { useState } from 'react';
import {
  ShoppingBag,
  Package,
  Printer,
  CheckCircle,
  Clock,
  QrCode,
  Bike,
  User,
  ArrowRight,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Drawer from '../../components/workspace/Drawer';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const PharmacyOrdersPage = () => {
  const { orders, updateOrderStatus } = useWorkspaceStore();
  const { addToast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filterOptions = [
    { label: 'Preparing', value: 'PREPARING' },
    { label: 'Ready for Pickup', value: 'READY_FOR_PICKUP' },
    { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', value: 'DELIVERED' },
  ];

  const handleAdvanceStatus = (order, targetStatus) => {
    updateOrderStatus(order.id, targetStatus);
    addToast(`Order ${order.id} status updated to ${targetStatus.replace(/_/g, ' ')}!`, 'success');
    setSelectedOrder(null);
  };

  const columns = [
    {
      header: 'Order Ref',
      key: 'id',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-forest-800">{row.id}</span>
          <p className="text-[10px] text-brandText-muted">
            {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      header: 'Patient / Customer',
      key: 'customerName',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.customerName}</p>
          <p className="text-[11px] text-brandText-secondary">{row.customerPhone}</p>
        </div>
      ),
    },
    {
      header: 'Prescription / Items',
      key: 'items',
      render: (row) => (
        <span className="text-xs font-medium text-forest-800">
          {row.items.length} items ({row.items.map((i) => i.name).slice(0, 2).join(', ')}...)
        </span>
      ),
    },
    {
      header: 'Assigned Rider',
      key: 'assignedRider',
      render: (row) =>
        row.assignedRider ? (
          <div className="flex items-center gap-1.5 text-xs text-forest-800 font-semibold">
            <Bike className="w-3.5 h-3.5 text-forest-600" />
            <span>{row.assignedRider.name}</span>
          </div>
        ) : (
          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">
            Rider Dispatched
          </span>
        ),
    },
    {
      header: 'Amount',
      key: 'total',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-xs text-forest-900">₹{row.total.toFixed(2)}</span>
          <p className="text-[10px] text-brandText-muted uppercase">{row.paymentMethod}</p>
        </div>
      ),
    },
    {
      header: 'Workflow Stage',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Dispensation & Packing Queue
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Assemble medicines, verify batch expiry, apply tamper-proof packaging, and stage for pickup.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        searchKey="customerName"
        searchPlaceholder="Search order by customer or ID..."
        filterOptions={filterOptions}
        filterKey="status"
        onRowClick={(row) => setSelectedOrder(row)}
      />

      {/* Drawer */}
      <Drawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Dispensation: ${selectedOrder?.id}`}
        subtitle={`Customer: ${selectedOrder?.customerName}`}
        footer={
          selectedOrder && (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 border border-brandBorder-subtle rounded-xl text-xs font-bold text-forest-800 hover:bg-forest-50 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-forest-600" />
                <span>Print Dispensing Slip</span>
              </button>

              {selectedOrder.status === 'PREPARING' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAdvanceStatus(selectedOrder, 'READY_FOR_PICKUP')}
                  className="text-xs font-bold px-4"
                >
                  Mark Packed & Ready
                </Button>
              )}
            </div>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-5 text-xs">
            <div className="p-3.5 bg-forest-50 rounded-2xl border border-forest-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-forest-800 uppercase">Pickup Security Code</p>
                <p className="font-mono font-extrabold text-base text-forest-900 mt-0.5">
                  {selectedOrder.pickupQrCode}
                </p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-forest-900 uppercase">Medicine Checklist</h3>
              <div className="divide-y divide-brandBorder-subtle border border-brandBorder-subtle rounded-xl">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-forest-900">{item.name}</p>
                      <p className="text-[11px] text-brandText-secondary">{item.form}</p>
                    </div>
                    <span className="font-mono font-bold text-forest-800">Qty: {item.qty}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-surface-warm rounded-xl border border-brandBorder-subtle space-y-1">
              <p className="font-bold text-forest-900">Delivery Instructions:</p>
              <p className="text-brandText-secondary">{selectedOrder.address}</p>
              <p className="text-brandText-muted">Landmark: {selectedOrder.landmark}</p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default PharmacyOrdersPage;
