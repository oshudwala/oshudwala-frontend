import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  AlertCircle,
  Download,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Drawer from '../../components/workspace/Drawer';
import ConfirmationModal from '../../components/workspace/ConfirmationModal';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { calculatePlatformFee } from '../../services/pricingRules';
import { deliveryApi } from '../../services/api/delivery.api';
import { orderApi } from '../../services/api/order.api';
import apiClient from '../../services/api/client';

export const AdminOrdersPage = () => {
  const { assignRider: storeAssignRider } = useWorkspaceStore();
  const { addToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState('');

  // Date Filtering State
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [customDate, setCustomDate] = useState('');

  const filterOptions = [
    { label: 'Pending Review', value: 'PENDING_PHARMACY_REVIEW' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Preparing', value: 'PREPARING' },
    { label: 'Ready for Pickup', value: 'READY_FOR_PICKUP' },
    { label: 'Rider Assigned', value: 'RIDER_ASSIGNED' },
    { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  // Fetch real orders and real riders from backend
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, ridersRes] = await Promise.allSettled([
        orderApi.getPharmacyOrders(),
        apiClient.get('/riders'),
      ]);

      if (ordersRes.status === 'fulfilled') {
        const rawOrders = Array.isArray(ordersRes.value)
          ? ordersRes.value
          : ordersRes.value?.orders || [];

        const normalized = rawOrders.map((o) => {
          const subtotal = (o.subtotalPaise || 0) / 100;
          const discount = (o.couponDiscountPaise || 0) / 100;
          const packagingFee = (o.packagingFeePaise || 0) / 100;
          const platformFee =
            (o.platformFeePaise || 0) / 100 || (subtotal > 0 ? calculatePlatformFee(subtotal) : 0);
          const deliveryFee =
            (o.deliveryFeePaise || 0) / 100 || (subtotal > 0 && subtotal < 499 ? 30 : 0);
          const total = (o.totalPaise || 0) / 100 || subtotal - discount + packagingFee + platformFee + deliveryFee;

          const addr = o.deliveryAddress || {};
          const fullAddress = [addr.line1, addr.area, addr.city, addr.pincode]
            .filter(Boolean)
            .join(', ');

          const riderObj = o.delivery?.rider
            ? {
                id: o.delivery.rider.id,
                name: o.delivery.rider.fullName || 'Assigned Rider',
                phone: o.delivery.rider.phone || '',
              }
            : null;

          const itemsList = (o.items || []).map((it) => ({
            id: it.id,
            name: it.nameSnapshot || it.name || 'Medicine Item',
            qty: Number(it.quantity) || 1,
            price: (it.unitPricePaise || it.mrpPaise || 0) / 100,
            form: 'Strip / Unit',
          }));

          return {
            id: o.orderNumber || o.id,
            backendId: o.id,
            customerName: addr.fullName || o.patient?.fullName || 'Walk-in Customer',
            customerPhone: addr.phone || o.patient?.phone || 'Not Specified',
            area: addr.area || addr.line1 || 'Kolkata Central & Suburban',
            address: fullAddress || 'Direct Dispatch / Counter Pickup',
            landmark: addr.landmark || 'Near Center',
            pharmacyName: o.pharmacy?.name || 'Primary Medicine Hub',
            pharmacyAddress: 'Kolkata Dispensary Hub',
            assignedRider: riderObj,
            pickupQrCode: o.delivery?.qrToken || (o.status === 'READY_FOR_PICKUP' ? 'READY_FOR_PICKUP' : null),
            deliveryOtp: 'Verified on Handover',
            items: itemsList,
            totalMrp: subtotal,
            subtotal,
            discount,
            packagingFee: packagingFee || 15,
            platformFee,
            deliveryFee,
            total,
            status: o.status,
            paymentMethod: o.paymentMethod || 'COD',
            paymentStatus: o.paymentStatus || 'PENDING',
            createdAt: o.placedAt || o.createdAt,
            timeline: [
              {
                status: 'Order Placed & Registered',
                time: new Date(o.placedAt || o.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                completed: true,
              },
              {
                status: 'Pharmacy Stock Verified & Packed',
                time: ['READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(
                  o.status
                )
                  ? 'Completed'
                  : 'Pending',
                completed: ['READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(
                  o.status
                ),
              },
              {
                status: 'Rider Assigned & Ready for Pickup',
                time: ['RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)
                  ? riderObj?.name ? `Assigned to ${riderObj.name}` : 'Assigned'
                  : 'Pending',
                completed: ['RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status),
              },
              {
                status: 'Delivered to Customer Doorstep',
                time: o.status === 'DELIVERED' ? 'Delivered' : 'Pending',
                completed: o.status === 'DELIVERED',
              },
            ],
          };
        });

        setOrders(normalized);
      }

      if (ridersRes.status === 'fulfilled') {
        const rawRiders = ridersRes.value.data?.data || ridersRes.value.data || [];
        const normalizedRiders = (Array.isArray(rawRiders) ? rawRiders : []).map((r) => ({
          id: r.user?.id || r.userId || r.id,
          profileId: r.id,
          name: r.user?.fullName || r.fullName || 'Delivery Partner',
          phone: r.user?.phone || r.phone || '',
          email: r.user?.email || r.email || '',
          zone: r.zone || 'Kolkata City & Suburbs',
          vehicle: r.vehicleType
            ? `${r.vehicleType} (${r.vehicleNumber || 'Registered'})`
            : 'Two-Wheeler Delivery Partner',
          isOnline: r.status === 'AVAILABLE' || r.status === 'ACTIVE' || r.isOnline !== false,
          status: r.status,
          kycStatus: r.kycStatus || 'APPROVED',
        }));
        setRiders(normalizedRiders);
      }
    } catch (err) {
      console.warn('Admin orders & riders fetch notice:', err.message);
      addToast('Could not sync orders from server. Showing cached view.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleAssignRiderSubmit = async () => {
    if (!selectedRiderId || !selectedOrder) return;
    const rider = riders.find((r) => r.id === selectedRiderId);
    if (!rider) return;

    setIsAssigning(true);
    try {
      // Call backend POST /deliveries/assign to automatically generate and save pickup QR in DB
      const result = await deliveryApi.assignDeliveries(rider.id, [
        selectedOrder.backendId || selectedOrder.id,
      ]);
      const backendQr = result?.pickupQrs?.[0]?.qrToken || result?.deliveries?.[0]?.qrToken || null;

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id || o.backendId === selectedOrder.backendId
            ? {
                ...o,
                status: 'RIDER_ASSIGNED',
                assignedRider: rider,
                pickupQrCode: backendQr || o.pickupQrCode,
                timeline: o.timeline.map((step, idx) =>
                  idx === 2 ? { ...step, completed: true, time: `Assigned to ${rider.name}` } : step
                ),
              }
            : o
        )
      );

      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: 'RIDER_ASSIGNED',
              assignedRider: rider,
              pickupQrCode: backendQr || prev.pickupQrCode,
            }
          : null
      );

      // Also sync workspace store
      storeAssignRider(selectedOrder.id, rider, backendQr);

      addToast(
        `Order ${selectedOrder.id} successfully assigned to ${rider.name}! Pickup QR token created & saved in DB.`,
        'success'
      );
      setIsAssignModalOpen(false);
      setSelectedRiderId('');
    } catch (err) {
      console.error('Assign rider error:', err);
      addToast(
        err.response?.data?.message || err.message || 'Failed to assign rider to this order',
        'error'
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDownloadInvoice = async (order) => {
    if (!order) return;
    try {
      await orderApi.downloadInvoicePdf(order.backendId || order.id, order.id);
      addToast(`Invoice PDF for Order ${order.id} downloaded successfully.`, 'success');
    } catch (err) {
      console.warn('Invoice download notice:', err.message);
      window.print();
    }
  };

  const columns = [
    {
      header: 'Order ID',
      key: 'id',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-forest-800">{row.id}</span>
          <p className="text-[10px] text-brandText-muted">
            {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull;{' '}
            {new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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
          <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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
            Monitor, assign riders, and manage medicine delivery orders across all zones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            isLoading={isLoading}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Orders</span>
          </Button>
        </div>
      </div>

      {/* Date Filter & Control Strip */}
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
          Showing <strong className="text-forest-900">{filteredOrders.length}</strong> of{' '}
          {orders.length} total orders
        </div>
      </div>

      {/* Main Orders Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        isLoading={isLoading}
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
        subtitle={`Placed on ${new Date(selectedOrder?.createdAt || Date.now()).toLocaleDateString(
          'en-IN',
          { day: 'numeric', month: 'short', year: 'numeric' }
        )}`}
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <button
              onClick={() => handleDownloadInvoice(selectedOrder)}
              className="px-3.5 py-2 border border-brandBorder-subtle rounded-xl text-xs font-bold text-forest-800 hover:bg-forest-50 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-forest-600" />
              <span>Download PDF Invoice</span>
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAssignModalOpen(true)}
                className="text-xs px-4"
              >
                <Bike className="w-3.5 h-3.5 mr-1.5" />
                <span>
                  {selectedOrder?.assignedRider ? 'Reassign Rider' : 'Assign Delivery Rider'}
                </span>
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
                <p className="font-mono font-bold text-forest-800 mt-0.5 break-all">
                  {selectedOrder.pickupQrCode || (
                    <span className="text-brandText-muted font-normal italic">
                      Generated upon rider assignment
                    </span>
                  )}
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
                      Area: {selectedOrder.area}
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
                      {selectedOrder.assignedRider.phone || 'Active Partner'}
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
                {selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
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
                  ))
                ) : (
                  <div className="p-4 text-center text-brandText-muted">
                    Prescription items verified by pharmacy
                  </div>
                )}
              </div>
            </div>

            {/* Bill Breakdown */}
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
                  <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount Applied:</span>
                    <span>-₹{selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-brandText-secondary">
                  <span>Packaging Charges (Fixed):</span>
                  <span>+₹{selectedOrder.packagingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brandText-secondary">
                  <span>Platform Fee (Tiered):</span>
                  <span>+₹{selectedOrder.platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brandText-secondary">
                  <span>Delivery Charges:</span>
                  <span>
                    {selectedOrder.deliveryFee > 0
                      ? `+₹${selectedOrder.deliveryFee.toFixed(2)}`
                      : 'FREE'}
                  </span>
                </div>
                <div className="border-t border-brandBorder-subtle pt-2 flex justify-between font-bold text-forest-900 text-sm">
                  <span>NET AMOUNT PAYABLE:</span>
                  <span className="text-forest-800">₹{selectedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-brandText-secondary pt-1 border-t border-dashed border-brandBorder-subtle font-sans">
                  <span>
                    Payment Mode: <strong>{selectedOrder.paymentMethod || 'COD'}</strong>
                  </span>
                  <span>
                    Status:{' '}
                    <strong className="text-forest-700">
                      {selectedOrder.paymentStatus || 'PENDING'}
                    </strong>
                  </span>
                </div>
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
                Assign Order <span className="font-mono font-bold text-forest-800">{selectedOrder?.id}</span> to an active delivery partner registered in the database.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-forest-800">
                Select Available Rider ({riders.length} registered)
              </label>

              {riders.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-center space-y-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 mx-auto" />
                  <p className="font-bold">No registered riders found in database.</p>
                  <p className="text-[11px]">
                    Create rider accounts in the Admin Staff Management tab to dispatch deliveries.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
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
                            {r.phone} &bull; {r.vehicle}
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
              )}
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
                disabled={!selectedRiderId || isAssigning}
                isLoading={isAssigning}
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
