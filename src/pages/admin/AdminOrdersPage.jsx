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
  Calendar,
  Tag,
  Receipt,
  Sparkles,
  Filter,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Drawer from '../../components/workspace/Drawer';
import ConfirmationModal from '../../components/workspace/ConfirmationModal';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { calculateOrderBill } from '../../services/pricingRules';

export const AdminOrdersPage = () => {
  const { orders, riders, updateOrderStatus, assignRider } = useWorkspaceStore();
  const { addToast } = useToast();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState('');

  // Date Filtering State (Requirement 3)
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [customDate, setCustomDate] = useState('');

  const filterOptions = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Preparing', value: 'PREPARING' },
    { label: 'Ready for Pickup', value: 'READY_FOR_PICKUP' },
    { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', value: 'DELIVERED' },
  ];

  // Apply Date Filtering
  const todayStr = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  const filteredOrders = orders.filter((order) => {
    if (dateFilter === 'all') return true;
    const orderDate = new Date(order.createdAt || Date.now());

    if (dateFilter === 'today') return orderDate.toDateString() === todayStr;
    if (dateFilter === 'yesterday') return orderDate.toDateString() === yesterdayStr;
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return orderDate >= weekAgo;
    }
    if (dateFilter === 'month') {
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'custom' && customDate) {
      return orderDate.toISOString().split('T')[0] === customDate;
    }
    return true;
  });

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

      {/* Date Filter & Control Strip (Requirement 3) */}
      <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-forest-900 flex items-center gap-1.5 mr-1">
            <Calendar className="w-3.5 h-3.5 text-forest-600" />
            <span>Filter by Date:</span>
          </span>

          <div className="inline-flex rounded-xl p-1 bg-surface-warm border border-brandBorder-subtle text-xs font-semibold">
            {[
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month' },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  setDateFilter(btn.id);
                  setCustomDate('');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === btn.id && !customDate
                    ? 'bg-forest-700 text-white shadow-sm font-bold'
                    : 'text-brandText-secondary hover:text-forest-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-surface-warm px-2.5 py-1 rounded-xl border border-brandBorder-subtle">
            <span className="text-[11px] text-brandText-secondary font-medium">Custom:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDateFilter('custom');
              }}
              className="bg-transparent text-xs font-semibold text-forest-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="text-xs text-brandText-secondary">
          Showing <strong className="text-forest-900">{filteredOrders.length}</strong> of {orders.length} total orders
        </div>
      </div>

      {/* Main Orders Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
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

            {/* Bill Breakdown (Requirement 3) */}
            {(() => {
              const bill = calculateOrderBill({
                items: selectedOrder.items,
                customSubtotal: selectedOrder.totalMrp || selectedOrder.subtotal || selectedOrder.total,
                deliveryFee: selectedOrder.deliveryFee,
              });
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-xs text-forest-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-forest-600" />
                      <span>Itemized Bill Breakdown</span>
                    </h3>
                    <span className="text-[10px] font-mono text-brandText-secondary uppercase">
                      Rule Engine Verified
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-brandText-secondary">
                      <span>Total MRP / Subtotal:</span>
                      <span>₹{bill.totalMrp.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>
                        {bill.isHighValueTier
                          ? 'High-Value Tier Discount (18%):'
                          : `Platform Discount (${bill.discountPercent}%):`}
                      </span>
                      <span>-₹{bill.discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-brandText-secondary">
                      <span>Packaging Charges (Fixed):</span>
                      <span>+₹{bill.packagingFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-brandText-secondary">
                      <span>Platform Fee (Tiered):</span>
                      <span>+₹{bill.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-brandText-secondary">
                      <span>Delivery Charges:</span>
                      <span>{bill.deliveryFee > 0 ? `+₹${bill.deliveryFee.toFixed(2)}` : 'FREE'}</span>
                    </div>
                    {bill.cashback > 0 && (
                      <div className="flex justify-between text-emerald-800 font-bold bg-emerald-100/70 p-1.5 rounded-lg text-[10px]">
                        <span>Wallet Cashback (2% credited to patient):</span>
                        <span>+₹{bill.cashback.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-brandBorder-subtle pt-2 flex justify-between font-bold text-forest-900 text-sm">
                      <span>NET AMOUNT PAYABLE:</span>
                      <span className="text-forest-800">₹{bill.finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-brandText-secondary pt-1 border-t border-dashed border-brandBorder-subtle font-sans">
                      <span>Payment Mode: <strong>{selectedOrder.paymentMethod || 'COD'}</strong></span>
                      <span>Status: <strong className="text-forest-700">{selectedOrder.paymentStatus || 'PENDING'}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })()}

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
