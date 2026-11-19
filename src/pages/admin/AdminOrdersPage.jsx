import React, { useState } from 'react';
import {
  ShoppingBag,
  Bike,
  User,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  FileText,
  Building2,
  Printer,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Drawer from '../../components/workspace/Drawer';
import ConfirmationModal from '../../components/workspace/ConfirmationModal';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const AdminOrdersPage = () => {
  const { orders, riders, updateOrderStatus, assignRider } = useWorkspaceStore();
  const { addToast } = useToast();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState('');

  const filterOptions = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Preparing', value: 'PREPARING' },
    { label: 'Ready for Pickup', value: 'READY_FOR_PICKUP' },
    { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', value: 'DELIVERED' },
  ];

  const handleAssignRiderSubmit = () => {
    if (!selectedRiderId || !selectedOrder) return;
    const rider = riders.find((r) => r.id === selectedRiderId);
    if (!rider) return;

    assignRider(selectedOrder.id, rider);
    addToast(`Assigned Order ${selectedOrder.id} to rider ${rider.name}`, 'success');
    setIsAssignModalOpen(false);
    setSelectedOrder((prev) => (prev ? { ...prev, assignedRider: rider } : null));
  };

  const columns = [
    {
      header: 'Order ID',
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
      header: 'Customer',
      key: 'customerName',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.customerName}</p>
          <p className="text-[11px] text-brandText-secondary">{row.customerPhone}</p>
        </div>
      ),
    },
    {
      header: 'Location / Area',
      key: 'area',
      render: (row) => (
        <span className="text-xs text-brandText-secondary line-clamp-1">{row.area}</span>
      ),
    },
    {
      header: 'Fulfillment Pharmacy',
      key: 'pharmacyName',
      render: (row) => (
        <span className="text-xs font-medium text-forest-700">{row.pharmacyName}</span>
      ),
    },
    {
      header: 'Assigned Rider',
      key: 'assignedRider',
      render: (row) =>
        row.assignedRider ? (
          <div className="flex items-center gap-1.5 text-xs text-forest-800 font-medium">
            <Bike className="w-3.5 h-3.5 text-forest-600" />
            <span>{row.assignedRider.name}</span>
          </div>
        ) : (
          <span className="text-[11px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">
            Unassigned
          </span>
        ),
    },
    {
      header: 'Total Amount',
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
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Platform Orders Directory
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Monitor, assign riders, and update medicine delivery orders across all zones.
          </p>
        </div>
      </div>

      {/* Main Orders Table */}
      <DataTable
        columns={columns}
        data={orders}
        searchKey="customerName"
        searchPlaceholder="Search by customer name, phone, order ID..."
        filterOptions={filterOptions}
        filterKey="status"
        onRowClick={(row) => setSelectedOrder(row)}
      />

      {/* Deep Inspection Drawer */}
      <Drawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details: ${selectedOrder?.id}`}
        subtitle={`Placed on ${new Date(selectedOrder?.createdAt || Date.now()).toLocaleDateString('en-IN')}`}
        footer={
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                window.print();
              }}
              className="px-3 py-2 border border-brandBorder-subtle rounded-xl text-xs font-bold text-forest-800 hover:bg-forest-50 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-forest-600" />
              <span>Print Invoice</span>
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssignModalOpen(true)}
                className="text-xs"
              >
                Assign / Reassign Rider
              </Button>
            </div>
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status & Quick Overview */}
            <div className="p-4 rounded-2xl bg-forest-50/60 border border-forest-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-forest-800 tracking-wider">
                  Current Status
                </p>
                <div className="mt-1">
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-forest-800 tracking-wider">
                  Total Billable
                </p>
                <p className="text-lg font-extrabold text-forest-900">
                  ₹{selectedOrder.total.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Verification Security Codes */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-surface-warm rounded-2xl border border-brandBorder-subtle text-xs">
              <div>
                <p className="text-[10px] font-bold text-brandText-secondary uppercase">
                  Pharmacy Pickup QR Code
                </p>
                <p className="font-mono font-bold text-forest-800 mt-0.5">
                  {selectedOrder.pickupQrCode}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-brandText-secondary uppercase">
                  Customer Delivery OTP
                </p>
                <p className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
                  {selectedOrder.deliveryOtp}
                </p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-2">
              <h3 className="font-heading font-bold text-xs text-forest-900 uppercase tracking-wider">
                Customer & Delivery Address
              </h3>
              <div className="p-3.5 rounded-xl border border-brandBorder-subtle bg-surface-pure space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-forest-900">
                  <User className="w-3.5 h-3.5 text-forest-600" />
                  <span>{selectedOrder.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-brandText-secondary">
                  <Phone className="w-3.5 h-3.5 text-brandText-muted" />
                  <span>{selectedOrder.customerPhone}</span>
                </div>
                <div className="flex items-start gap-2 text-brandText-secondary pt-1">
                  <MapPin className="w-3.5 h-3.5 text-brandText-muted flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{selectedOrder.address}</p>
                    <p className="text-[11px] text-brandText-muted mt-0.5">
                      Landmark: {selectedOrder.landmark} &bull; {selectedOrder.area}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fulfillment Pharmacy & Rider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-brandBorder-subtle bg-surface-pure space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-forest-800 font-bold">
                  <Building2 className="w-3.5 h-3.5 text-forest-600" />
                  <span>Fulfillment Pharmacy</span>
                </div>
                <p className="font-semibold text-brandText-main">{selectedOrder.pharmacyName}</p>
                <p className="text-[11px] text-brandText-secondary">
                  {selectedOrder.pharmacyAddress}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-brandBorder-subtle bg-surface-pure space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-forest-800 font-bold">
                  <Bike className="w-3.5 h-3.5 text-forest-600" />
                  <span>Dispatch Rider</span>
                </div>
                {selectedOrder.assignedRider ? (
                  <>
                    <p className="font-semibold text-brandText-main">
                      {selectedOrder.assignedRider.name}
                    </p>
                    <p className="text-[11px] text-brandText-secondary">
                      {selectedOrder.assignedRider.vehicle}
                    </p>
                  </>
                ) : (
                  <p className="text-amber-700 font-medium">No rider assigned yet</p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <h3 className="font-heading font-bold text-xs text-forest-900 uppercase tracking-wider">
                Order Items ({selectedOrder.items.length})
              </h3>
              <div className="border border-brandBorder-subtle rounded-xl overflow-hidden divide-y divide-brandBorder-subtle text-xs">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-forest-900">{item.name}</p>
                      <p className="text-[11px] text-brandText-muted">
                        {item.form} &bull; Qty: {item.qty}
                      </p>
                    </div>
                    <span className="font-bold text-forest-800">
                      ₹{(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="space-y-2">
              <h3 className="font-heading font-bold text-xs text-forest-900 uppercase tracking-wider">
                Progression Timeline
              </h3>
              <div className="border border-brandBorder-subtle rounded-xl p-4 bg-surface-pure space-y-3">
                {selectedOrder.timeline.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step.completed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {step.completed ? '✓' : idx + 1}
                    </span>
                    <span
                      className={`font-medium ${
                        step.completed ? 'text-forest-900 font-bold' : 'text-brandText-muted'
                      }`}
                    >
                      {step.status}
                    </span>
                    <span className="ml-auto text-[11px] text-brandText-muted">{step.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Assign Rider Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setIsAssignModalOpen(false)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-md w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-5">
            <div>
              <h3 className="font-heading font-bold text-lg text-forest-900">
                Dispatch Order to Rider
              </h3>
              <p className="text-xs text-brandText-secondary mt-0.5">
                Assign Order {selectedOrder?.id} to an active delivery partner in Kolkata.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-forest-800">Select Available Rider</label>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {riders.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedRiderId === r.id
                        ? 'border-forest-600 bg-forest-50/80 shadow-sm'
                        : 'border-brandBorder-subtle hover:bg-forest-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="riderChoice"
                        value={r.id}
                        checked={selectedRiderId === r.id}
                        onChange={() => setSelectedRiderId(r.id)}
                        className="text-forest-600 focus:ring-forest-500"
                      />
                      <div>
                        <p className="font-bold text-forest-900">{r.name}</p>
                        <p className="text-[11px] text-brandText-secondary">
                          {r.zone} &bull; {r.vehicle}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.isOnline
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {r.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedRiderId}
                onClick={handleAssignRiderSubmit}
                className="text-xs px-5"
              >
                Confirm Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
