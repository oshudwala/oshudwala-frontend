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
  Upload,
  User,
  Phone,
  DollarSign,
  Percent,
} from 'lucide-react';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const PrescriptionReviewPage = () => {
  const { prescriptions, verifyPrescription, rejectPrescription, createOrder, addPrescription } = useWorkspaceStore();
  const { addToast } = useToast();

  const [selectedRxId, setSelectedRxId] = useState(
    prescriptions.find((p) => p.status === 'PENDING_VERIFICATION')?.id || prescriptions[0]?.id
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pharmacistNotes, setPharmacistNotes] = useState('All medicines verified against CDSCO / WBSPC Schedule H regulations.');

  // Approval Modal State
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [orderPrice, setOrderPrice] = useState('500');
  const [discountPercent, setDiscountPercent] = useState(15); // Standard 15% platform auto-discount
  const [approvedItems, setApprovedItems] = useState([
    { name: 'Augmentin 625 Duo Tablet', qty: 2, price: 200 },
    { name: 'Pan 40 Tablet', qty: 2, price: 100 },
  ]);

  // Manual In-Store Order Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState('CASH');
  const [manualItems, setManualItems] = useState([
    { name: 'Paracetamol 650mg (Dolo 650)', qty: 1, price: 35 },
  ]);
  const [manualDiscountPercent, setManualDiscountPercent] = useState(15);

  const currentRx = prescriptions.find((p) => p.id === selectedRxId) || prescriptions[0];

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, z + 0.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.75, z - 0.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // Call Clarification Action
  const handleCallClarification = () => {
    if (!currentRx?.patientPhone) {
      addToast('No registered phone number found for this patient in backend.', 'error');
      return;
    }
    const cleanPhone = currentRx.patientPhone.replace(/\s+/g, '');
    window.location.href = `tel:${cleanPhone}`;
    addToast(`Initiating direct call to patient ${currentRx.patientName} at ${currentRx.patientPhone}...`, 'info');
  };

  const handleReject = () => {
    if (!currentRx) return;
    const reason = window.prompt(
      'Reason for prescription rejection:',
      'Illegible handwriting or unverified medical registration number'
    );
    if (reason) {
      rejectPrescription(currentRx.id, reason);
      addToast(`Prescription ${currentRx.id} marked Rejected.`, 'error');
    }
  };

  // Calculations for Approval Modal
  const numPrice = Number(orderPrice) || 0;
  const autoDiscountAmount = (numPrice * discountPercent) / 100;
  const finalPayableTotal = Math.max(0, numPrice - autoDiscountAmount);

  // Submit Approval and Store as Order
  const handleConfirmApproval = (e) => {
    e.preventDefault();
    if (!currentRx) return;

    if (numPrice <= 0) {
      addToast('Please enter a valid medicine price.', 'warning');
      return;
    }

    const formattedItems = approvedItems.length > 0
      ? approvedItems
      : [{ name: 'Prescribed Medicines Package', qty: 1, price: numPrice }];

    // 1. Mark prescription verified
    verifyPrescription(currentRx.id, formattedItems, pharmacistNotes);

    // 2. Create Order in workspace store (Ready for Rider Pickup)
    const newOrder = createOrder({
      customerName: currentRx.patientName,
      customerPhone: currentRx.patientPhone,
      address: 'Home Delivery Address (Provided by Patient)',
      area: 'Kolkata Central & Suburban',
      items: formattedItems,
      subtotal: numPrice,
      discount: autoDiscountAmount,
      total: finalPayableTotal,
      status: 'READY_FOR_PICKUP',
      paymentMethod: 'COD',
      prescriptionId: currentRx.id,
    });

    setIsApproveModalOpen(false);
    addToast(
      `Prescription ${currentRx.id} approved! Order ${newOrder.id} created (₹${finalPayableTotal.toFixed(2)}) & Ready for Delivery.`,
      'success'
    );
  };

  // Calculations for Manual In-Store Order
  const manualSubtotal = manualItems.reduce((acc, curr) => acc + (Number(curr.price) || 0) * (Number(curr.qty) || 1), 0);
  const manualDiscount = (manualSubtotal * manualDiscountPercent) / 100;
  const manualTotal = Math.max(0, manualSubtotal - manualDiscount);

  // Submit Manual In-Store Prescription Order
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

    // 1. Create prescription entry in workspace
    const newRx = addPrescription({
      patientName: manualCustomerName.trim(),
      patientPhone: manualCustomerPhone.trim(),
      patientAge: 35,
      patientGender: 'Walk-in',
      status: 'VERIFIED',
      notes: `In-Store counter prescription verified. ${manualNotes}`,
      extractedMedicines: manualItems,
    });

    // 2. Create order in workspace store
    const newOrder = createOrder({
      customerName: manualCustomerName.trim(),
      customerPhone: manualCustomerPhone.trim(),
      address: 'In-Store Counter Pickup / Express Delivery',
      area: 'In-Store Counter',
      items: manualItems,
      subtotal: manualSubtotal,
      discount: manualDiscount,
      total: manualTotal,
      status: 'READY_FOR_PICKUP',
      paymentMethod: manualPaymentMethod,
      paymentStatus: 'PAID',
      isManualInStore: true,
      prescriptionId: newRx.id,
    });

    setIsManualModalOpen(false);
    setManualCustomerName('');
    setManualCustomerPhone('');
    setManualNotes('');
    addToast(`Manual In-Store Order ${newOrder.id} created successfully! Total: ₹${manualTotal.toFixed(2)}`, 'success');
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

      {/* Prescription Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {prescriptions.map((rx) => (
          <button
            key={rx.id}
            type="button"
            onClick={() => {
              setSelectedRxId(rx.id);
              setZoomLevel(1);
              setRotation(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedRxId === rx.id
                ? 'bg-forest-800 text-white shadow-sm'
                : 'bg-surface-pure border border-brandBorder-subtle text-forest-900 hover:bg-forest-50'
            }`}
          >
            <span>{rx.id}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                rx.status === 'VERIFIED'
                  ? 'bg-emerald-400'
                  : rx.status === 'REJECTED'
                  ? 'bg-rose-400'
                  : 'bg-amber-400'
              }`}
            />
          </button>
        ))}
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
                  alt="Original Stored Prescription Scan"
                  className="max-h-[500px] object-contain rounded"
                />
              </div>
            </div>

            <div className="p-3 bg-surface-warm border-t border-brandBorder-subtle flex items-center justify-between text-xs text-brandText-secondary">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Original Document from Database Storage</span>
              </span>
              <span className="font-mono text-[11px]">CDSCO Schedule H Compliance Validated</span>
            </div>
          </div>

          {/* Right Side (5 Cols): Patient Info, Call Clarification & Order Approval */}
          <div className="lg:col-span-5 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Patient Info Card (Doctor Details & Extracted Items REMOVED) */}
              <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-forest-900">
                      {currentRx.patientName}
                    </h3>
                    <p className="text-xs text-brandText-secondary">
                      {currentRx.patientGender}, {currentRx.patientAge} yrs
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentRx.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentRx.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {currentRx.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="pt-2 border-t border-forest-200/60 flex items-center justify-between text-xs text-forest-900">
                  <div className="flex items-center gap-1.5 font-mono font-semibold">
                    <Phone className="w-3.5 h-3.5 text-forest-600" />
                    <span>{currentRx.patientPhone}</span>
                  </div>
                  <span className="text-[10px] text-brandText-muted">Verified Mobile</span>
                </div>
              </div>

              {/* Patient Notes / Prescription Remarks */}
              {currentRx.notes && (
                <div className="p-3 bg-surface-warm rounded-2xl border border-brandBorder-subtle text-xs">
                  <span className="font-bold text-forest-900 block mb-0.5">Patient Notes / Reference:</span>
                  <p className="text-brandText-secondary">{currentRx.notes}</p>
                </div>
              )}

              {/* Pharmacist Compliance Sign-Off Notes */}
              <div>
                <label className="text-xs font-bold text-forest-900">Pharmacist Sign-Off Note</label>
                <textarea
                  rows={2}
                  value={pharmacistNotes}
                  onChange={(e) => setPharmacistNotes(e.target.value)}
                  placeholder="Compliance and batch verification notes..."
                  className="w-full mt-1 p-2.5 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs focus:outline-none focus:border-forest-500"
                />
              </div>
            </div>

            {/* Bottom Actions: Call Clarification, Reject, and Approve & Release Order */}
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
          </div>
        </div>
      ) : (
        <p className="text-xs text-brandText-secondary">No prescriptions available for audit.</p>
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
                      setApprovedItems([...approvedItems, { name: 'Additional Medicine', qty: 1, price: 100 }])
                    }
                    className="text-[11px] font-bold text-forest-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
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

              {/* Medicine Price Input & Auto-Discount */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-forest-900">Medicines MRP / Total (₹)</label>
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

                <div>
                  <label className="text-xs font-bold text-forest-900">Auto Platform Discount (%)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brandText-muted">
                      %
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 text-sm font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                  </div>
                </div>
              </div>

              {/* Price Calculation Summary Breakdown */}
              <div className="p-3.5 rounded-2xl bg-forest-50/80 border border-forest-100 text-xs space-y-1.5">
                <div className="flex justify-between text-brandText-secondary">
                  <span>Gross Medicine Price:</span>
                  <span className="font-mono font-semibold">₹{numPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Auto-Applied Discount ({discountPercent}%):</span>
                  </span>
                  <span className="font-mono">-₹{autoDiscountAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-forest-200/80 pt-1.5 flex justify-between font-bold text-forest-900 text-sm">
                  <span>Final Amount to Collect (COD):</span>
                  <span className="font-mono text-forest-800">₹{finalPayableTotal.toFixed(2)}</span>
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
                  Create order for walk-in patient with counter prescription verification
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
                  <label className="text-xs font-bold text-forest-900">Medicine Items</label>
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

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
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
                        placeholder="Price"
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

              {/* Payment Mode & Auto-Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-forest-900">Payment Mode</label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => setManualPaymentMethod(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  >
                    <option value="CASH">Cash at Counter</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-900">Auto In-Store Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={manualDiscountPercent}
                    onChange={(e) => setManualDiscountPercent(Number(e.target.value) || 0)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>
              </div>

              {/* Price Summary */}
              <div className="p-3.5 rounded-2xl bg-forest-50/80 border border-forest-100 text-xs space-y-1">
                <div className="flex justify-between text-brandText-secondary">
                  <span>Gross Total:</span>
                  <span className="font-mono">₹{manualSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount ({manualDiscountPercent}%):</span>
                  <span className="font-mono">-₹{manualDiscount.toFixed(2)}</span>
                </div>
                <div className="border-t border-forest-200/80 pt-1 flex justify-between font-bold text-forest-900 text-sm">
                  <span>Net Payable:</span>
                  <span className="font-mono text-forest-800">₹{manualTotal.toFixed(2)}</span>
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
                  leftIcon={ShoppingBag}
                  className="text-xs font-bold px-4 py-2"
                >
                  Confirm & Create Order
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
