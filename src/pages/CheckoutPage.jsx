import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  FileText,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  Package,
  ArrowRight,
  ArrowLeft,
  Upload,
  Camera,
  Trash2,
  Plus,
  Navigation,
  Loader2,
  Eye,
  Check,
  Building,
  Home,
  Briefcase,
  Banknote,
  X,
  Tag,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderService } from '../services/orderService';
import { prescriptionService } from '../services/prescriptionService';
import { userApi } from '../services/api/user.api';
import { couponApi } from '../services/api/coupon.api';
import Button from '../components/common/Button';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    subtotal,
    deliveryFee,
    packagingFee,
    platformFee,
    cashback,
    discount,
    total,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    clearCart,
    hasPrescriptionRequiredItems
  } = useCart();
  const { addToast } = useToast();

  // ================= COUPONS & OFFERS STATE =================
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [showOffers, setShowOffers] = useState(false);

  // Fetch available active coupons for patient shop checkout
  useEffect(() => {
    let isMounted = true;
    const fetchOffers = async () => {
      setIsLoadingOffers(true);
      try {
        const list = await couponApi.getCoupons();
        if (isMounted && Array.isArray(list)) {
          const now = new Date();
          const activeList = list.filter((c) => {
            if (c.isActive === false) return false;
            if (c.validTo && new Date(c.validTo) < now) return false;
            return true;
          });
          setAvailableCoupons(activeList);
        }
      } catch (err) {
        console.warn('Could not fetch coupons for checkout:', err);
      } finally {
        if (isMounted) setIsLoadingOffers(false);
      }
    };
    fetchOffers();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput || '').trim();
    if (!code) {
      addToast('Please enter a coupon code.', 'warning');
      return;
    }
    setIsApplyingCoupon(true);
    try {
      const ok = await applyCoupon(code);
      if (ok) {
        addToast(`Coupon "${code.toUpperCase()}" applied successfully!`, 'success');
        setCouponInput('');
      } else {
        // Error will be shown in the UI via couponError
      }
    } catch (err) {
      addToast(err.message || 'Failed to apply coupon', 'error');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    addToast('Coupon removed.', 'info');
  };

  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const walletBalance = Number(user?.walletBalance ?? user?.coins ?? user?.wallet ?? 0);

  // Rule i: Wallet balance can be used in bills but NOT on prescription medicines
  const nonPrescriptionTotal = cartItems
    .filter((i) => !i.prescriptionRequired && !i.isPrescription)
    .reduce((sum, i) => sum + i.price * i.quantity, 0);
  const maxWalletDeduction = Math.min(nonPrescriptionTotal, walletBalance);
  const walletDeducted = useWalletBalance ? maxWalletDeduction : 0;
  const finalTotalPayable = Math.max(0, total - walletDeducted);

  // ================= DELIVERY ADDRESS STATE =================
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressMode, setAddressMode] = useState('saved'); // 'saved' | 'new'
  const [isLocating, setIsLocating] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);

  const [newAddressForm, setNewAddressForm] = useState({
    fullName: user?.fullName || user?.name || '',
    phone: user?.phone || '',
    label: 'Home',
    line1: '',
    line2: '',
    landmark: '',
    city: 'Durgapur',
    state: 'West Bengal',
    pincode: '713216',
    latitude: null,
    longitude: null,
    saveAddress: true,
  });

  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Sync fresh profile via /users/me and load saved addresses via /users/addresses
  useEffect(() => {
    let isMounted = true;

    const loadProfileAndAddresses = async () => {
      setIsLoadingAddresses(true);

      // 1. Fetch current user profile via GET /users/me (or /users/profile)
      try {
        const me = await userApi.getMe();
        if (me && isMounted) {
          setNewAddressForm((prev) => ({
            ...prev,
            fullName: prev.fullName || me.fullName || me.name || user?.fullName || user?.name || '',
            phone: prev.phone || me.phone || user?.phone || '',
          }));
        }
      } catch (err) {
        if (user && isMounted) {
          setNewAddressForm((prev) => ({
            ...prev,
            fullName: prev.fullName || user.fullName || user.name || '',
            phone: prev.phone || user.phone || '',
          }));
        }
      }

      // 2. Fetch saved addresses via GET /users/addresses
      let list = [];
      try {
        const data = await userApi.getAddresses();
        if (Array.isArray(data) && data.length > 0) {
          list = data.map((addr) => ({
            id: addr.id,
            tag: addr.label || 'Home',
            recipient: addr.fullName,
            phone: addr.phone,
            line1: addr.line1,
            line2: addr.line2,
            landmark: addr.landmark,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            address: `${addr.line1}${addr.line2 ? `, ${addr.line2}` : ''}${addr.landmark ? ` (Landmark: ${addr.landmark})` : ''}, ${addr.city}, ${addr.state} - ${addr.pincode}`,
            isDefault: Boolean(addr.isDefault),
          }));
        }
      } catch (err) {
        console.warn('Could not load addresses from /users/addresses:', err);
      }

      if (!isMounted) return;

      if (list.length > 0) {
        setSavedAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        setSelectedAddressId(def.id);
        setAddressMode('saved');
      } else {
        setSavedAddresses([]);
        setAddressMode('new');
      }
      setIsLoadingAddresses(false);
    };

    loadProfileAndAddresses();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // GPS Location System with Reverse-Geocoding
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGpsCoords({ latitude: lat, longitude: lng });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const road = addr.road || addr.street || addr.neighbourhood || addr.suburb || '';
            const house = addr.house_number || '';
            const streetLine = [house, road].filter(Boolean).join(' ') || data.display_name?.split(',')[0] || '';
            const locality = addr.suburb || addr.residential || addr.city_district || addr.county || '';
            const city = addr.city || addr.town || addr.village || addr.state_district || 'Durgapur';
            const state = addr.state || 'West Bengal';
            const postcode = addr.postcode || '';

            setNewAddressForm((prev) => ({
              ...prev,
              line1: streetLine || prev.line1 || `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              line2: locality || prev.line2,
              city: city || prev.city || 'Durgapur',
              state: state || prev.state || 'West Bengal',
              pincode: postcode || prev.pincode,
              latitude: lat,
              longitude: lng,
            }));
            addToast('GPS location acquired and address prefilled!', 'success');
          } else {
            setNewAddressForm((prev) => ({
              ...prev,
              line1: prev.line1 || `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              latitude: lat,
              longitude: lng,
            }));
            addToast('GPS coordinates acquired. Please verify address details.', 'info');
          }
        } catch (fetchErr) {
          setNewAddressForm((prev) => ({
            ...prev,
            line1: prev.line1 || `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            latitude: lat,
            longitude: lng,
          }));
          addToast('GPS coordinates acquired. Please complete your street/flat details.', 'info');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        let errorMsg = 'Failed to get GPS location. Please enter your address manually.';
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = 'Location permission was denied. Please allow location access or type manually.';
        }
        addToast(errorMsg, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Save manual address to user's saved addresses via POST /users/addresses
  const handleSaveManualAddress = async () => {
    if (!newAddressForm.fullName || !newAddressForm.phone || !newAddressForm.line1 || !newAddressForm.city || !newAddressForm.pincode) {
      addToast('Please fill all required address fields (Full Name, Phone, Address Line 1, City, Pincode).', 'error');
      return null;
    }

    const cleanPhone = newAddressForm.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      addToast('Please enter a valid 10-digit contact phone number.', 'error');
      return null;
    }

    setIsSavingAddress(true);
    const fullAddrString = `${newAddressForm.line1}${newAddressForm.line2 ? `, ${newAddressForm.line2}` : ''}${newAddressForm.landmark ? ` (Landmark: ${newAddressForm.landmark})` : ''}, ${newAddressForm.city}, ${newAddressForm.state} - ${newAddressForm.pincode}`;

    // Payload formatted to match POST /users/addresses requirement:
    // {"fullName": "...", "phone": "...", "line1": "...", "city": "Durgapur", "state": "WB", "pincode": "713216", "isDefault": true}
    const addressPayload = {
      fullName: newAddressForm.fullName.trim(),
      phone: cleanPhone,
      line1: newAddressForm.line1.trim(),
      line2: newAddressForm.line2?.trim() || undefined,
      landmark: newAddressForm.landmark?.trim() || undefined,
      city: newAddressForm.city.trim() || 'Durgapur',
      state: newAddressForm.state.trim() || 'WB',
      pincode: newAddressForm.pincode.trim() || '713216',
      label: newAddressForm.label || 'Home',
      isDefault: Boolean(savedAddresses.length === 0),
      latitude: newAddressForm.latitude ? Number(newAddressForm.latitude) : undefined,
      longitude: newAddressForm.longitude ? Number(newAddressForm.longitude) : undefined,
    };

    let savedItem = null;
    try {
      const res = await userApi.addAddress(addressPayload);
      if (res?.id) {
        savedItem = {
          id: res.id,
          tag: res.label || addressPayload.label || 'Home',
          recipient: res.fullName || addressPayload.fullName,
          phone: res.phone || cleanPhone,
          line1: res.line1 || addressPayload.line1,
          line2: res.line2 || addressPayload.line2,
          landmark: res.landmark || addressPayload.landmark,
          city: res.city || addressPayload.city,
          state: res.state || addressPayload.state,
          pincode: res.pincode || addressPayload.pincode,
          address: fullAddrString,
          isDefault: Boolean(res.isDefault ?? addressPayload.isDefault),
        };
      }
    } catch (apiErr) {
      console.warn('userApi.addAddress failed:', apiErr);
      addToast(apiErr.response?.data?.message || apiErr.message || 'Failed to save address to server', 'error');
    } finally {
      setIsSavingAddress(false);
    }

    if (!savedItem) {
      savedItem = {
        id: `addr-local-${Date.now()}`,
        tag: newAddressForm.label || 'Home',
        recipient: newAddressForm.fullName,
        phone: cleanPhone,
        address: fullAddrString,
        isDefault: savedAddresses.length === 0,
      };
    }

    setSavedAddresses((prev) => [savedItem, ...prev.filter((a) => a.id !== savedItem.id)]);
    setSelectedAddressId(savedItem.id);
    setAddressMode('saved');
    addToast('Delivery address saved to your profile!', 'success');
    return savedItem;
  };

  // Delete address via DELETE /users/addresses/:id
  const handleDeleteAddress = async (addressId, e) => {
    e.stopPropagation();
    if (deletingAddressId) return;

    try {
      setDeletingAddressId(addressId);
      await userApi.deleteAddress(addressId);
      const remaining = savedAddresses.filter((a) => a.id !== addressId);
      setSavedAddresses(remaining);
      if (selectedAddressId === addressId) {
        if (remaining.length > 0) {
          setSelectedAddressId(remaining[0].id);
        } else {
          setSelectedAddressId('');
          setAddressMode('new');
        }
      }
      addToast('Address removed successfully.', 'info');
    } catch (err) {
      console.error('Failed to remove address:', err);
      addToast(err.response?.data?.message || err.message || 'Failed to remove address', 'error');
    } finally {
      setDeletingAddressId(null);
    }
  };

  // ================= PRESCRIPTION ATTACHMENT STATE =================
  // Real file attachment (no hardcoded demo data)
  const [attachedPrescriptionFile, setAttachedPrescriptionFile] = useState(null);
  const [prescriptionPreviewUrl, setPrescriptionPreviewUrl] = useState(null);
  const [patientNotes, setPatientNotes] = useState('');
  const [prescriptionError, setPrescriptionError] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [existingPrescriptions, setExistingPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  const [prescriptionMode, setPrescriptionMode] = useState('upload'); // 'upload' | 'saved'

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Fetch only real user prescriptions from backend (no fake fallback)
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const list = await prescriptionService.getUserPrescriptions();
        if (Array.isArray(list) && list.length > 0) {
          const formatted = list.map((rx) => ({
            id: rx.id,
            fileName: rx.fileName || rx.imageUrl || 'Doctor_Prescription.pdf',
            pharmacyName: rx.pharmacy?.name || 'Verified Pharmacist Roster',
            status: rx.status || 'VERIFIED',
            createdAt: rx.createdAt || new Date().toISOString(),
          }));
          setExistingPrescriptions(formatted);
        } else {
          setExistingPrescriptions([]);
        }
      } catch {
        setExistingPrescriptions([]);
      }
    };
    fetchPrescriptions();
  }, [user]);

  // Handle actual file selection
  const handlePrescriptionFileChange = (file) => {
    setPrescriptionError('');
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setPrescriptionError('Invalid file format. Please upload JPG, PNG, WEBP, or PDF.');
      addToast('Invalid file format. Allowed: JPG, PNG, WEBP, PDF', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPrescriptionError('File exceeds 10MB limit. Please upload a smaller document.');
      addToast('File exceeds 10MB limit.', 'error');
      return;
    }

    setAttachedPrescriptionFile(file);
    setSelectedPrescriptionId(''); // Prioritize the fresh attached file

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPrescriptionPreviewUrl(url);
    } else {
      setPrescriptionPreviewUrl(null);
    }

    addToast(`Prescription "${file.name}" attached successfully!`, 'success');
  };

  const handleRemovePrescription = () => {
    if (prescriptionPreviewUrl) {
      URL.revokeObjectURL(prescriptionPreviewUrl);
    }
    setAttachedPrescriptionFile(null);
    setPrescriptionPreviewUrl(null);
    setPrescriptionError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // ================= PAYMENT METHOD (ONLY COD FOR NOW) =================
  const paymentMethod = 'cod';

  // State for order placing & submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderResult, setPlacedOrderResult] = useState(null);

  // Filter prescription-required items in cart
  const rxItems = cartItems.filter((i) => i.prescriptionRequired || i.isPrescription);

  if (cartItems.length === 0 && !placedOrderResult) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-heading font-bold text-forest-800">No items to checkout</h2>
        <p className="text-xs text-brandText-secondary">Your medicine cart is empty.</p>
        <Button variant="primary" onClick={() => navigate('/shop')}>
          Go to Shop
        </Button>
      </div>
    );
  }

  // ================= ACTION: PLACE ORDER (COD ONLY) =================
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let activeAddress = '';
      let addressId = selectedAddressId;

      // 1. Resolve Delivery Address
      if (addressMode === 'new') {
        if (!newAddressForm.fullName || !newAddressForm.phone || !newAddressForm.line1 || !newAddressForm.city || !newAddressForm.pincode) {
          addToast('Please complete all required address fields (Name, Phone, Line 1, City, Pincode).', 'error');
          setIsSubmitting(false);
          return;
        }

        const cleanPhone = newAddressForm.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10) {
          addToast('Please enter a valid 10-digit phone number.', 'error');
          setIsSubmitting(false);
          return;
        }

        activeAddress = `${newAddressForm.line1}${newAddressForm.line2 ? `, ${newAddressForm.line2}` : ''}${newAddressForm.landmark ? ` (Landmark: ${newAddressForm.landmark})` : ''}, ${newAddressForm.city}, ${newAddressForm.state} - ${newAddressForm.pincode}`;

        // Ensure address is saved to backend to obtain a valid addressId
        try {
          const saved = await handleSaveManualAddress();
          if (saved?.id) addressId = saved.id;
        } catch (addrErr) {
          console.warn('Address persistence error:', addrErr);
        }
      } else {
        const found = savedAddresses.find((a) => a.id === selectedAddressId);
        if (!found && savedAddresses.length > 0) {
          addressId = savedAddresses[0].id;
          activeAddress = savedAddresses[0].address;
        } else if (found) {
          activeAddress = found.address;
        } else {
          addToast('Please select or add a delivery destination address.', 'error');
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Validate Prescription Requirement
      if (hasPrescriptionRequiredItems) {
        if (!attachedPrescriptionFile && !selectedPrescriptionId) {
          addToast(
            `Prescription attachment is required for: ${rxItems.map((i) => i.name).join(', ')}. Please attach your doctor's prescription.`,
            'error'
          );
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Upload Prescription if attached file is present
      let finalRxId = selectedPrescriptionId;
      if (attachedPrescriptionFile) {
        try {
          const rxRes = await prescriptionService.uploadPrescription({
            file: attachedPrescriptionFile,
            patientNotes,
            patientName: user?.fullName || newAddressForm.fullName || 'Patient',
            patientPhone: user?.phone || newAddressForm.phone || '',
          });
          if (rxRes?.id) finalRxId = rxRes.id;
        } catch (uploadErr) {
          console.warn('Prescription background upload status:', uploadErr);
        }
      }

      const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
      const cleanPrescriptionId = isUuid(finalRxId) ? finalRxId : null;

      // 4. Place Order via orderService (COD Only, No delivery speed toggle)
      const res = await orderService.placeOrder({
        items: cartItems,
        address: activeAddress,
        addressId: isUuid(addressId) ? addressId : undefined,
        paymentMethod: 'Cash on Delivery (COD)',
        deliverySlot: 'Standard Express (35-45 mins)',
        prescriptionId: hasPrescriptionRequiredItems ? cleanPrescriptionId : null,
        prescriptionFileName: attachedPrescriptionFile ? attachedPrescriptionFile.name : null,
        couponCode: appliedCoupon?.code,
        subtotal,
        totalMrp: subtotal,
        packagingFee: packagingFee || 6,
        platformFee: platformFee || 9,
        deliveryFee,
        discount,
        cashback,
        walletDeducted,
        total: finalTotalPayable,
      });

      if (res?.id) {
        setPlacedOrderResult(res);
        clearCart();
        addToast(`Order ${res.id} placed successfully with Cash on Delivery!`, 'success');
      } else {
        throw new Error('Order placement could not be completed. Please try again.');
      }
    } catch (err) {
      console.warn('Order placement notice:', err);
      const errorMsg = err.message || 'Unable to place order. Please review your order details.';
      addToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* ================= ORDER SUCCESS CONFIRMATION VIEW ================= */}
      {placedOrderResult ? (
        <div className="bg-surface-pure rounded-3xl p-8 sm:p-12 border border-brandBorder-subtle shadow-card max-w-2xl mx-auto text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-forest-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
              Order Confirmed &bull; Cash on Delivery
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-800 mt-1">
              Thank You! Your Order is Placed
            </h1>
            <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
              Order ID: <span className="font-bold text-forest-700">{placedOrderResult.id}</span>
            </p>
          </div>

          <div className="bg-forest-50/70 p-5 rounded-2xl border border-forest-100 text-left text-xs space-y-2.5 text-brandText-main">
            <div className="flex justify-between items-start gap-4">
              <span className="text-brandText-secondary shrink-0">Delivery Destination:</span>
              <span className="font-semibold text-right">{placedOrderResult.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Assigned Pharmacy Hub:</span>
              <span className="font-semibold">{placedOrderResult.pharmacy?.name || 'Oshud Wala Express Pharmacy'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Payment Method:</span>
              <span className="font-bold text-forest-800">Cash on Delivery (COD)</span>
            </div>
            {placedOrderResult.deliveryOtp && (
              <div className="flex justify-between items-center">
                <span className="text-brandText-secondary">Delivery Verification OTP:</span>
                <span className="font-mono font-bold text-sm text-forest-800 bg-white px-2 py-0.5 rounded border border-forest-200">
                  {placedOrderResult.deliveryOtp}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-forest-100">
              <span className="text-brandText-secondary">Total Payable Upon Handover:</span>
              <span className="font-bold text-forest-800 text-sm">₹{placedOrderResult.total}</span>
            </div>
            {placedOrderResult.prescriptionAttached && (
              <div className="flex justify-between items-center pt-1 border-t border-forest-100">
                <span className="text-brandText-secondary">Attached Prescription:</span>
                <span className="font-semibold text-forest-700 truncate max-w-[220px]">
                  {placedOrderResult.prescriptionAttached}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/shop')}
              className="flex-1"
            >
              Continue Shopping
            </Button>
            <Button
              variant="primary"
              size="lg"
              rightIcon={ArrowRight}
              onClick={() => navigate(`/orders?order=${placedOrderResult.id}`)}
              className="flex-1 shadow-card font-bold"
            >
              Track Order Live
            </Button>
          </div>
        </div>
      ) : (
        /* ================= CHECKOUT FORM ================= */
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Steps */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="p-2 rounded-full hover:bg-forest-100 text-forest-700 transition-colors"
                title="Back to Cart"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-heading font-extrabold text-forest-900">
                  Secure Checkout
                </h1>
                <p className="text-xs text-brandText-secondary">
                  Complete your delivery address and prescription verification
                </p>
              </div>
            </div>

            {/* ================= STEP 1: DELIVERY ADDRESS ================= */}
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-forest-900">
                      Select Delivery Address
                    </h3>
                    <p className="text-[11px] text-brandText-secondary">
                      Choose a saved address or enter manually with GPS location detection
                    </p>
                  </div>
                </div>

                {savedAddresses.length > 0 && (
                  <div>
                    {addressMode === 'saved' ? (
                      <button
                        type="button"
                        onClick={() => setAddressMode('new')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-forest-800 bg-forest-50 hover:bg-forest-100 border border-forest-200 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Address</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddressMode('saved')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-brandText-secondary hover:text-forest-900 hover:bg-surface-warm transition-colors"
                      >
                        <span>View Saved ({savedAddresses.length})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Loading Addresses Indicator */}
              {isLoadingAddresses ? (
                <div className="flex items-center justify-center p-8 bg-surface-pure rounded-2xl border border-brandBorder-subtle">
                  <div className="flex items-center gap-2.5 text-xs text-brandText-secondary">
                    <Loader2 className="w-4 h-4 animate-spin text-forest-700" />
                    <span>Loading saved addresses...</span>
                  </div>
                </div>
              ) : addressMode === 'saved' && savedAddresses.length > 0 ? (
                /* Mode A: Select From Saved Addresses */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      const isDeleting = deletingAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all relative group ${
                            isSelected
                              ? 'border-forest-600 bg-forest-50/70 shadow-sm ring-1 ring-forest-600/30'
                              : 'border-brandBorder-subtle hover:border-forest-300 bg-surface-pure'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-forest-800 uppercase px-2 py-0.5 rounded-full bg-forest-100 tracking-wide">
                                {addr.tag}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[9px] font-semibold text-forest-700 bg-forest-100/80 border border-forest-200 px-1.5 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleDeleteAddress(addr.id, e)}
                                disabled={isDeleting}
                                className="p-1 rounded-lg text-brandText-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Remove address"
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {isSelected ? (
                                <CheckCircle2 className="w-4 h-4 text-forest-700" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-brandBorder-subtle" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs font-bold text-forest-900">{addr.recipient}</p>
                          <p className="text-xs text-brandText-secondary mt-1 leading-relaxed">
                            {addr.address}
                          </p>
                          <p className="text-[11px] font-mono text-brandText-muted mt-1.5">
                            {addr.phone}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setAddressMode('new')}
                    className="w-full py-2.5 rounded-2xl border-2 border-dashed border-brandBorder-subtle hover:border-forest-500 text-xs font-bold text-forest-800 hover:bg-forest-50/40 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-forest-700" />
                    <span>Type New Address or Use GPS Location</span>
                  </button>
                </div>
              ) : (
                /* Mode B: Manual Typing with GPS Location System */
                <div className="space-y-4">
                  {/* GPS Detection Bar */}
                  <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
                        <Navigation className="w-4 h-4 text-forest-700" />
                        <span>Fast Address Autofill via GPS</span>
                      </p>
                      <p className="text-[11px] text-brandText-secondary mt-0.5">
                        Fetch your live coordinates to automatically fill street, city, and pincode
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isLocating}
                      onClick={handleGetGpsLocation}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-forest-800 hover:bg-forest-900 text-white transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Detecting GPS...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Detect via GPS Location</span>
                        </>
                      )}
                    </button>
                  </div>

                  {gpsCoords && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        GPS Coordinates acquired: <strong>{gpsCoords.latitude.toFixed(5)}° N, {gpsCoords.longitude.toFixed(5)}° E</strong>. Verified.
                      </span>
                    </div>
                  )}

                  {/* Manual Typing Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Recipient Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddressForm.fullName}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, fullName: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Contact Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={newAddressForm.phone}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      House / Flat / Street / Address Line 1 *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddressForm.line1}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, line1: e.target.value })}
                      placeholder="e.g. Flat 3B, Sunshine Apartments, Benachity Main Road"
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Area / Locality / Address Line 2
                      </label>
                      <input
                        type="text"
                        value={newAddressForm.line2}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, line2: e.target.value })}
                        placeholder="e.g. Near Big Bazaar, Sector 2"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={newAddressForm.landmark}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, landmark: e.target.value })}
                        placeholder="e.g. Opposite City Hospital"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddressForm.city}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                        placeholder="Durgapur"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddressForm.state}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                        placeholder="West Bengal"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={newAddressForm.pincode}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value })}
                        placeholder="713216"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Address Type and Save Checkbox */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-brandBorder-subtle">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-brandText-main mr-1">Label:</span>
                      {['Home', 'Work', 'Other'].map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setNewAddressForm({ ...newAddressForm, label: lbl })}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            newAddressForm.label === lbl
                              ? 'bg-forest-800 text-white shadow-sm'
                              : 'bg-surface-warm text-brandText-secondary hover:text-forest-900 border border-brandBorder-subtle'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-forest-900">
                      <input
                        type="checkbox"
                        checked={newAddressForm.saveAddress}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, saveAddress: e.target.checked })}
                        className="rounded border-brandBorder-subtle text-forest-700 focus:ring-forest-500 w-4 h-4"
                      />
                      <span>Save to my saved addresses</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    {savedAddresses.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAddressMode('saved')}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleSaveManualAddress}
                      disabled={isSavingAddress}
                      className="text-xs font-bold shadow-sm"
                    >
                      {isSavingAddress ? (
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Address...</span>
                        </div>
                      ) : (
                        <span>Save & Use This Address</span>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ================= STEP 2: PRESCRIPTION ATTACHMENT (REAL FILE UPLOAD) ================= */}
            {hasPrescriptionRequiredItems && (
              <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      2
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-forest-900">
                        Prescription Attachment
                      </h3>
                      <p className="text-xs text-amber-800 font-medium">
                        Required under CDSCO Schedule H regulations for: {rxItems.map((i) => i.name).join(', ')}
                      </p>
                    </div>
                  </div>

                  {existingPrescriptions.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-surface-warm p-1 rounded-xl border border-brandBorder-subtle text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setPrescriptionMode('upload')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          prescriptionMode === 'upload' ? 'bg-forest-800 text-white shadow-sm' : 'text-brandText-secondary'
                        }`}
                      >
                        Upload Document
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrescriptionMode('saved')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          prescriptionMode === 'saved' ? 'bg-forest-800 text-white shadow-sm' : 'text-brandText-secondary'
                        }`}
                      >
                        Previous Prescriptions ({existingPrescriptions.length})
                      </button>
                    </div>
                  )}
                </div>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handlePrescriptionFileChange(e.target.files[0]);
                    }
                  }}
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handlePrescriptionFileChange(e.target.files[0]);
                    }
                  }}
                />

                {prescriptionMode === 'upload' ? (
                  <div className="space-y-4">
                    {!attachedPrescriptionFile ? (
                      /* Drag & Drop Zone */
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handlePrescriptionFileChange(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-brandBorder-subtle hover:border-forest-500 rounded-3xl p-8 text-center bg-surface-warm/40 hover:bg-forest-50/30 transition-all cursor-pointer group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                          <Upload className="w-7 h-7" />
                        </div>
                        <p className="text-xs font-bold text-forest-900">
                          Click to browse or drag & drop doctor's prescription file here
                        </p>
                        <p className="text-[11px] text-brandText-secondary mt-1">
                          Supported formats: PDF, JPG, JPEG, PNG, WEBP (Max size: 10MB)
                        </p>

                        <div className="flex items-center justify-center gap-2.5 mt-5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 text-xs font-bold bg-forest-800 text-white rounded-xl hover:bg-forest-900 transition-colors shadow-sm flex items-center gap-2"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Browse Device Files</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="px-4 py-2 text-xs font-bold bg-surface-pure text-forest-800 border border-brandBorder-subtle rounded-xl hover:bg-surface-warm transition-colors flex items-center gap-2"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Take Photo</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Attached File Card */
                      <div className="p-4 rounded-2xl border border-forest-200 bg-forest-50/70 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {prescriptionPreviewUrl ? (
                            <img
                              src={prescriptionPreviewUrl}
                              alt="Prescription preview"
                              onClick={() => setShowPreviewModal(true)}
                              className="w-16 h-16 rounded-xl object-cover border border-forest-200 cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                              <FileText className="w-8 h-8" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-forest-900 truncate">
                                {attachedPrescriptionFile.name}
                              </p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Attached
                              </span>
                            </div>
                            <p className="text-[11px] text-brandText-secondary mt-0.5">
                              {(attachedPrescriptionFile.size / 1024).toFixed(1)} KB &bull;{' '}
                              {attachedPrescriptionFile.type || 'Document'}
                            </p>
                            {prescriptionPreviewUrl && (
                              <button
                                type="button"
                                onClick={() => setShowPreviewModal(true)}
                                className="text-[11px] font-bold text-forest-700 hover:text-forest-900 inline-flex items-center gap-1 mt-1.5 underline"
                              >
                                <Eye className="w-3 h-3" /> View Prescription Image
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 text-xs font-bold text-forest-800 bg-white border border-forest-200 rounded-xl hover:bg-forest-50 transition-colors"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={handleRemovePrescription}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                            title="Remove attached prescription"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {prescriptionError && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{prescriptionError}</span>
                      </p>
                    )}

                    {/* Patient Notes */}
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Special Instructions for Dispensing Pharmacist (Optional)
                      </label>
                      <input
                        type="text"
                        value={patientNotes}
                        onChange={(e) => setPatientNotes(e.target.value)}
                        placeholder="e.g. Please dispense 10-tablet strip, or substitute with generic brand if primary is out of stock"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                      />
                    </div>
                  </div>
                ) : (
                  /* Mode B: Real Previous Prescriptions (Only if user has actual saved ones) */
                  <div className="space-y-2.5">
                    {existingPrescriptions.map((rx) => (
                      <label
                        key={rx.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          selectedPrescriptionId === rx.id
                            ? 'border-forest-600 bg-forest-50/70 shadow-sm'
                            : 'border-brandBorder-subtle bg-surface-warm/40 hover:border-forest-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="radio"
                            name="selectedPrescription"
                            value={rx.id}
                            checked={selectedPrescriptionId === rx.id}
                            onChange={(e) => {
                              setSelectedPrescriptionId(e.target.value);
                              setAttachedPrescriptionFile(null);
                            }}
                            className="text-forest-600 focus:ring-forest-500 w-4 h-4"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-forest-900 truncate">{rx.fileName}</p>
                            <p className="text-[11px] text-brandText-secondary truncate">
                              Ref: {rx.id} &bull; {rx.pharmacyName}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                          {rx.status || 'VERIFIED'}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 3 (OR 2): PAYMENT METHOD (COD ONLY) ================= */}
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-forest-800 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {hasPrescriptionRequiredItems ? '3' : '2'}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-forest-900">
                    Payment Method
                  </h3>
                  <p className="text-[11px] text-brandText-secondary">
                    Cash on Delivery is currently available for all destinations
                  </p>
                </div>
              </div>

              {/* Single COD Card */}
              <div className="p-4 rounded-2xl border-2 border-forest-600 bg-forest-50/70 shadow-sm flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-forest-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-extrabold text-forest-900">Cash on Delivery (COD)</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-800 text-white uppercase tracking-wider">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-brandText-secondary mt-1 leading-relaxed">
                      Pay cash to the delivery rider or scan their UPI QR code upon handover and medicine verification.
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-forest-700 shrink-0 mt-1" />
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Button */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4 sticky top-28">
              <h3 className="font-heading font-bold text-base text-forest-900">
                Order Items ({cartItems.length})
              </h3>

              <div className="max-h-56 overflow-y-auto space-y-3 pr-1 divide-y divide-brandBorder-light">
                {cartItems.map((item) => (
                  <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-forest-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-brandText-secondary">
                        Qty: {item.quantity} {item.prescriptionRequired && <span className="text-amber-700 font-bold">&bull; Rx</span>}
                      </p>
                    </div>
                    <span className="font-semibold text-brandText-main flex-shrink-0">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Wallet Usage Option (Rule i: Not on Rx drugs) */}
              {walletBalance > 0 && (
                <div className="p-3 bg-forest-50/80 rounded-2xl border border-forest-200/80 space-y-1.5 mt-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-forest-900">
                      <input
                        type="checkbox"
                        checked={useWalletBalance}
                        disabled={maxWalletDeduction <= 0}
                        onChange={(e) => setUseWalletBalance(e.target.checked)}
                        className="rounded border-forest-300 text-forest-700 focus:ring-forest-500 w-4 h-4"
                      />
                      <span>Pay with Wallet Balance</span>
                    </label>
                    <span className="font-mono font-bold text-xs text-forest-800">
                      ₹{walletBalance.toFixed(2)}
                    </span>
                  </div>
                  {maxWalletDeduction > 0 ? (
                    <p className="text-[10px] text-emerald-700 pl-6">
                      ₹{maxWalletDeduction.toFixed(2)} eligible against non-prescription essentials.
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-700 pl-6 leading-tight">
                      Wallet balance cannot be applied to Schedule H prescription medicines under CDSCO regulations.
                    </p>
                  )}
                </div>
              )}

              {/* Promo & Coupon Offers Section */}
              <div className="p-3.5 bg-forest-50/70 rounded-2xl border border-forest-200/80 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-forest-900">
                    <Tag className="w-3.5 h-3.5 text-forest-700" />
                    <span>Coupons & Offers</span>
                  </label>
                  {availableCoupons.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowOffers(!showOffers)}
                      className="text-[11px] font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 hover:underline transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{availableCoupons.length} Offers Available</span>
                      {showOffers ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 flex items-center justify-between animate-fadeIn">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="font-mono font-black text-xs text-emerald-900 tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                          APPLIED
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        {appliedCoupon.label || `Saved ₹${discount.toFixed(2)} on this order`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        placeholder="ENTER COUPON CODE"
                        className="flex-1 px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-xl border border-brandBorder-subtle bg-surface-pure focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-600 tracking-wider placeholder:tracking-normal placeholder:font-normal placeholder:text-brandText-muted"
                      />
                      <button
                        type="button"
                        disabled={!couponInput.trim() || isApplyingCoupon}
                        onClick={() => handleApplyCoupon()}
                        className="px-4 py-1.5 bg-forest-800 hover:bg-forest-900 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center min-w-[70px]"
                      >
                        {isApplyingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <div className="p-2 bg-red-50 rounded-xl border border-red-200 flex items-start gap-1.5 text-[11px] text-red-700 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-600" />
                        <span>{couponError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Available Offers Drawer / Accordion */}
                {showOffers && availableCoupons.length > 0 && (
                  <div className="p-2 bg-surface-pure rounded-xl border border-forest-200 space-y-2 mt-2 max-h-56 overflow-y-auto">
                    <p className="text-[10px] font-bold text-forest-800 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Available Coupons for your order
                    </p>
                    <div className="space-y-2">
                      {availableCoupons.map((coupon) => {
                        const minOrderRupees = coupon.minOrderPaise ? coupon.minOrderPaise / 100 : 0;
                        const isEligible = subtotal >= minOrderRupees;
                        const diffRupees = minOrderRupees - subtotal;
                        const isCurrentlyApplied = appliedCoupon?.code === coupon.code;

                        let discountText = '';
                        if (coupon.discountType === 'PERCENT') {
                          discountText = `${coupon.discountValue}% OFF`;
                          if (coupon.maxDiscountPaise) {
                            discountText += ` (up to ₹${coupon.maxDiscountPaise / 100})`;
                          }
                        } else {
                          const flatVal = coupon.discountValue > 500 ? coupon.discountValue / 100 : coupon.discountValue;
                          discountText = `Flat ₹${flatVal} OFF`;
                        }

                        return (
                          <div
                            key={coupon.id || coupon.code}
                            className={`p-2.5 rounded-xl border text-xs transition-all ${
                              isCurrentlyApplied
                                ? 'bg-emerald-50/80 border-emerald-400 shadow-sm'
                                : isEligible
                                ? 'bg-forest-50/40 border-forest-200 hover:border-forest-400'
                                : 'bg-gray-50 border-gray-200 opacity-80'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-black text-xs text-forest-900 bg-forest-100 px-2 py-0.5 rounded border border-forest-300 tracking-wider">
                                {coupon.code}
                              </span>
                              {isCurrentlyApplied ? (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Applied
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={!isEligible || isApplyingCoupon}
                                  onClick={() => handleApplyCoupon(coupon.code)}
                                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-forest-800 hover:bg-forest-900 disabled:bg-gray-200 text-white disabled:text-gray-400 transition-colors"
                                >
                                  Apply
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] font-bold text-forest-900 mt-1">
                              {discountText}
                            </p>
                            {coupon.description && (
                              <p className="text-[10px] text-brandText-secondary line-clamp-1 mt-0.5">
                                {coupon.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-[10px] text-brandText-secondary mt-1.5 pt-1 border-t border-brandBorder-subtle/40 font-mono">
                              <span>
                                {minOrderRupees > 0 ? `Min: ₹${minOrderRupees}` : 'No min order'}
                              </span>
                              {!isEligible && diffRupees > 0 ? (
                                <span className="text-amber-700 font-bold font-sans">
                                  Add ₹{Math.ceil(diffRupees)} more
                                </span>
                              ) : coupon.validTo ? (
                                <span className="text-forest-700 font-sans">
                                  Valid till {new Date(coupon.validTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bill Breakdown */}
              <div className="pt-3 border-t border-brandBorder-subtle space-y-1.5 text-xs text-brandText-secondary font-mono">
                <div className="flex justify-between">
                  <span>Total MRP / Subtotal</span>
                  <span className="font-semibold text-brandText-main">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Packaging Charges (Fixed)</span>
                  <span className="font-semibold text-brandText-main">₹{(packagingFee || 6).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee (Tiered)</span>
                  <span className="font-semibold text-brandText-main">₹{(platformFee || 9).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-brandText-main">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold font-sans">FREE</span>
                    ) : (
                      `₹${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                {walletDeducted > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Wallet Balance Applied</span>
                    <span>-₹{walletDeducted.toFixed(2)}</span>
                  </div>
                )}
                {cashback > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold bg-emerald-100/70 p-1.5 rounded-lg text-[10px] font-sans">
                    <span>Wallet Cashback (2%):</span>
                    <span className="font-mono">+₹{cashback.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t-2 border-forest-300 flex justify-between text-base font-heading font-extrabold text-forest-900 font-sans">
                  <span>Total Payable (COD)</span>
                  <span className="text-forest-800 text-lg font-mono">₹{finalTotalPayable.toFixed(2)}</span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full shadow-card font-bold text-xs sm:text-sm"
              >
                Confirm & Place Order (COD)
              </Button>

              <div className="flex items-center gap-1.5 text-[11px] text-brandText-secondary justify-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                <span>Zero Advance Risk &bull; Certified Pharmacy Seal</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ================= MODAL: PRESCRIPTION IMAGE PREVIEW ================= */}
      {showPreviewModal && prescriptionPreviewUrl && (
        <div
          className="fixed inset-0 z-50 bg-forest-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="bg-surface-pure rounded-3xl p-5 max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-floating border border-brandBorder-subtle animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-forest-700" />
                <h4 className="font-heading font-bold text-sm text-forest-900">
                  Prescription Document Preview
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg text-brandText-muted hover:text-forest-900 hover:bg-surface-warm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 overflow-auto flex-1 flex items-center justify-center bg-surface-warm rounded-2xl mt-3">
              <img
                src={prescriptionPreviewUrl}
                alt="Prescription preview enlarged"
                className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-sm"
              />
            </div>

            <div className="pt-3 border-t border-brandBorder-subtle flex items-center justify-between text-xs text-brandText-secondary mt-3">
              <span>{attachedPrescriptionFile?.name}</span>
              <Button size="sm" variant="outline" onClick={() => setShowPreviewModal(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
