import React, { useState } from 'react';
import {
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PhoneCall,
  ShieldCheck,
  Plus,
  ShoppingBag,
  Trash2,
  Tag,
  Check,
  X,
  Clock,
  User,
  Phone,
  DollarSign,
  Percent,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { calculateOrderBill } from '../../services/pricingRules';

export const PrescriptionReviewPage = () => {
  const { prescriptions, verifyPrescription, rejectPrescription, createOrder } = useWorkspaceStore();
  const { addToast } = useToast();

  // Queue View Tab: 'pending' (active audit) | 'history' (already verified/rejected)
  const [activeQueueTab, setActiveQueueTab] = useState('pending');

  const pendingPrescriptions = prescriptions.filter((p) => p.status === 'PENDING_VERIFICATION');
  const historyPrescriptions = prescriptions.filter((p) => p.status !== 'PENDING_VERIFICATION');

  const activeList = activeQueueTab === 'pending' ? pendingPrescriptions : historyPrescriptions;

  const [selectedRxId, setSelectedRxId] = useState(
    pendingPrescriptions[0]?.id || prescriptions[0]?.id || ''
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pharmacistNotes, setPharmacistNotes] = useState(
    'All medicines verified against CDSCO / WBSPC Schedule H regulations.'
  );

  // Approval Modal State
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [orderPrice, setOrderPrice] = useState('500');
  const [approvedItems, setApprovedItems] = useState([
    { name: 'Augmentin 625 Duo Tablet', qty: 2, price: 200 },
    { name: 'Pan 40 Tablet', qty: 2, price: 100 },
  ]);

  // Manual In-Store Order Modal State (Payment method removed, directly approved with Total MRP)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualItems, setManualItems] = useState([
    { name: 'Paracetamol 650mg (Dolo 650)', qty: 1, price: 35 },
  ]);

  // Current active prescription being reviewed
  const currentRx = activeList.find((p) => p.id === selectedRxId) || activeList[0] || null;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, z + 0.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.75, z - 0.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // Direct Call Clarification to Patient
  const handleCallClarification = () => {
    if (!currentRx?.patientPhone) {
      addToast('No registered phone number found for this patient in backend.', 'error');
      return;
    }
    const cleanPhone = currentRx.patientPhone.replace(/\s+/g, '');
    window.location.href = `tel:${cleanPhone}`;
    addToast(
      `Initiating direct call to patient ${currentRx.patientName} at ${currentRx.patientPhone}...`,
      'info'
    );
  };

  const handleReject = () => {
    if (!currentRx) return;
    const reason = window.prompt(
      'Reason for prescription rejection:',
      'Illegible handwriting or unverified medical registration number'
    );
    if (reason) {
      rejectPrescription(currentRx.id, reason);
      const remainingPending = pendingPrescriptions.filter((p) => p.id !== currentRx.id);
      setSelectedRxId(remainingPending[0]?.id || '');
      addToast(`Prescription ${currentRx.id} rejected and removed from pending queue.`, 'error');
    }
  };

  // Pricing rules calculation for Online Prescription Approval
  const numPrice = Number(orderPrice) || 0;
  const approvalBill = calculateOrderBill({
    items: approvedItems,
    customSubtotal: numPrice,
    isPickup: false,
  });

  // Submit Approval: Marks Verified, Creates Order & Removes from Pending Queue immediately
  const handleConfirmApproval = (e) => {
    e.preventDefault();
    if (!currentRx) return;

    if (numPrice <= 0) {
      addToast('Please enter a valid medicine price.', 'warning');
      return;
    }

    const formattedItems =
      approvedItems.length > 0
        ? approvedItems
        : [{ name: 'Prescribed Medicines Package', qty: 1, price: numPrice }];

    // 1. Mark prescription verified in store
    verifyPrescription(currentRx.id, formattedItems, pharmacistNotes);

    // 2. Create Order with packaging fee (₹6), tiered platform fee, and discount
    const newOrder = createOrder({
      customerName: currentRx.patientName,
      customerPhone: currentRx.patientPhone,
      address: 'Home Delivery Address (Provided by Patient)',
      area: 'Kolkata Central & Suburban',
      items: formattedItems,
      totalMrp: approvalBill.totalMrp,
      subtotal: approvalBill.totalMrp,
      packagingFee: approvalBill.packagingFee,
      platformFee: approvalBill.platformFee,
      deliveryFee: approvalBill.deliveryFee,
      discount: approvalBill.discount,
      cashback: approvalBill.cashback,
      total: approvalBill.finalTotal,
      status: 'READY_FOR_PICKUP',
      paymentMethod: 'COD',
      prescriptionId: currentRx.id,
    });

    // 3. Immediately advance selectedRxId to next pending prescription and close modal
    const remainingPending = pendingPrescriptions.filter((p) => p.id !== currentRx.id);
    setSelectedRxId(remainingPending[0]?.id || '');
    setIsApproveModalOpen(false);

    addToast(
      `Prescription ${currentRx.id} approved! Order ${newOrder.id} created (₹${approvalBill.finalTotal.toFixed(
        2
      )}) & staged for dispatch.`,
      'success'
    );
  };

  // Pricing rules calculation for Manual In-Store Order
  const manualBill = calculateOrderBill({
    items: manualItems,
    isPickup: true, // In-store counter pickup
  });

  // Submit Manual In-Store Order: Directly approved, directly created as approved order, NO re-approval needed!
  const handleConfirmManualOrder = (e) => {
    e.preventDefault();
    if (!manualCustomerName.trim()) {
      addToast('Please provide walk-in customer name.', 'warning');
      return;
    }

    const cleanPhone = manualCustomerPhone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      addToast('Please provide a valid 10-digit customer mobile number.', 'warning');
      return;
    }

    // Directly create the order in READY_FOR_PICKUP (already approved right at the counter!)
    const newOrder = createOrder({
      customerName: manualCustomerName.trim(),
      customerPhone: manualCustomerPhone.trim(),
      address: 'In-Store Counter Pickup',
      area: 'In-Store Counter',
      items: manualItems,
      totalMrp: manualBill.totalMrp,
      subtotal: manualBill.totalMrp,
      packagingFee: manualBill.packagingFee,
      platformFee: manualBill.platformFee,
      deliveryFee: 0,
      discount: manualBill.discount,
      cashback: manualBill.cashback,
      total: manualBill.finalTotal,
      status: 'READY_FOR_PICKUP',
      paymentMethod: 'IN_STORE_COUNTER',
      paymentStatus: 'PAID',
      isManualInStore: true,
      notes: `In-Store counter prescription approved & dispensed. ${manualNotes}`,
    });

    setIsManualModalOpen(false);
    setManualCustomerName('');
    setManualCustomerPhone('');
    setManualNotes('');
    addToast(
      `In-Store Order ${newOrder.id} approved and billed! Total: ₹${manualBill.finalTotal.toFixed(2)}`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and In-Store Order Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Prescription Audit & Verification Studio
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            CDSCO Schedule H / H1 compliance validation for medicine dispensation & order release.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => setIsManualModalOpen(true)}
            className="text-xs font-bold shadow-sm"
          >
            New In-Store Prescription Order
          </Button>
        </div>
      </div>

      {/* Queue View Switcher: Pending Audit vs Audit History */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-pure p-3 rounded-2xl border border-brandBorder-subtle shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveQueueTab('pending');
              if (pendingPrescriptions.length > 0) {
                setSelectedRxId(pendingPrescriptions[0].id);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeQueueTab === 'pending'
                ? 'bg-forest-800 text-white shadow-xs'
                : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Audit Queue</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeQueueTab === 'pending'
                  ? 'bg-amber-400 text-forest-950 font-extrabold'
                  : 'bg-forest-100 text-forest-800'
              }`}
            >
              {pendingPrescriptions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveQueueTab('history');
              if (historyPrescriptions.length > 0) {
                setSelectedRxId(historyPrescriptions[0].id);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeQueueTab === 'history'
                ? 'bg-forest-800 text-white shadow-xs'
                : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Audit History</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-forest-100 text-forest-800">
              {historyPrescriptions.length}
            </span>
          </button>
        </div>

        {/* Prescription Selection Pills for current tab */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5">
          {activeList.map((rx) => (
            <button
              key={rx.id}
              type="button"
              onClick={() => {
                setSelectedRxId(rx.id);
                setZoomLevel(1);
                setRotation(0);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedRxId === rx.id
                  ? 'bg-forest-700 text-white shadow-xs ring-2 ring-forest-500/30'
                  : 'bg-surface-warm border border-brandBorder-subtle text-forest-900 hover:bg-forest-50'
              }`}
            >
              <span>{rx.id}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  rx.status === 'VERIFIED'
                    ? 'bg-emerald-400'
                    : rx.status === 'REJECTED'
                    ? 'bg-rose-400'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {currentRx ? (
        /* Split Screen Review Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
          {/* Left Side (7 Cols): High-Resolution Stored Document Viewer */}
          <div className="lg:col-span-7 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card flex flex-col overflow-hidden">
            {/* Viewer Controls Toolbar */}
            <div className="p-3 border-b border-brandBorder-subtle bg-surface-warm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-forest-900">{currentRx.id}</span>
                <span className="text-[10px] text-brandText-muted">
                  Submitted: {currentRx.submittedAt}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    currentRx.status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : currentRx.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {currentRx.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg bg-surface-pure border border-brandBorder-subtle text-forest-800 hover:bg-forest-50 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono font-bold px-2 text-forest-900">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg bg-surface-pure border border-brandBorder-subtle text-forest-800 hover:bg-forest-50 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 rounded-lg bg-surface-pure border border-brandBorder-subtle text-forest-800 hover:bg-forest-50 transition-colors ml-1"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Canvas Stage: Original Stored Document */}
            <div className="flex-1 bg-slate-900/95 p-6 flex items-center justify-center overflow-auto min-h-[450px]">
              <div
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="shadow-2xl rounded-lg overflow-hidden max-w-full"
              >
                <img
                  src={
                    currentRx.imageUrl ||
                    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800'
                  }
                  alt={`Prescription ${currentRx.id}`}
                  className="max-h-[520px] object-contain rounded select-none"
                />
              </div>
            </div>
          </div>

          {/* Right Side (5 Cols): Patient Info & Pharmacist Actions */}
          <div className="lg:col-span-5 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Header Box */}
              <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
                <div>
                  <span className="text-[10px] font-bold text-forest-700 uppercase tracking-wider">
                    Customer Audit Card
                  </span>
                  <h2 className="font-heading font-extrabold text-lg text-forest-900">
                    {currentRx.patientName}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold text-forest-800">
                    {currentRx.patientPhone}
                  </span>
                  <p className="text-[10px] text-brandText-muted">
                    {currentRx.patientGender}, {currentRx.patientAge} yrs
                  </p>
                </div>
              </div>

              {/* Patient Submission Details */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-forest-900 block">
                  Patient Notes & Instructions
                </label>
                <div className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle text-xs text-brandText-secondary">
                  {currentRx.notes ||
                    'Please dispense standard branded dosage for 7 days with invoice.'}
                </div>
              </div>

              {/* Pharmacist CDSCO Verification Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-forest-900 flex items-center justify-between">
                  <span>Pharmacist CDSCO Compliance Audit</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </label>
                <textarea
                  rows={3}
                  value={pharmacistNotes}
                  onChange={(e) => setPharmacistNotes(e.target.value)}
                  disabled={currentRx.status !== 'PENDING_VERIFICATION'}
                  placeholder="Enter CDSCO Schedule H batch remarks..."
                  className="w-full p-3 text-xs font-medium bg-surface-warm border border-brandBorder-subtle rounded-2xl focus:outline-none focus:border-forest-500 disabled:opacity-75"
                />
              </div>
            </div>

            {/* Bottom Actions for Pending Prescription */}
            {currentRx.status === 'PENDING_VERIFICATION' ? (
              <div className="pt-4 border-t border-brandBorder-subtle space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={PhoneCall}
                    onClick={handleCallClarification}
                    className="text-xs font-bold text-forest-800 border-forest-200 hover:bg-forest-50"
                  >
                    Call Clarification
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={XCircle}
                    onClick={handleReject}
                    className="text-xs font-bold"
                  >
                    Reject
                  </Button>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  leftIcon={CheckCircle}
                  onClick={() => setIsApproveModalOpen(true)}
                  className="w-full text-xs font-bold py-2.5 shadow-md flex items-center justify-center gap-2"
                >
                  Approve & Set Order Price
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-900">
                  Prescription Already {currentRx.status}
                </p>
                <p className="text-[11px] text-emerald-700">
                  This document has been audited and billed.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State when queue is clear */
        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-12 text-center space-y-3 shadow-card">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-heading font-extrabold text-forest-900">
            {activeQueueTab === 'pending'
              ? 'All Prescriptions Audited!'
              : 'No History Prescriptions Available'}
          </h3>
          <p className="text-xs text-brandText-secondary max-w-sm mx-auto">
            {activeQueueTab === 'pending'
              ? 'Great job! There are currently no pending customer prescriptions waiting for audit in the queue.'
              : 'Approved or rejected prescriptions will be archived here for your records.'}
          </p>
        </div>
      )}

      {/* APPROVAL & AUTO-DISCOUNT ORDER CREATION MODAL */}
      {isApproveModalOpen && currentRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setIsApproveModalOpen(false)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-lg w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
              <div>
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  Approve Prescription & Dispatch Order
                </h3>
                <p className="text-xs text-brandText-secondary">
                  Patient: <strong>{currentRx.patientName}</strong> &bull; {currentRx.patientPhone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="p-1 rounded-full text-brandText-muted hover:text-forest-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4">
              {/* Medicines in Order */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-forest-900">Order Items to Dispense</label>
                  <button
                    type="button"
                    onClick={() =>
                      setApprovedItems([
                        ...approvedItems,
                        { name: 'Additional Medicine', qty: 1, price: 100 },
                      ])
                    }
                    className="text-[11px] font-bold text-forest-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {approvedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-surface-warm p-2 rounded-xl text-xs">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...approvedItems];
                          updated[idx].name = e.target.value;
                          setApprovedItems(updated);
                        }}
                        placeholder="Medicine name..."
                        className="flex-1 bg-transparent border-0 font-semibold text-forest-900 focus:outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => {
                          const updated = [...approvedItems];
                          updated[idx].qty = Number(e.target.value) || 1;
                          setApprovedItems(updated);
                        }}
                        className="w-12 text-center bg-surface-pure border border-brandBorder-subtle rounded-lg py-0.5 font-bold"
                        title="Quantity"
                      />
                      <button
                        type="button"
                        onClick={() => setApprovedItems(approvedItems.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medicine MRP / Total Input */}
              <div>
                <label className="text-xs font-bold text-forest-900">Medicines Total MRP (₹)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brandText-muted">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>
              </div>

              {/* Price Calculation Summary Breakdown according to Rules */}
              <div className="p-3.5 rounded-2xl bg-forest-50/80 border border-forest-100 text-xs space-y-1.5">
                <div className="flex justify-between text-brandText-secondary">
                  <span>Total MRP:</span>
                  <span className="font-mono font-semibold">₹{approvalBill.totalMrp.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      {approvalBill.isHighValueTier
                        ? 'High-Value Discount (18%):'
                        : `Platform Discount (${approvalBill.discountPercent}%):`}
                    </span>
                  </span>
                  <span className="font-mono">-₹{approvalBill.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brandText-secondary">
                  <span>Packaging Charges (Fixed):</span>
                  <span className="font-mono">₹{approvalBill.packagingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brandText-secondary">
                  <span>Platform Fee:</span>
                  <span className="font-mono">₹{approvalBill.platformFee.toFixed(2)}</span>
                </div>
                {approvalBill.cashback > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold bg-emerald-100/60 px-2 py-1 rounded-lg">
                    <span>Wallet Cashback (2%):</span>
                    <span className="font-mono">+₹{approvalBill.cashback.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-forest-200/80 pt-1.5 flex justify-between font-bold text-forest-900 text-sm">
                  <span>Final Net Total (COD):</span>
                  <span className="font-mono text-forest-800">
                    ₹{approvalBill.finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={CheckCircle}
                  className="text-xs font-bold px-4 py-2"
                >
                  Approve & Create Delivery Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL IN-STORE PRESCRIPTION ORDER MODAL */}
      {/* Payment method removed, displays Total MRP, directly approved on creation */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setIsManualModalOpen(false)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-lg w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
              <div>
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  New In-Store Walk-in Prescription Order
                </h3>
                <p className="text-xs text-brandText-secondary">
                  Directly verified & approved at the counter with instant billing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-full text-brandText-muted hover:text-forest-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmManualOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-forest-900">Walk-in Patient Name</label>
                  <input
                    type="text"
                    required
                    value={manualCustomerName}
                    onChange={(e) => setManualCustomerName(e.target.value)}
                    placeholder="e.g. Subhash Mukherjee"
                    className="w-full mt-1 px-3 py-2 text-xs font-semibold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-900">Patient Mobile Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={manualCustomerPhone}
                    onChange={(e) => setManualCustomerPhone(e.target.value)}
                    placeholder="e.g. 9830112233"
                    className="w-full mt-1 px-3 py-2 text-xs font-mono font-semibold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>
              </div>

              {/* Medicine Item Rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-forest-900">Medicine Items & MRP</label>
                  <button
                    type="button"
                    onClick={() =>
                      setManualItems([...manualItems, { name: '', qty: 1, price: 50 }])
                    }
                    className="text-[11px] font-bold text-forest-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {manualItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-surface-warm p-2 rounded-xl text-xs">
                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...manualItems];
                          updated[idx].name = e.target.value;
                          setManualItems(updated);
                        }}
                        placeholder="Drug / Medicine Name"
                        className="flex-1 bg-transparent border-0 font-semibold text-forest-900 focus:outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => {
                          const updated = [...manualItems];
                          updated[idx].qty = Number(e.target.value) || 1;
                          setManualItems(updated);
                        }}
                        placeholder="Qty"
                        className="w-12 text-center bg-surface-pure border border-brandBorder-subtle rounded-lg py-0.5 font-bold"
                      />
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.price}
                        onChange={(e) => {
                          const updated = [...manualItems];
                          updated[idx].price = Number(e.target.value) || 0;
                          setManualItems(updated);
                        }}
                        placeholder="MRP"
                        className="w-16 text-right bg-surface-pure border border-brandBorder-subtle rounded-lg py-0.5 px-1 font-bold"
                      />
                      {manualItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setManualItems(manualItems.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Summary with Total MRP, Packaging Fee (₹6), Platform Fee & Discount */}
              <div className="p-3.5 rounded-2xl bg-forest-50/80 border border-forest-100 text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-forest-900">
                  <span>Total MRP:</span>
                  <span className="font-mono text-sm">₹{manualBill.totalMrp.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>
                    {manualBill.isHighValueTier
                      ? 'High-Value Discount (18%):'
                      : `Platform Discount (${manualBill.discountPercent}%):`}
                  </span>
                  <span className="font-mono">-₹{manualBill.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brandText-secondary">
                  <span>Packaging Charges (Fixed):</span>
                  <span className="font-mono">₹{manualBill.packagingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brandText-secondary">
                  <span>Platform Fee:</span>
                  <span className="font-mono">₹{manualBill.platformFee.toFixed(2)}</span>
                </div>
                {manualBill.cashback > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold bg-emerald-100/60 px-2 py-1 rounded-lg">
                    <span>Wallet Cashback (2%):</span>
                    <span className="font-mono">+₹{manualBill.cashback.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-forest-200/80 pt-1.5 flex justify-between font-bold text-forest-900 text-sm">
                  <span>Net Payable at Counter:</span>
                  <span className="font-mono text-forest-800">
                    ₹{manualBill.finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsManualModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={CheckCircle}
                  className="text-xs font-bold px-4 py-2"
                >
                  Approve & Create In-Store Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionReviewPage;
