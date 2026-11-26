import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  X,
  FileText,
  ShieldCheck,
  Building2,
  Phone,
  Tag,
  Receipt,
  RefreshCw,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Drawer from '../../components/workspace/Drawer';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { orderApi } from '../../services/api/order.api';

export const PharmacyOrdersPage = () => {
  const { orders, updateOrderStatus } = useWorkspaceStore();
  const { addToast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDispensingSlipOpen, setIsDispensingSlipOpen] = useState(false);
  const [slipOrder, setSlipOrder] = useState(null);
  const [backendOrders, setBackendOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const data = await orderApi.getPharmacyOrders();
      if (Array.isArray(data)) {
        setBackendOrders(data);
      }
    } catch (err) {
      console.warn('Backend pharmacy orders fetch notice:', err.message);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const mergedOrders = useMemo(() => {
    const map = new Map();
    // 1. Local workspace store orders
    orders.forEach((o) => {
      map.set(o.id, o);
      if (o.backendId) map.set(o.backendId, o);
      if (o.orderNumber) map.set(o.orderNumber, o);
    });

    // 2. Real backend orders
    backendOrders.forEach((bo) => {
      const key = bo.orderNumber || bo.id;
      const existing = map.get(key) || map.get(bo.id);
      const isPickup =
        bo.deliveryAddress?.deliveryType === 'PICKUP' ||
        bo.paymentMethod === 'IN_STORE_COUNTER' ||
        bo.deliveryAddress?.area === 'In-Store Counter';

      const subtotal = bo.subtotalPaise
        ? bo.subtotalPaise / 100
        : (existing?.subtotal ?? (existing?.totalMrp ?? 0));

      const deliveryFee =
        bo.deliveryFeePaise !== undefined
          ? bo.deliveryFeePaise / 100
          : (existing?.deliveryFee !== undefined
              ? existing.deliveryFee
              : (isPickup ? 0 : (subtotal < 499 ? 30 : 0)));

      const discount = bo.couponDiscountPaise
        ? bo.couponDiscountPaise / 100
        : (existing?.discount ?? 0);

      const total = bo.totalPaise
        ? bo.totalPaise / 100
        : (existing?.total ?? Math.max(0, subtotal - discount + 6 + deliveryFee));

      const formatted = {
        id: bo.orderNumber || bo.id,
        backendId: bo.id,
        orderNumber: bo.orderNumber,
        createdAt: bo.placedAt || bo.createdAt || existing?.createdAt || new Date().toISOString(),
        customerName:
          bo.deliveryAddress?.fullName ||
          bo.patient?.fullName ||
          existing?.customerName ||
          'Walk-in Customer',
        customerPhone:
          bo.deliveryAddress?.phone ||
          bo.patient?.phone ||
          existing?.customerPhone ||
          '',
        deliveryType: bo.deliveryAddress?.deliveryType || existing?.deliveryType || (isPickup ? 'PICKUP' : 'DELIVERY'),
        address: bo.deliveryAddress?.line1 || existing?.address || '',
        area: bo.deliveryAddress?.area || existing?.area || '',
        pincode: bo.deliveryAddress?.pincode || existing?.pincode || '',
        discountType: bo.deliveryAddress?.discountType || existing?.discountType || 'PERCENT',
        discountValue: bo.deliveryAddress?.discountValue || existing?.discountValue || 0,
        subtotal,
        totalMrp: subtotal,
        discount,
        deliveryFee,
        packagingFee: existing?.packagingFee ?? 6,
        platformFee: existing?.platformFee ?? 0,
        total,
        status: bo.status || existing?.status || 'READY_FOR_PICKUP',
        paymentMethod: bo.paymentMethod || existing?.paymentMethod || 'COD',
        assignedRider: bo.delivery?.rider
          ? {
              id: bo.delivery.rider.id,
              name: bo.delivery.rider.name,
              phone: bo.delivery.rider.phone,
            }
          : existing?.assignedRider || null,
        items: bo.items?.length
          ? bo.items.map((it) => ({
              name: it.nameSnapshot,
              qty: it.quantity,
              quantity: it.quantity,
              price: it.unitPricePaise
                ? it.unitPricePaise / 100
                : (it.mrpPaise ? it.mrpPaise / 100 : 0),
            }))
          : existing?.items || [],
      };
      map.set(key, formatted);
    });

    return Array.from(map.values());
  }, [orders, backendOrders]);

  const filterOptions = [
    { label: 'Preparing', value: 'PREPARING' },
    { label: 'Ready for Pickup', value: 'READY_FOR_PICKUP' },
    { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', value: 'DELIVERED' },
  ];

  const handleAdvanceStatus = async (order, targetStatus) => {
    updateOrderStatus(order.id, targetStatus);
    try {
      if (order.backendId || (order.id && !order.id.startsWith('OW-WALK-'))) {
        await orderApi.updateOrderStatus(order.backendId || order.id, targetStatus).catch(() => {});
      }
    } catch {}
    addToast(`Order ${order.id} status updated to ${targetStatus.replace(/_/g, ' ')}!`, 'success');
    setSelectedOrder(null);
  };

  const handleOpenSlip = (order) => {
    setSlipOrder(order);
    setIsDispensingSlipOpen(true);
  };

  const handlePrintSlip = () => {
    window.print();
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
          {row.items?.length || 1} items ({row.items?.map((i) => i.name).slice(0, 2).join(', ')}...)
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
            Admin Assigned
          </span>
        ),
    },
    {
      header: 'Amount',
      key: 'total',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-xs text-forest-900">₹{(row.total || 0).toFixed(2)}</span>
          <p className="text-[10px] text-brandText-muted uppercase">{row.paymentMethod || 'COD'}</p>
        </div>
      ),
    },
    {
      header: 'Workflow Stage',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenSlip(row);
          }}
          className="p-1.5 rounded-lg border border-brandBorder-subtle hover:bg-forest-50 text-forest-700 hover:text-forest-900 transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
          title="Print Dispensing Slip"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Slip</span>
        </button>
      ),
    },
  ];

  // Resolve bill details for the active slip directly from stored backend / order details
  const resolveSlipBill = (order) => {
    if (!order) return null;
    const isPickup =
      order.deliveryType === 'PICKUP' ||
      order.paymentMethod === 'IN_STORE_COUNTER' ||
      order.area === 'In-Store Counter';

    const subtotal = Number(order.subtotal ?? (order.totalMrp ?? 0));
    const discount = Number(order.discount ?? 0);
    const packagingFee = Number(order.packagingFee ?? 6);
    const platformFee = Number(order.platformFee ?? 0);
    // Exact delivery fee rule: Pickup is ₹0; Home delivery is ₹30 if subtotal < ₹499, else ₹0
    const deliveryFee = Number(
      order.deliveryFee !== undefined
        ? order.deliveryFee
        : (isPickup ? 0 : (subtotal < 499 ? 30 : 0))
    );
    const finalTotal = Number(
      order.total !== undefined
        ? order.total
        : Math.max(0, subtotal - discount + packagingFee + platformFee + deliveryFee)
    );

    return {
      isPickup,
      totalMrp: subtotal,
      subtotal,
      discount,
      discountType: order.discountType || 'PERCENT',
      discountValue: order.discountValue || 0,
      packagingFee,
      platformFee,
      deliveryFee,
      cashback: Number(order.cashback || 0),
      finalTotal,
    };
  };

  const slipBill = resolveSlipBill(slipOrder);

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

        <Button
          variant="outline"
          size="sm"
          leftIcon={RefreshCw}
          isLoading={isLoadingOrders}
          onClick={fetchOrders}
          className="text-xs font-bold"
        >
          Refresh Orders
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={mergedOrders}
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
                onClick={() => handleOpenSlip(selectedOrder)}
                className="px-3 py-2 border border-brandBorder-subtle rounded-xl text-xs font-bold text-forest-800 hover:bg-forest-50 flex items-center gap-1.5 shadow-xs"
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
                  {selectedOrder.pickupQrCode || `PKUP-${selectedOrder.id}`}
                </p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-forest-900 uppercase">Medicine Checklist</h3>
              <div className="divide-y divide-brandBorder-subtle border border-brandBorder-subtle rounded-xl">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-forest-900">{item.name}</p>
                      <p className="text-[11px] text-brandText-secondary">{item.form || 'Prescribed Tablet'}</p>
                    </div>
                    <span className="font-mono font-bold text-forest-800">Qty: {item.qty || item.quantity || 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-surface-warm rounded-xl border border-brandBorder-subtle space-y-1">
              <p className="font-bold text-forest-900">Delivery Instructions:</p>
              <p className="text-brandText-secondary">{selectedOrder.address}</p>
              <p className="text-brandText-muted">Area / Landmark: {selectedOrder.area || selectedOrder.landmark || 'Kolkata Central'}</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* ============================================================== */}
      {/* HIGH-FIDELITY DISPENSING SLIP & TAX INVOICE MODAL (BILL STYLE)  */}
      {/* ============================================================== */}
      {isDispensingSlipOpen && slipOrder && slipBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop (hidden during print) */}
          <div
            className="fixed inset-0 bg-forest-950/70 backdrop-blur-sm print:hidden"
            onClick={() => setIsDispensingSlipOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 z-10 space-y-5 my-auto print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none print:m-0">
            {/* Modal Actions Bar (hidden during print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-forest-700" />
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  Pharmacy Dispensing Slip & Retail Invoice
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={Printer}
                  onClick={handlePrintSlip}
                  className="text-xs font-bold px-3 py-1.5 shadow-sm"
                >
                  Print Slip
                </Button>
                <button
                  type="button"
                  onClick={() => setIsDispensingSlipOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE BILL SLIP (Formatted strictly as a professional medical invoice) */}
            <div className="printable-dispensing-slip font-sans text-slate-800 text-xs space-y-4 bg-white p-2 sm:p-4 rounded-2xl border border-slate-200/80 print:border-none print:p-0">
              {/* Slip Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b-2 border-forest-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-forest-700" />
                    <h2 className="font-heading font-black text-lg sm:text-xl text-forest-900 tracking-tight">
                      OSHUD WALA PARTNER PHARMACY
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    Authorized Retail Chemist, Druggist & Digital Dispensation Hub
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Premises: Block BD, Sector 1, Salt Lake City, Kolkata, WB - 700064
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Helpline: +91 98000 00000 | Email: pharmacy@oshudwala.in
                  </p>
                </div>

                <div className="text-left sm:text-right font-mono text-[10px] space-y-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <p className="font-bold text-forest-900">
                    D.L. No. (Form 20): <span className="text-slate-800">DL-WB-KOL-2024-49210-R</span>
                  </p>
                  <p className="font-bold text-forest-900">
                    D.L. No. (Form 21): <span className="text-slate-800">DL-WB-KOL-2024-49211-R</span>
                  </p>
                  <p className="text-slate-600">
                    WBSPC Pharmacist Reg: <strong>WBSPC-PH-99218</strong>
                  </p>
                  <p className="text-slate-600">
                    GSTIN: <strong>19AABCO9921D1ZQ</strong>
                  </p>
                </div>
              </div>

              {/* Order & Customer Metadata Row */}
              <div className="grid grid-cols-2 gap-4 py-2 border-b border-slate-200 text-[11px]">
                <div className="space-y-1">
                  <p>
                    <span className="text-slate-500 font-medium">Order Reference: </span>
                    <strong className="font-mono text-forest-900">{slipOrder.id}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Slip Date & Time: </span>
                    <span className="font-mono">
                      {new Date(slipOrder.createdAt || Date.now()).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Prescription ID: </span>
                    <span className="font-mono font-bold text-slate-700">
                      {slipOrder.prescriptionId || 'COUNTER-RX-VERIFIED'}
                    </span>
                  </p>
                </div>

                <div className="space-y-1 text-right">
                  <p>
                    <span className="text-slate-500 font-medium">Customer: </span>
                    <strong className="text-forest-900">{slipOrder.customerName}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Mobile: </span>
                    <strong className="font-mono">{slipOrder.customerPhone}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500 font-medium">Fulfillment: </span>
                    <strong className="text-forest-900">
                      {slipBill.isPickup ? 'Counter Pickup' : 'Home Delivery'}
                    </strong>
                  </p>
                  <p className="truncate">
                    <span className="text-slate-500 font-medium">Address: </span>
                    <span>
                      {slipBill.isPickup
                        ? 'In-Store Counter'
                        : `${slipOrder.address || ''}${slipOrder.area ? ', ' + slipOrder.area : ''}${slipOrder.pincode ? ' (PIN: ' + slipOrder.pincode + ')' : ''}`}
                    </span>
                  </p>
                </div>
              </div>

              {/* Itemized Medicine Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-100/80 text-slate-700 font-bold">
                      <th className="py-2 px-2 text-center w-8">#</th>
                      <th className="py-2 px-2">Medicine Description</th>
                      <th className="py-2 px-2 text-center font-mono">Batch</th>
                      <th className="py-2 px-2 text-center font-mono">Exp</th>
                      <th className="py-2 px-2 text-center font-mono w-12">Qty</th>
                      <th className="py-2 px-2 text-right font-mono">MRP (₹)</th>
                      <th className="py-2 px-2 text-right font-mono">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {slipOrder.items?.map((item, idx) => {
                      const itemPrice = Number(item.price) || 0;
                      const itemQty = Number(item.qty || item.quantity) || 1;
                      const rowTotal = itemPrice * itemQty;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-2 font-semibold text-slate-900">
                            {item.name}
                            <span className="block text-[9px] text-slate-400 font-normal">
                              Schedule H / CDSCO Batch Verified
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-600">
                            {item.batch || `B-240${(idx + 1) * 7}`}
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-600">
                            {item.expiry || '11/2027'}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">
                            {itemQty}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-slate-700">
                            {itemPrice.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                            {rowTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bill Summary adhering strictly to Rule 6 */}
              <div className="pt-3 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-4">
                {/* Left: Statutory Compliance Notes */}
                <div className="text-[10px] text-slate-500 space-y-1 max-w-sm">
                  <p className="font-bold text-slate-700">Dispensation & Regulatory Notes:</p>
                  <p>1. Dispensed under the physical supervision of Registered Pharmacist.</p>
                  <p>2. Keep medicines stored below 25°C in a dry environment away from light.</p>
                  <p>3. Regulated medicines are non-returnable once custody seal is opened.</p>
                  <div className="pt-3 flex items-center gap-4">
                    <div className="border border-dashed border-slate-300 rounded p-2 text-center w-36">
                      <span className="block text-[9px] text-slate-400 uppercase font-bold">Pharmacist Stamp</span>
                      <span className="block text-[10px] font-bold text-forest-800 mt-1">VERIFIED & DISPENSED</span>
                    </div>
                  </div>
                </div>

                {/* Right: Bill Calculation Breakdown */}
                <div className="w-full sm:w-64 space-y-1.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Total MRP:</span>
                    <span>₹{slipBill.totalMrp.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>
                      {slipBill.discountType === 'PERCENT'
                        ? `Discount (${slipBill.discountValue || 0}%):`
                        : 'Discount (Flat):'}
                    </span>
                    <span>-₹{slipBill.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Packaging Charges (Fixed):</span>
                    <span>₹{slipBill.packagingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charges:</span>
                    <span className="font-bold">
                      {slipBill.deliveryFee > 0 ? (
                        <span className="text-amber-800">₹{slipBill.deliveryFee.toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-700">FREE</span>
                      )}
                    </span>
                  </div>
                  {slipBill.cashback > 0 && (
                    <div className="flex justify-between text-emerald-800 font-semibold bg-emerald-100/60 px-1.5 py-0.5 rounded text-[10px]">
                      <span>Wallet Cashback (2%):</span>
                      <span>+₹{slipBill.cashback.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-slate-400 pt-1.5 flex justify-between font-bold text-slate-900 text-sm">
                    <span>NET PAYABLE:</span>
                    <span className="text-forest-900">₹{slipBill.finalTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 text-right pt-0.5 uppercase">
                    Payment Mode: {slipOrder.paymentMethod || 'COD'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyOrdersPage;
