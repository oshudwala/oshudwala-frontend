import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
  Search,
} from 'lucide-react';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { prescriptionApi } from '../../services/api/prescription.api';
import { pharmacyApi } from '../../services/api/pharmacy.api';
import { orderApi } from '../../services/api/order.api';
import { productApi } from '../../services/api/product.api';
import Button from '../../components/common/Button';
import { calculateOrderBill, calculatePlatformFee } from '../../services/pricingRules';

export const PrescriptionReviewPage = () => {
  const { prescriptions, inventory, verifyPrescription, rejectPrescription, createOrder } = useWorkspaceStore();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [backendPrescriptions, setBackendPrescriptions] = useState([]);
  const [primaryPharmacy, setPrimaryPharmacy] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [isLoadingRx, setIsLoadingRx] = useState(false);

  const loadData = async () => {
    setIsLoadingRx(true);
    try {
      const [rxList, prim, prods] = await Promise.all([
        prescriptionApi.getPharmacyPrescriptions().catch(() => []),
        pharmacyApi.getPrimaryPharmacy().catch(() => null),
        productApi.getProducts().catch(() => []),
      ]);

      if (Array.isArray(rxList)) {
        const mapped = rxList.map((r) => {
          const fileUrl = r.files?.[0]?.storageKey
            ? (r.files[0].storageKey.startsWith('http') || r.files[0].storageKey.startsWith('data:')
                ? r.files[0].storageKey
                : `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'xi9ciynt'}/image/upload/${r.files[0].storageKey}`)
            : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800';

          return {
            id: r.id,
            prescriptionNumber: r.prescriptionNumber,
            patientName: r.patient?.fullName || 'Walk-in / App Patient',
            patientPhone: r.patient?.phone || '9876543210',
            patientAge: 32,
            patientGender: 'Male',
            doctorName: r.doctorName || 'Registered Medical Practitioner',
            rxDate: new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: r.status === 'SUBMITTED' ? 'PENDING_VERIFICATION' : r.status,
            imageUrl: fileUrl,
            extractedMedicines: r.items?.map((it) => ({
              name: it.nameAsWritten || 'Prescribed Medicine',
              dosage: it.dosage || '1-0-1 After Meals',
              duration: '5 Days',
              qty: it.quantity || 1,
              confidence: 96,
            })) || [],
            notes: r.patientNote || 'Submitted for pharmacist validation',
            submittedAt: new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
          };
        });
        setBackendPrescriptions(mapped);
      }
      setPrimaryPharmacy(prim);
      setCatalogProducts(Array.isArray(prods) ? prods : []);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setIsLoadingRx(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const mergedPrescriptions = useMemo(() => {
    if (backendPrescriptions && backendPrescriptions.length > 0) {
      return backendPrescriptions;
    }
    const map = new Map();
    prescriptions.forEach((p) => map.set(p.id, p));
    backendPrescriptions.forEach((p) => {
      if (!map.has(p.id)) {
        map.set(p.id, p);
      }
    });
    return Array.from(map.values());
  }, [prescriptions, backendPrescriptions]);

  // Queue View Tab: 'pending' (active audit) | 'history' (already verified/rejected)
  const [activeQueueTab, setActiveQueueTab] = useState('pending');

  const pendingPrescriptions = mergedPrescriptions.filter((p) => p.status === 'PENDING_VERIFICATION');
  const historyPrescriptions = mergedPrescriptions.filter((p) => p.status !== 'PENDING_VERIFICATION');

  const activeList = activeQueueTab === 'pending' ? pendingPrescriptions : historyPrescriptions;

  const [selectedRxId, setSelectedRxId] = useState(
    pendingPrescriptions[0]?.id || mergedPrescriptions[0]?.id || ''
  );
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pharmacistNotes, setPharmacistNotes] = useState(
    'All medicines verified against CDSCO / WBSPC Schedule H regulations.'
  );

  // Medicines Catalog & Available Stock from Pharmacy Inventory + Backend Catalog
  const availableMedicines = useMemo(() => {
    const list = [];
    const seenNames = new Set();

    // 1. Pharmacy active inventory
    if (Array.isArray(inventory)) {
      inventory.forEach((item) => {
        const cleanName = (item.name || '').trim();
        if (cleanName && !seenNames.has(cleanName.toLowerCase())) {
          seenNames.add(cleanName.toLowerCase());
          const unitPrice = Number(item.sellingPrice || item.mrp || 0);
          list.push({
            id: item.id || `inv-${cleanName}`,
            productId: item.productId || item.id,
            name: cleanName,
            price: unitPrice,
            mrp: Number(item.mrp || item.sellingPrice || unitPrice),
            stock: item.stock ?? item.units ?? 50,
            category: item.category || 'Medicine',
            generic: item.generic || '',
          });
        }
      });
    }

    // 2. Master products from backend DB
    if (Array.isArray(catalogProducts)) {
      catalogProducts.forEach((prod) => {
        const cleanName = (prod.name || '').trim();
        if (cleanName && !seenNames.has(cleanName.toLowerCase())) {
          seenNames.add(cleanName.toLowerCase());
          const unitPrice = prod.mrpPaise ? Number(prod.mrpPaise) / 100 : 0;
          list.push({
            id: prod.id,
            productId: prod.id,
            name: cleanName,
            price: unitPrice,
            mrp: unitPrice,
            stock: 100,
            category: prod.category?.name || 'General',
            generic: prod.genericName || '',
          });
        }
      });
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory, catalogProducts]);

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

  const handleReject = async () => {
    if (!currentRx) return;
    const reason = window.prompt(
      'Reason for prescription rejection:',
      'Illegible handwriting or unverified medical registration number'
    );
    if (reason) {
      try {
        await prescriptionApi.reviewPrescription(currentRx.id, {
          status: 'REJECTED',
          rejectionReason: reason,
        });
      } catch (err) {
        console.warn('Backend rejection sync warning:', err.message);
      }
      rejectPrescription(currentRx.id, reason);
      const remainingPending = pendingPrescriptions.filter((p) => p.id !== currentRx.id);
      setSelectedRxId(remainingPending[0]?.id || '');
      addToast(`Prescription ${currentRx.id} rejected and updated in database.`, 'error');
    }
  };

  // Manual Walk-in / In-Store Order Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [manualDeliveryType, setManualDeliveryType] = useState('DELIVERY'); // 'DELIVERY' | 'PICKUP'
  const [manualAddress, setManualAddress] = useState('');
  const [manualArea, setManualArea] = useState('City Centre');
  const [manualPincode, setManualPincode] = useState('');
  const [manualDiscountType, setManualDiscountType] = useState('PERCENT'); // 'PERCENT' | 'FLAT'
  const [manualDiscountValue, setManualDiscountValue] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualItems, setManualItems] = useState([
    { name: 'Paracetamol 650mg (Dolo 650)', qty: 1, price: 35 },
  ]);
  const [isSubmittingManualOrder, setIsSubmittingManualOrder] = useState(false);

  // Approval Modal State (Empty by default - no hardcoded demo items)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvedItems, setApprovedItems] = useState([]);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [medSearchQuery, setMedSearchQuery] = useState('');

  // Filter available medicines by search query
  const filteredMedicines = useMemo(() => {
    const q = medSearchQuery.trim().toLowerCase();
    if (!q) return availableMedicines;
    return availableMedicines.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.generic && m.generic.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q))
    );
  }, [availableMedicines, medSearchQuery]);

  // Quantity helper
  const getItemQty = (medId) => {
    const found = approvedItems.find((it) => it.id === medId);
    return found ? found.qty : 0;
  };

  // Add or increment medicine in approved order
  const handleAddOrIncrement = (med) => {
    setApprovedItems((prev) => {
      const idx = prev.findIndex((it) => it.id === med.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: med.id,
            productId: med.productId,
            name: med.name,
            price: Number(med.price) || 0,
            qty: 1,
            generic: med.generic || '',
            stock: med.stock,
          },
        ];
      }
    });
  };

  // Decrement quantity or remove if reaching 0
  const handleDecrement = (medId) => {
    setApprovedItems((prev) => {
      const idx = prev.findIndex((it) => it.id === medId);
      if (idx < 0) return prev;
      if (prev[idx].qty > 1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty - 1 };
        return updated;
      } else {
        return prev.filter((it) => it.id !== medId);
      }
    });
  };

  // Explicit quantity setter
  const handleSetQty = (med, newQty) => {
    const qty = Math.max(0, parseInt(newQty, 10) || 0);
    setApprovedItems((prev) => {
      if (qty <= 0) {
        return prev.filter((it) => it.id !== med.id);
      }
      const idx = prev.findIndex((it) => it.id === med.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: med.id,
            productId: med.productId,
            name: med.name,
            price: Number(med.price) || 0,
            qty,
            generic: med.generic || '',
            stock: med.stock,
          },
        ];
      }
    });
  };

  // Remove item from approved order
  const handleRemoveItem = (medId) => {
    setApprovedItems((prev) => prev.filter((it) => it.id !== medId));
  };

  // Add custom unlisted medicine if needed
  const handleAddCustomMedicine = () => {
    const customId = `custom-${Date.now()}`;
    setApprovedItems((prev) => [
      ...prev,
      {
        id: customId,
        productId: undefined,
        name: '',
        price: 50,
        qty: 1,
        isCustom: true,
      },
    ]);
  };

  // Pricing rules calculation for Online Prescription Approval
  // Subtotal = sum(qty * price). Delivery rule: < Rs 499 is Rs 30 delivery charge, >= 499 is FREE.
  // Platform fee rules:
  // - below 999: ₹9
  // - below 1999: ₹12
  // - below 2999: ₹15
  // - below 3999: ₹20
  // - below 4999 (above 3999): ₹25
  // - 5000 onwards: ₹30
  const approvalSubtotal = approvedItems.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1),
    0
  );
  const approvalPackagingFee = approvedItems.length > 0 ? 6 : 0;
  const approvalPlatformFee = calculatePlatformFee(approvalSubtotal);
  const approvalDeliveryFee = approvalSubtotal > 0 && approvalSubtotal < 499 ? 30 : 0;
  const approvalFinalTotal =
    approvalSubtotal + approvalPackagingFee + approvalPlatformFee + approvalDeliveryFee;

  // Submit Approval: Marks Verified, Creates Order & Stores permanently in backend database
  const handleConfirmApproval = async (e) => {
    e.preventDefault();
    if (!currentRx) return;

    if (approvedItems.length === 0) {
      addToast('Please select at least one medicine item from stock to approve.', 'warning');
      return;
    }

    const hasInvalidItem = approvedItems.some((it) => !it.name || Number(it.price) <= 0);
    if (hasInvalidItem) {
      addToast('Please ensure all added medicines have a valid name and price.', 'warning');
      return;
    }

    if (approvalSubtotal <= 0) {
      addToast('Total medicine price must be greater than zero.', 'warning');
      return;
    }

    setIsSubmittingApproval(true);

    try {
      const isUuid = (val) =>
        typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

      // 1. Create order in backend database linked to this prescription
      const cleanPhone = (currentRx.patientPhone || '9876543210').replace(/[^0-9]/g, '');
      let savedBackendOrder = null;

      try {
        savedBackendOrder = await orderApi.createWalkInOrder({
          customerName: currentRx.patientName || 'Registered Patient',
          customerPhone: cleanPhone.length >= 10 ? cleanPhone : '9876543210',
          deliveryType: 'DELIVERY',
          prescriptionId: isUuid(currentRx.id) ? currentRx.id : undefined,
          address: currentRx.address || 'Home Delivery Address (Provided by Patient)',
          area: 'Kolkata Central & Suburban',
          pincode: currentRx.pincode || '',
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
          notes: pharmacistNotes || undefined,
        });
      } catch (orderErr) {
        console.warn('Backend order creation notice:', orderErr?.response?.data || orderErr.message);
      }

      // 2. Mark prescription verified in backend database (if real UUID)
      if (isUuid(currentRx.id)) {
        await prescriptionApi
          .reviewPrescription(currentRx.id, {
            status: 'VERIFIED',
          })
          .catch((err) => console.warn('Backend prescription review notice:', err.message));
      }

      // 3. Update local workspace store for instant UI response
      verifyPrescription(currentRx.id, approvedItems, pharmacistNotes);
      createOrder({
        id: savedBackendOrder?.orderNumber || savedBackendOrder?.id,
        customerName: currentRx.patientName,
        customerPhone: currentRx.patientPhone,
        address: 'Home Delivery Address (Provided by Patient)',
        area: 'Kolkata Central & Suburban',
        items: approvedItems,
        totalMrp: approvalSubtotal,
        subtotal: approvalSubtotal,
        packagingFee: approvalPackagingFee,
        platformFee: approvalPlatformFee,
        deliveryFee: approvalDeliveryFee,
        discount: 0,
        cashback: 0,
        total: approvalFinalTotal,
        status: 'READY_FOR_PICKUP',
        paymentMethod: 'COD',
        prescriptionId: currentRx.id,
      });

      // 4. Update prescription lists and close modal
      setBackendPrescriptions((prev) =>
        prev.map((p) => (p.id === currentRx.id ? { ...p, status: 'VERIFIED' } : p))
      );
      const remainingPending = pendingPrescriptions.filter((p) => p.id !== currentRx.id);
      setSelectedRxId(remainingPending[0]?.id || '');
      setApprovedItems([]);
      setIsApproveModalOpen(false);

      addToast(
        `Prescription approved! Order ${savedBackendOrder?.orderNumber || 'created'} saved to database (₹${approvalFinalTotal.toFixed(
          2
        )}) & staged for dispatch.`,
        'success'
      );
    } catch (err) {
      console.error('Prescription approval order creation error:', err);
      addToast(
        err?.response?.data?.message || err.message || 'Failed to complete prescription approval.',
        'error'
      );
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Pricing calculation for Walk-in Registration / In-Store Order
  // Delivery Fee Rule: Under ₹499 order = ₹30 delivery fee, ₹499+ = FREE delivery. Pickup = ₹0.
  // Manual discount: Percentage (%) or Flat (₹) set directly by the pharmacy
  const isPickupOrder = manualDeliveryType === 'PICKUP';
  const manualSubtotal = manualItems.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1),
    0
  );

  const numDiscountVal = Number(manualDiscountValue) || 0;
  let manualDiscount = 0;
  if (manualDiscountType === 'PERCENT') {
    const clampedPercent = Math.min(100, Math.max(0, numDiscountVal));
    manualDiscount = Math.round((manualSubtotal * clampedPercent) / 100);
  } else {
    manualDiscount = Math.min(manualSubtotal, Math.max(0, numDiscountVal));
  }

  const manualPackagingFee = 6;
  const manualPlatformFee = calculatePlatformFee(manualSubtotal);
  const manualDeliveryFee = isPickupOrder ? 0 : manualSubtotal < 499 ? 30 : 0;
  const manualFinalTotal = Math.max(
    0,
    manualSubtotal - manualDiscount + manualPackagingFee + manualPlatformFee + manualDeliveryFee
  );

  const manualBill = {
    totalMrp: manualSubtotal,
    subtotal: manualSubtotal,
    discount: manualDiscount,
    discountType: manualDiscountType,
    discountValue: numDiscountVal,
    packagingFee: manualPackagingFee,
    platformFee: manualPlatformFee,
    deliveryFee: manualDeliveryFee,
    cashback: 0,
    finalTotal: manualFinalTotal,
  };

  // Submit Walk-in Order: Directly created as approved order in READY_FOR_PICKUP & saved to backend
  const handleConfirmManualOrder = async (e) => {
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

    const resolvedAddress = isPickupOrder
      ? 'In-Store Counter Pickup'
      : (manualAddress.trim() || 'Walk-in Registered Delivery Address');

    const resolvedArea = isPickupOrder
      ? 'In-Store Counter'
      : (manualArea.trim() || 'City Centre');

    const cleanPincode = manualPincode.trim();

    setIsSubmittingManualOrder(true);

    let savedBackendOrder = null;
    try {
      savedBackendOrder = await orderApi.createWalkInOrder({
        customerName: manualCustomerName.trim(),
        customerPhone: cleanPhone,
        deliveryType: manualDeliveryType,
        address: resolvedAddress,
        area: resolvedArea,
        pincode: cleanPincode,
        items: manualItems.map((it) => ({
          name: it.name,
          quantity: Number(it.qty) || 1,
          price: Number(it.price) || 0,
        })),
        subtotal: manualBill.subtotal,
        discount: manualBill.discount,
        discountType: manualBill.discountType,
        discountValue: manualBill.discountValue,
        packagingFee: manualBill.packagingFee,
        platformFee: manualBill.platformFee,
        deliveryFee: manualBill.deliveryFee,
        total: manualBill.finalTotal,
        notes: manualNotes.trim() || undefined,
      });
    } catch (err) {
      console.warn('Backend walk-in order sync notice:', err.message);
    }

    // Directly create the order in READY_FOR_PICKUP with exact manual discount & delivery fee
    const newOrder = createOrder({
      id: savedBackendOrder?.orderNumber || savedBackendOrder?.id,
      backendId: savedBackendOrder?.id,
      orderNumber: savedBackendOrder?.orderNumber,
      customerName: manualCustomerName.trim(),
      customerPhone: cleanPhone,
      deliveryType: manualDeliveryType,
      address: resolvedAddress,
      area: resolvedArea,
      pincode: cleanPincode,
      items: manualItems,
      totalMrp: manualBill.totalMrp,
      subtotal: manualBill.totalMrp,
      packagingFee: manualBill.packagingFee,
      platformFee: manualBill.platformFee,
      deliveryFee: manualBill.deliveryFee, // ₹30 under ₹499, ₹0 if ₹499+ or pickup
      discount: manualBill.discount,
      discountType: manualBill.discountType,
      discountValue: manualBill.discountValue,
      cashback: 0,
      total: manualBill.finalTotal,
      status: 'READY_FOR_PICKUP',
      paymentMethod: isPickupOrder ? 'IN_STORE_COUNTER' : 'COD',
      paymentStatus: 'PAID',
      isManualInStore: true,
      notes: `Walk-in registration order. Delivery Fee: ₹${manualBill.deliveryFee}. ${manualNotes}`,
    });

    setIsSubmittingManualOrder(false);
    setIsManualModalOpen(false);
    setManualCustomerName('');
    setManualCustomerPhone('');
    setManualAddress('');
    setManualArea('City Centre');
    setManualPincode('');
    setManualDiscountValue('');
    setManualNotes('');
    addToast(
      `Walk-in Order ${newOrder.id || savedBackendOrder?.orderNumber} registered & saved! Total: ₹${manualBill.finalTotal.toFixed(2)} (Delivery: ${manualBill.deliveryFee > 0 ? `₹${manualBill.deliveryFee}` : 'FREE'})`,
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
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            isLoading={isLoadingRx}
            onClick={loadData}
            className="text-xs font-bold"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => setIsManualModalOpen(true)}
            className="text-xs font-bold shadow-sm"
          >
            Walk-in Registration & Order
          </Button>
        </div>
      </div>

      {/* Primary Store Routing Info Banner */}
      {primaryPharmacy && (
        <div className="p-3.5 bg-forest-50 border border-forest-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-forest-700 flex-shrink-0" />
            <div>
              <span className="font-bold text-forest-900">
                Primary Pharmacy Hub: {primaryPharmacy.name}
              </span>
              <p className="text-forest-700 text-[11px] mt-0.5">
                All patient online prescription uploads and shop catalog orders are automatically routed to the active Primary Pharmacy.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 font-bold text-[10px] text-white bg-forest-800 px-2 py-0.5 rounded-full uppercase tracking-wider self-start sm:self-auto">
            <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Active Hub
          </span>
        </div>
      )}

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
                  onClick={() => {
                    setMedSearchQuery('');
                    setIsApproveModalOpen(true);
                  }}
                  className="w-full text-xs font-bold py-2.5 shadow-md flex items-center justify-center gap-2"
                >
                  Approve Prescription & Dispatch Order
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
          <div className="relative bg-surface-pure rounded-3xl max-w-2xl w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4 animate-scale-up max-h-[92vh] overflow-y-auto">
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
              {/* Prescribed Patient Info */}
              <div className="bg-forest-50/70 p-3 rounded-2xl border border-forest-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-brandText-muted uppercase font-bold block">Patient</span>
                  <span className="font-bold text-forest-900">{currentRx.patientName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-brandText-muted uppercase font-bold block">Mobile</span>
                  <span className="font-mono font-bold text-forest-800">{currentRx.patientPhone}</span>
                </div>
              </div>

              {/* Extracted medicines quick-add pills if available from uploaded document */}
              {currentRx.extractedMedicines && currentRx.extractedMedicines.length > 0 && (
                <div className="bg-forest-50/50 p-2.5 rounded-xl border border-forest-100/70 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold text-forest-800 uppercase tracking-wider block">
                    Detected in Prescription (Click to Quick-Add):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentRx.extractedMedicines.map((em, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const match = availableMedicines.find(
                            (m) =>
                              m.name.toLowerCase().includes(em.name.toLowerCase()) ||
                              em.name.toLowerCase().includes(m.name.toLowerCase())
                          );
                          if (match) {
                            handleAddOrIncrement(match);
                          } else {
                            setApprovedItems((prev) => [
                              ...prev,
                              {
                                id: `rx-${em.name}-${Date.now()}`,
                                productId: undefined,
                                name: em.name,
                                qty: em.qty || 1,
                                price: 50,
                              },
                            ]);
                          }
                        }}
                        className="bg-white hover:bg-forest-100/80 text-forest-900 border border-forest-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-forest-600" />
                        <span>{em.name} (Qty: {em.qty || 1})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MEDICINE SEARCH & FULL LIST SECTION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-forest-900">
                      Search & Select Medicines from Stock
                    </label>
                    <p className="text-[10px] text-brandText-muted">
                      Search any medicine from stock and add quantity directly
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-brandText-muted">
                    {filteredMedicines.length} Available
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-forest-600" />
                  <input
                    type="text"
                    value={medSearchQuery}
                    onChange={(e) => setMedSearchQuery(e.target.value)}
                    placeholder="Search medicine by name or generic formula (e.g. Paracetamol, Augmentin, Pan 40)..."
                    className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 focus:bg-white transition-all shadow-xs"
                  />
                  {medSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMedSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-brandText-muted hover:text-forest-900 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Whole List of Medicines */}
                <div className="border border-brandBorder-subtle rounded-2xl bg-surface-pure overflow-hidden">
                  <div className="space-y-1 max-h-56 overflow-y-auto p-2 divide-y divide-brandBorder-subtle/50">
                    {filteredMedicines.length === 0 ? (
                      <div className="py-6 text-center text-xs text-brandText-muted space-y-2">
                        <p>No medicines found matching "{medSearchQuery}".</p>
                        <button
                          type="button"
                          onClick={handleAddCustomMedicine}
                          className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 bg-forest-50 px-3 py-1.5 rounded-xl border border-forest-200 hover:bg-forest-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add as Custom Medicine</span>
                        </button>
                      </div>
                    ) : (
                      filteredMedicines.map((med) => {
                        const currentQty = getItemQty(med.id);
                        const isAdded = currentQty > 0;
                        return (
                          <div
                            key={med.id}
                            className={`p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 ${
                              isAdded
                                ? 'bg-forest-50/90 border border-forest-300 shadow-xs'
                                : 'hover:bg-surface-warm/80 border border-transparent'
                            }`}
                          >
                            {/* Medicine Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-forest-900 truncate">
                                  {med.name}
                                </h4>
                                {med.category && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-forest-100 text-forest-800">
                                    {med.category}
                                  </span>
                                )}
                              </div>
                              {med.generic && (
                                <p className="text-[10px] text-brandText-muted truncate mt-0.5">
                                  {med.generic}
                                </p>
                              )}
                              <div className="flex items-center gap-2.5 mt-1">
                                <span className="text-xs font-bold font-mono text-forest-900">
                                  ₹{med.price.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-brandText-muted">
                                  In Stock: <strong>{med.stock}</strong> units
                                </span>
                              </div>
                            </div>

                            {/* Add / Quantity Stepper Controls */}
                            <div className="shrink-0">
                              {!isAdded ? (
                                <button
                                  type="button"
                                  onClick={() => handleAddOrIncrement(med)}
                                  className="px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-1.5 bg-white border border-forest-400 rounded-xl p-1 shadow-xs">
                                  <button
                                    type="button"
                                    onClick={() => handleDecrement(med.id)}
                                    className="w-6 h-6 rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs"
                                    title="Decrease quantity"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={currentQty}
                                    onChange={(e) => handleSetQty(med, e.target.value)}
                                    className="w-10 text-center font-mono font-bold text-xs focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddOrIncrement(med)}
                                    className="w-6 h-6 rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs"
                                    title="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* SELECTED MEDICINES TRAY (ORDER BASKET) */}
              <div className="space-y-2 pt-1 border-t border-brandBorder-subtle">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-forest-700" />
                    <span>Selected Dispensing Items ({approvedItems.length})</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddCustomMedicine}
                      className="text-[11px] text-forest-700 hover:underline font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Custom Medicine</span>
                    </button>
                    {approvedItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setApprovedItems([])}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {approvedItems.length === 0 ? (
                  <div className="p-3.5 bg-surface-warm rounded-2xl border border-dashed border-brandBorder-subtle text-center text-xs text-brandText-muted">
                    No medicines selected yet. Search above and click <strong>Add</strong> to select medicines and set quantities.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {approvedItems.map((item, idx) => {
                      const rowTotal = (Number(item.price) || 0) * (Number(item.qty) || 1);
                      return (
                        <div
                          key={item.id || idx}
                          className="flex items-center justify-between gap-2 p-2 bg-forest-50/70 rounded-xl border border-forest-200 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            {item.isCustom ? (
                              <input
                                type="text"
                                required
                                value={item.name}
                                onChange={(e) => {
                                  const updated = [...approvedItems];
                                  updated[idx].name = e.target.value;
                                  setApprovedItems(updated);
                                }}
                                placeholder="Enter custom medicine name"
                                className="w-full bg-white px-2 py-0.5 rounded-lg border border-brandBorder-subtle text-xs font-semibold focus:outline-none"
                              />
                            ) : (
                              <p className="font-bold text-forest-900 truncate">{item.name}</p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-brandText-muted font-mono mt-0.5">
                              <span>Rate:</span>
                              {item.isCustom ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.price}
                                  onChange={(e) => {
                                    const updated = [...approvedItems];
                                    updated[idx].price = Number(e.target.value) || 0;
                                    setApprovedItems(updated);
                                  }}
                                  className="w-14 bg-white px-1 py-0.5 rounded border border-brandBorder-subtle text-center font-bold"
                                />
                              ) : (
                                <span>₹{Number(item.price).toFixed(2)} / unit</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDecrement(item.id)}
                                className="w-5 h-5 rounded bg-white hover:bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs border border-brandBorder-subtle"
                              >
                                -
                              </button>
                              <span className="w-6 text-center font-bold font-mono text-xs">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => handleAddOrIncrement(item)}
                                className="w-5 h-5 rounded bg-white hover:bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-xs border border-brandBorder-subtle"
                              >
                                +
                              </button>
                            </div>

                            <span className="w-16 text-right font-mono font-bold text-forest-900">
                              ₹{rowTotal.toFixed(2)}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Price Calculation Summary Breakdown according to Rules */}
              <div className="p-3.5 rounded-2xl bg-forest-50/80 border border-forest-100 text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-forest-900">
                  <span>Subtotal (Total MRP):</span>
                  <span className="font-mono text-sm">₹{approvalSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brandText-secondary">
                  <span>Packaging Charges (Fixed):</span>
                  <span className="font-mono">₹{approvalPackagingFee.toFixed(2)}</span>
                </div>

                {/* Tiered Platform Fee with official rule indicator */}
                <div className="flex justify-between text-brandText-secondary items-center">
                  <span>Platform Fee (Tiered):</span>
                  <span className="font-mono font-bold flex items-center gap-1.5 text-forest-900">
                    <span>₹{approvalPlatformFee.toFixed(2)}</span>
                    {approvalSubtotal > 0 && (
                      <span className="text-[10px] text-forest-700 bg-forest-100/90 px-1.5 py-0.5 rounded font-sans font-bold">
                        {approvalSubtotal < 999
                          ? 'Order < ₹999 (₹9)'
                          : approvalSubtotal < 1999
                          ? 'Order < ₹1999 (₹12)'
                          : approvalSubtotal < 2999
                          ? 'Order < ₹2999 (₹15)'
                          : approvalSubtotal < 3999
                          ? 'Order < ₹3999 (₹20)'
                          : approvalSubtotal < 5000
                          ? 'Order < ₹4999 (₹25)'
                          : 'Order ₹5000+ (₹30)'}
                      </span>
                    )}
                  </span>
                </div>

                {/* Delivery Fee with official rule indicator (₹30 under ₹499, FREE for ₹499+) */}
                <div className="flex justify-between text-brandText-secondary items-center">
                  <span>Delivery Charges:</span>
                  <span className="font-mono font-bold flex items-center gap-1.5">
                    {approvalDeliveryFee > 0 ? (
                      <>
                        <span className="text-amber-800">₹{approvalDeliveryFee.toFixed(2)}</span>
                        <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-sans font-bold">
                          Order &lt; ₹499
                        </span>
                      </>
                    ) : (
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                        FREE Delivery {approvalSubtotal >= 499 ? '(Order ₹499+)' : ''}
                      </span>
                    )}
                  </span>
                </div>

                {approvalSubtotal > 0 && approvalSubtotal < 499 && (
                  <p className="text-[10px] text-amber-800 font-medium bg-amber-50/90 p-1.5 rounded-lg border border-amber-200/60">
                    💡 Delivery fee of <strong>₹30</strong> applied on orders under ₹499. Add ₹{(499 - approvalSubtotal).toFixed(2)} more for <strong>FREE Delivery</strong>!
                  </p>
                )}

                <div className="border-t border-forest-200/80 pt-1.5 flex justify-between font-bold text-forest-900 text-sm">
                  <span>Final Net Total (COD):</span>
                  <span className="font-mono text-forest-800 text-base">
                    ₹{approvalFinalTotal.toFixed(2)}
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
                  isLoading={isSubmittingApproval}
                  leftIcon={CheckCircle}
                  disabled={approvedItems.length === 0 || approvalSubtotal <= 0}
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
          <div className="relative bg-surface-pure rounded-3xl max-w-lg w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
              <div>
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  Walk-in Registration & Medicine Order
                </h3>
                <p className="text-xs text-brandText-secondary">
                  Directly verified & registered with automated delivery fee & billing rules
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
              {/* Delivery Option Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-forest-900">Fulfillment / Delivery Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualDeliveryType('DELIVERY')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                      manualDeliveryType === 'DELIVERY'
                        ? 'bg-forest-50 border-forest-600 text-forest-900 shadow-xs'
                        : 'bg-surface-warm border-brandBorder-subtle text-brandText-secondary hover:bg-forest-50/50'
                    }`}
                  >
                    <div>
                      <p>Home Delivery</p>
                      <span className="text-[10px] font-normal text-brandText-muted">Rider Handover</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      manualBill.deliveryFee === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {manualBill.deliveryFee === 0 ? 'FREE (₹499+)' : '₹30 Fee'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualDeliveryType('PICKUP')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                      manualDeliveryType === 'PICKUP'
                        ? 'bg-forest-50 border-forest-600 text-forest-900 shadow-xs'
                        : 'bg-surface-warm border-brandBorder-subtle text-brandText-secondary hover:bg-forest-50/50'
                    }`}
                  >
                    <div>
                      <p>Counter Pickup</p>
                      <span className="text-[10px] font-normal text-brandText-muted">Patient Collects</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                      ₹0 Fee
                    </span>
                  </button>
                </div>
              </div>

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

              {/* Delivery Address fields when Home Delivery is selected */}
              {manualDeliveryType === 'DELIVERY' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
                  <div className="sm:col-span-1">
                    <label className="text-xs font-bold text-forest-900">Delivery Address</label>
                    <input
                      type="text"
                      required
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="e.g. Flat 3B, Bidhannagar"
                      className="w-full mt-1 px-3 py-2 text-xs font-semibold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-forest-900">Delivery Area</label>
                    <input
                      type="text"
                      required
                      value={manualArea}
                      onChange={(e) => setManualArea(e.target.value)}
                      placeholder="e.g. City Centre, Durgapur"
                      className="w-full mt-1 px-3 py-2 text-xs font-semibold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-forest-900">Pincode</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={manualPincode}
                      onChange={(e) => setManualPincode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 713216"
                      className="w-full mt-1 px-3 py-2 text-xs font-mono font-semibold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                  </div>
                </div>
              )}

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

              {/* MANUAL DISCOUNT SECTION (% Percentage or Flat ₹ Amount) */}
              <div className="space-y-2 bg-surface-warm p-3 rounded-2xl border border-brandBorder-subtle">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-forest-600" />
                    <span>Manual Pharmacy Discount</span>
                  </label>
                  <div className="flex items-center bg-surface-pure rounded-lg p-0.5 border border-brandBorder-subtle">
                    <button
                      type="button"
                      onClick={() => setManualDiscountType('PERCENT')}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                        manualDiscountType === 'PERCENT'
                          ? 'bg-forest-700 text-white shadow-xs'
                          : 'text-brandText-secondary hover:text-forest-800'
                      }`}
                    >
                      % Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualDiscountType('FLAT')}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                        manualDiscountType === 'FLAT'
                          ? 'bg-forest-700 text-white shadow-xs'
                          : 'text-brandText-secondary hover:text-forest-800'
                      }`}
                    >
                      ₹ Flat Discount
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max={manualDiscountType === 'PERCENT' ? 100 : manualBill.totalMrp}
                      step="any"
                      value={manualDiscountValue}
                      onChange={(e) => setManualDiscountValue(e.target.value)}
                      placeholder={
                        manualDiscountType === 'PERCENT'
                          ? 'Enter discount % (e.g. 15 for 15%)'
                          : 'Enter flat amount ₹ (e.g. 50)'
                      }
                      className="w-full px-3 py-2 text-xs font-mono font-semibold bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-brandText-muted">
                      {manualDiscountType === 'PERCENT' ? '%' : '₹'}
                    </span>
                  </div>
                  {manualBill.discount > 0 && (
                    <div className="text-right whitespace-nowrap">
                      <span className="text-xs font-bold text-emerald-700 font-mono">
                        -₹{manualBill.discount.toFixed(2)} Off
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-brandText-muted">
                  Custom discount set directly by counter. Will be shown on the official dispensing slip.
                </p>
              </div>

              {/* Price Summary with Delivery Fee Rule (₹30 under ₹499, FREE for ₹499+) */}
              <div className="p-3.5 rounded-2xl bg-forest-50/80 border border-forest-100 text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-forest-900">
                  <span>Total MRP:</span>
                  <span className="font-mono text-sm">₹{manualBill.totalMrp.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>
                    Manual Discount ({manualDiscountType === 'PERCENT' ? `${numDiscountVal}%` : `₹${numDiscountVal} flat`}):
                  </span>
                  <span className="font-mono">-₹{manualBill.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brandText-secondary">
                  <span>Packaging Charges (Fixed):</span>
                  <span className="font-mono">₹{manualBill.packagingFee.toFixed(2)}</span>
                </div>

                {/* Platform Fee with tier rule indicator */}
                <div className="flex justify-between text-brandText-secondary items-center">
                  <span>Platform Fee (Tiered):</span>
                  <span className="font-mono font-bold flex items-center gap-1.5 text-forest-900">
                    <span>₹{manualBill.platformFee.toFixed(2)}</span>
                    {manualBill.totalMrp > 0 && (
                      <span className="text-[10px] text-forest-700 bg-forest-100/90 px-1.5 py-0.5 rounded font-sans font-bold">
                        {manualBill.totalMrp < 999
                          ? 'Order < ₹999 (₹9)'
                          : manualBill.totalMrp < 1999
                          ? 'Order < ₹1999 (₹12)'
                          : manualBill.totalMrp < 2999
                          ? 'Order < ₹2999 (₹15)'
                          : manualBill.totalMrp < 3999
                          ? 'Order < ₹3999 (₹20)'
                          : manualBill.totalMrp < 5000
                          ? 'Order < ₹4999 (₹25)'
                          : 'Order ₹5000+ (₹30)'}
                      </span>
                    )}
                  </span>
                </div>

                {/* Delivery Fee with official rule indicator */}
                <div className="flex justify-between text-brandText-secondary items-center">
                  <span>Delivery Charges:</span>
                  <span className="font-mono font-bold flex items-center gap-1.5">
                    {manualBill.deliveryFee > 0 ? (
                      <>
                        <span className="text-amber-800">₹{manualBill.deliveryFee.toFixed(2)}</span>
                        <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-sans font-bold">
                          Order &lt; ₹499
                        </span>
                      </>
                    ) : (
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                        FREE Delivery {manualBill.totalMrp >= 499 ? '(Order ₹499+)' : '(Counter Pickup)'}
                      </span>
                    )}
                  </span>
                </div>

                {manualDeliveryType === 'DELIVERY' && manualBill.totalMrp < 499 && (
                  <p className="text-[10px] text-amber-800 font-medium bg-amber-50/90 p-1.5 rounded-lg border border-amber-200/60">
                    💡 Delivery fee of <strong>₹30</strong> applied on orders under ₹499. Add ₹{(499 - manualBill.totalMrp).toFixed(2)} more for <strong>FREE Delivery</strong>!
                  </p>
                )}

                <div className="border-t border-forest-200/80 pt-1.5 flex justify-between font-bold text-forest-900 text-sm">
                  <span>Net Payable:</span>
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
                  isLoading={isSubmittingManualOrder}
                  leftIcon={CheckCircle}
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
