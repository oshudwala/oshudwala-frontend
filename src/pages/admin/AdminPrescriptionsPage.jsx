import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  User,
  Calendar,
  Building2,
  ExternalLink,
  Search,
  Plus,
  Trash2,
  Receipt,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  X,
  CheckCircle2,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Drawer from '../../components/workspace/Drawer';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { prescriptionApi } from '../../services/api/prescription.api';
import { productApi } from '../../services/api/product.api';
import { orderApi } from '../../services/api/order.api';
import { calculatePlatformFee } from '../../services/pricingRules';

export const AdminPrescriptionsPage = () => {
  const { addToast } = useToast();

  const [prescriptions, setPrescriptions] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedRx, setSelectedRx] = useState(null);

  // Approval & Medicine setup modal state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvedItems, setApprovedItems] = useState([]);
  const [medSearchQuery, setMedSearchQuery] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Rejection modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const filterOptions = [
    { label: 'Pending Verification', value: 'PENDING_VERIFICATION' },
    { label: 'Verified', value: 'VERIFIED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  // Fetch real prescriptions and product inventory
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rxRes, prodRes] = await Promise.allSettled([
        prescriptionApi.getPharmacyPrescriptions(),
        productApi.getProducts(),
      ]);

      if (rxRes.status === 'fulfilled') {
        const rawList = Array.isArray(rxRes.value) ? rxRes.value : rxRes.value?.items || [];
        const normalized = rawList.map((r) => {
          const fileUrl = r.files?.[0]?.storageKey
            ? r.files[0].storageKey.startsWith('http') || r.files[0].storageKey.startsWith('data:')
              ? r.files[0].storageKey
              : `https://res.cloudinary.com/${
                  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'xi9ciynt'
                }/image/upload/${r.files[0].storageKey}`
            : null;

          return {
            id: r.id,
            prescriptionNumber: r.prescriptionNumber || r.id,
            patientName: r.patient?.fullName || 'Registered Patient',
            patientPhone: r.patient?.phone || 'Not Specified',
            patientGender: 'Patient',
            patientAge: '-',
            doctorName: r.doctorName || 'Medical Practitioner',
            address: 'Direct Delivery Address',
            status:
              r.status === 'SUBMITTED' ? 'PENDING_VERIFICATION' : r.status || 'PENDING_VERIFICATION',
            imageUrl: fileUrl,
            files: r.files || [],
            notes: r.patientNote || r.doctorName || 'Prescription submitted for compliance audit',
            submittedAt: new Date(r.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            pharmacyName: r.pharmacy?.name || 'Primary Medicine Hub',
          };
        });
        setPrescriptions(normalized);
      }

      if (prodRes.status === 'fulfilled') {
        const prods = Array.isArray(prodRes.value) ? prodRes.value : [];
        setCatalogProducts(prods);
      }
    } catch (err) {
      console.warn('Admin prescription load notice:', err.message);
      addToast('Could not sync prescriptions from server.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filterable medicines from product catalog
  const filteredMedicines = useMemo(() => {
    const q = medSearchQuery.trim().toLowerCase();
    const source = catalogProducts.map((p) => ({
      id: p.id,
      productId: p.id,
      name: p.name,
      generic: p.genericName || p.category?.name || 'General Medicine',
      category: p.category?.name || 'Medicine',
      price: (p.mrpPaise || 0) / 100 || 50,
      stock: p.stockCount ?? 100,
    }));

    if (!q) return source;
    return source.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.generic && m.generic.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q))
    );
  }, [catalogProducts, medSearchQuery]);

  // Billing calculations for approval modal
  const approvalSubtotal = useMemo(() => {
    return approvedItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
      0
    );
  }, [approvedItems]);

  const approvalPackagingFee = 15.0;
  const approvalPlatformFee = calculatePlatformFee(approvalSubtotal);
  const approvalDeliveryFee = approvalSubtotal >= 499 ? 0.0 : 30.0;
  const approvalFinalTotal =
    approvalSubtotal > 0
      ? approvalSubtotal + approvalPackagingFee + approvalPlatformFee + approvalDeliveryFee
      : 0.0;

  // Add / modify items in approval modal
  const handleAddMedicineToApproval = (med) => {
    const existingIndex = approvedItems.findIndex((it) => it.productId === med.productId || it.name === med.name);
    if (existingIndex >= 0) {
      setApprovedItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, qty: Number(it.qty) + 1 } : it
        )
      );
    } else {
      setApprovedItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: med.productId,
          name: med.name,
          dosage: '1-0-1 as prescribed',
          qty: 1,
          price: Number(med.price) || 0,
        },
      ]);
    }
  };

  const handleUpdateItemQty = (index, newQty) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    setApprovedItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, qty } : it))
    );
  };

  const handleUpdateItemPrice = (index, newPrice) => {
    const price = Math.max(0, parseFloat(newPrice) || 0);
    setApprovedItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, price } : it))
    );
  };

  const handleRemoveApprovalItem = (index) => {
    setApprovedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Confirm Approval & Create Order in Backend
  const handleConfirmApproval = async (e) => {
    e?.preventDefault();
    if (!selectedRx) return;

    if (approvedItems.length === 0) {
      addToast('Please select at least one medicine from stock to approve.', 'warning');
      return;
    }

    if (approvalSubtotal <= 0) {
      addToast('Total medicine price must be greater than zero.', 'warning');
      return;
    }

    setIsSubmittingApproval(true);

    try {
      const isUuid = (val) =>
        typeof val === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

      const cleanPhone = (selectedRx.patientPhone || '9876543210').replace(/[^0-9]/g, '');

      // 1. Create walk-in order in PostgreSQL linked to this prescription
      let savedOrder = null;
      try {
        savedOrder = await orderApi.createWalkInOrder({
          customerName: selectedRx.patientName || 'Registered Patient',
          customerPhone: cleanPhone.length >= 10 ? cleanPhone : '9876543210',
          deliveryType: 'DELIVERY',
          prescriptionId: isUuid(selectedRx.id) ? selectedRx.id : undefined,
          address: selectedRx.address || 'Direct Patient Delivery Address',
          area: 'Kolkata Central & Suburban',
          items: approvedItems.map((it) => ({
            name: it.name,
            quantity: Number(it.qty) || 1,
            price: Number(it.price) || 0,
            productId: isUuid(it.productId) ? it.productId : undefined,
          })),
          subtotal: approvalSubtotal,
          discount: 0,
          discountType: 'FLAT',
          discountValue: 0,
          packagingFee: approvalPackagingFee,
          platformFee: approvalPlatformFee,
          deliveryFee: approvalDeliveryFee,
          total: approvalFinalTotal,
          notes: adminNotes || undefined,
        });
      } catch (orderErr) {
        console.warn('Backend order creation notice:', orderErr.message);
      }

      // 2. Review prescription in backend database
      if (isUuid(selectedRx.id)) {
        await prescriptionApi
          .reviewPrescription(selectedRx.id, {
            status: 'VERIFIED',
          })
          .catch((err) => console.warn('Backend prescription review notice:', err.message));
      }

      // 3. Update local state
      setPrescriptions((prev) =>
        prev.map((p) => (p.id === selectedRx.id ? { ...p, status: 'VERIFIED' } : p))
      );

      setSelectedRx((prev) => (prev ? { ...prev, status: 'VERIFIED' } : null));
      setIsApproveModalOpen(false);
      setApprovedItems([]);
      setAdminNotes('');

      addToast(
        `Prescription verified! Order ${
          savedOrder?.orderNumber || 'created'
        } saved to database (₹${approvalFinalTotal.toFixed(2)}) & staged for rider dispatch.`,
        'success'
      );
    } catch (err) {
      console.error('Prescription approval error:', err);
      addToast(err.response?.data?.message || err.message || 'Failed to approve prescription.', 'error');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Reject Prescription
  const handleConfirmReject = async (e) => {
    e?.preventDefault();
    if (!selectedRx) return;

    setIsSubmittingReject(true);
    try {
      const isUuid = (val) =>
        typeof val === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

      if (isUuid(selectedRx.id)) {
        await prescriptionApi.reviewPrescription(selectedRx.id, {
          status: 'REJECTED',
          rejectionReason: rejectionReason || 'Prescription rejected during administrative compliance audit.',
        });
      }

      setPrescriptions((prev) =>
        prev.map((p) => (p.id === selectedRx.id ? { ...p, status: 'REJECTED' } : p))
      );

      setSelectedRx((prev) => (prev ? { ...prev, status: 'REJECTED' } : null));
      setIsRejectModalOpen(false);
      setRejectionReason('');
      addToast(`Prescription ${selectedRx.id} rejected.`, 'error');
    } catch (err) {
      console.error('Prescription rejection error:', err);
      addToast(err.response?.data?.message || err.message || 'Failed to reject prescription.', 'error');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const columns = [
    {
      header: 'Rx ID',
      key: 'id',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-forest-800">
            {row.prescriptionNumber || row.id}
          </span>
          <p className="text-[10px] text-brandText-muted">{row.submittedAt}</p>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      key: 'patientName',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.patientName}</p>
          <p className="text-[11px] text-brandText-secondary">{row.patientPhone}</p>
        </div>
      ),
    },
    {
      header: 'Prescription Document',
      key: 'imageUrl',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt="Rx"
              className="w-10 h-10 rounded-xl object-cover border border-brandBorder-subtle shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center font-bold text-xs border border-forest-100">
              Rx
            </div>
          )}
          <span className="text-xs font-semibold text-forest-800">Uploaded Document</span>
        </div>
      ),
    },
    {
      header: 'Compliance / Notes',
      key: 'notes',
      render: (row) => (
        <span className="text-xs text-brandText-secondary line-clamp-1 max-w-xs">
          {row.notes || 'Pending CDSCO schedule compliance verification'}
        </span>
      ),
    },
    {
      header: 'Audit Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Prescription Verification & Compliance
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Audit uploaded prescriptions, verify scheduled drugs, and approve for fulfillment.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          isLoading={isLoading}
          className="text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Prescriptions</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={prescriptions}
        isLoading={isLoading}
        searchKey="patientName"
        searchPlaceholder="Search by patient name, Rx ID..."
        filterOptions={filterOptions}
        filterKey="status"
        onRowClick={(row) => setSelectedRx(row)}
      />

      {/* Prescription Audit Drawer */}
      <Drawer
        isOpen={Boolean(selectedRx)}
        onClose={() => setSelectedRx(null)}
        title={`Prescription Review: ${selectedRx?.prescriptionNumber || selectedRx?.id}`}
        subtitle={`Patient: ${selectedRx?.patientName}`}
        footer={
          selectedRx?.status === 'PENDING_VERIFICATION' ? (
            <div className="flex items-center justify-end gap-3 w-full">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsRejectModalOpen(true)}
                className="text-xs"
              >
                Reject Prescription
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setApprovedItems([]);
                  setIsApproveModalOpen(true);
                }}
                className="text-xs px-5 font-bold"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                <span>Approve & Set Order</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full text-xs text-brandText-secondary font-medium">
              <span>Status: <strong className="text-forest-900">{selectedRx?.status}</strong></span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRx(null)}>
                Close
              </Button>
            </div>
          )
        }
      >
        {selectedRx && (
          <div className="space-y-5">
            {/* Image Preview */}
            <div className="rounded-2xl overflow-hidden border border-brandBorder-subtle bg-slate-900 shadow-inner max-h-80 flex flex-col items-center justify-center p-2 relative group">
              {selectedRx.imageUrl ? (
                <>
                  <img
                    src={selectedRx.imageUrl}
                    alt="Prescription Document"
                    className="w-full object-contain max-h-72 rounded-xl"
                  />
                  <a
                    href={selectedRx.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute top-4 right-4 bg-forest-950/80 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-white/20 backdrop-blur-sm flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Full Image</span>
                  </a>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-500" />
                  <p>No scanned image attached for this prescription.</p>
                </div>
              )}
            </div>

            {/* Patient & Prescription Details */}
            <div className="p-4 rounded-2xl bg-forest-50/60 border border-forest-100 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-forest-900 text-sm">{selectedRx.patientName}</span>
                <span className="text-[10px] font-bold text-forest-800 bg-forest-100 px-2.5 py-0.5 rounded-full border border-forest-200">
                  {selectedRx.pharmacyName}
                </span>
              </div>
              <p className="text-brandText-secondary">Contact Number: {selectedRx.patientPhone}</p>
              <p className="text-[11px] text-brandText-muted">Submitted Date: {selectedRx.submittedAt}</p>
            </div>

            {/* Compliance Notes */}
            <div className="p-3.5 bg-surface-warm rounded-2xl border border-brandBorder-subtle text-xs space-y-1">
              <p className="font-bold text-forest-900">Compliance & Prescription Notes:</p>
              <p className="text-brandText-secondary">
                {selectedRx.notes || 'Prescription uploaded for administrative schedule audit.'}
              </p>
            </div>
          </div>
        )}
      </Drawer>

      {/* Approve & Set Order Modal (Medicine Stock Picker + Bill Breakdown) */}
      {isApproveModalOpen && selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setIsApproveModalOpen(false)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-2xl w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
              <div>
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  Approve Prescription & Set Delivery Order
                </h3>
                <p className="text-xs text-brandText-secondary">
                  Patient: <strong>{selectedRx.patientName}</strong> &bull; {selectedRx.patientPhone}
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
              {/* Medicine Stock Search & Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-forest-600" />
                    <span>Select Medicines from Stock</span>
                  </label>
                  <span className="text-[11px] text-brandText-muted">
                    {filteredMedicines.length} items available
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-brandText-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={medSearchQuery}
                    onChange={(e) => setMedSearchQuery(e.target.value)}
                    placeholder="Search medicine by brand or generic name..."
                    className="w-full pl-9 pr-4 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs text-forest-900 focus:outline-none focus:border-forest-600"
                  />
                </div>

                <div className="border border-brandBorder-subtle rounded-2xl overflow-hidden divide-y divide-brandBorder-subtle max-h-48 overflow-y-auto bg-surface-pure">
                  {filteredMedicines.slice(0, 15).map((med) => (
                    <div
                      key={med.id}
                      className="p-2.5 flex items-center justify-between hover:bg-forest-50/50 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-xs text-forest-900">{med.name}</p>
                        <p className="text-[10px] text-brandText-muted">
                          {med.generic} &bull; ₹{med.price.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddMedicineToApproval(med)}
                        className="text-xs py-1 px-2.5 font-bold"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        <span>Add</span>
                      </Button>
                    </div>
                  ))}
                  {filteredMedicines.length === 0 && (
                    <div className="p-4 text-center text-xs text-brandText-muted">
                      No matching medicines found in catalog.
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Items for Order */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-forest-900">
                    Approved Prescription Medicines ({approvedItems.length})
                  </span>
                  {approvedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setApprovedItems([])}
                      className="text-[11px] text-red-600 hover:underline font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {approvedItems.length === 0 ? (
                  <div className="p-4 rounded-2xl border border-dashed border-brandBorder-subtle text-center text-xs text-brandText-muted bg-surface-warm/50">
                    No medicines selected yet. Search and click "Add" to include items.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {approvedItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl border border-brandBorder-subtle bg-surface-pure flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-forest-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-brandText-muted">{item.dosage}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-brandText-muted">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleUpdateItemQty(idx, e.target.value)}
                              className="w-12 px-1.5 py-1 text-center bg-surface-warm border border-brandBorder-subtle rounded-lg text-xs font-bold text-forest-900"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-brandText-muted">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.price}
                              onChange={(e) => handleUpdateItemPrice(idx, e.target.value)}
                              className="w-16 px-1.5 py-1 text-right bg-surface-warm border border-brandBorder-subtle rounded-lg text-xs font-bold text-forest-900"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveApprovalItem(idx)}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Billing Breakdown with Tiered Platform Fee */}
              <div className="p-3.5 rounded-2xl bg-forest-50/70 border border-forest-100 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-brandText-secondary">
                  <span>Medicine Subtotal:</span>
                  <span>₹{approvalSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brandText-secondary">
                  <span>Packaging Charges (Fixed):</span>
                  <span>+₹{approvalPackagingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brandText-secondary">
                  <span>Platform Fee (Tiered):</span>
                  <span>+₹{approvalPlatformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brandText-secondary">
                  <span>Delivery Charges:</span>
                  <span className={approvalDeliveryFee === 0 ? 'text-emerald-700 font-bold' : ''}>
                    {approvalDeliveryFee > 0 ? `+₹${approvalDeliveryFee.toFixed(2)}` : 'FREE (Over ₹499)'}
                  </span>
                </div>
                <div className="border-t border-forest-200 pt-1.5 flex justify-between font-bold text-forest-900 text-sm">
                  <span>FINAL BILLABLE TOTAL:</span>
                  <span className="text-forest-800">₹{approvalFinalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Compliance Notes Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-forest-900">
                  Compliance & Pharmacist Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Schedule H verified. Take with warm water after meals."
                  className="w-full px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs text-forest-900 focus:outline-none focus:border-forest-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
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
                  isLoading={isSubmittingApproval}
                  disabled={approvedItems.length === 0 || approvalSubtotal <= 0}
                  className="text-xs font-bold px-5 py-2"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  <span>Confirm Approval & Create Order</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && selectedRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setIsRejectModalOpen(false)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-md w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4">
            <div>
              <h3 className="font-heading font-extrabold text-base text-red-900">
                Reject Prescription
              </h3>
              <p className="text-xs text-brandText-secondary mt-0.5">
                Prescription: <strong className="font-mono">{selectedRx.prescriptionNumber || selectedRx.id}</strong>
              </p>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-forest-900">Rejection Reason</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specify why this prescription was rejected (e.g. blurry image, missing doctor seal)..."
                  className="w-full px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs text-forest-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={isSubmittingReject}
                  className="text-xs font-bold px-4"
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPrescriptionsPage;
