import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bike,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CreditCard,
  Camera,
  RotateCcw,
  TrendingUp,
  Calendar,
  Save,
  CheckCircle2,
  DollarSign,
  Award,
  Sparkles,
  QrCode,
  KeyRound,
  Package,
  Building2,
  AlertCircle,
  RefreshCw,
  Clock,
  ChevronRight,
  Receipt,
  History,
} from 'lucide-react';
import Button from '../../components/common/Button';
import MetricCard from '../../components/workspace/MetricCard';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { riderApi, getRiderAvatar } from '../../services/api/rider.api';
import { deliveryApi } from '../../services/api/delivery.api';
import { notificationApi } from '../../services/api/notification.api';
import PharmacyPickupModal from '../../components/rider/PharmacyPickupModal';
import DeliveryOtpModal from '../../components/rider/DeliveryOtpModal';

export const RiderProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { orders, verifyPickup, completeDelivery } = useWorkspaceStore();
  const fileInputRef = useRef(null);

  // Active Tab: 'assigned' | 'profile' | 'earnings'
  const [activeTab, setActiveTab] = useState('assigned');

  // Rider Profile Form state
  const [profileData, setProfileData] = useState(() => riderApi.getRiderProfile(user?.id, user));
  const [isSaving, setIsSaving] = useState(false);
  const [customPicUrl, setCustomPicUrl] = useState(profileData.customPic || '');

  // Metrics state
  const [metrics, setMetrics] = useState(() => riderApi.getRiderMetrics(user?.id, user));

  // Assigned Deliveries state
  const [backendDeliveries, setBackendDeliveries] = useState([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);

  // Modal triggers
  const [pickupModalOrder, setPickupModalOrder] = useState(null);
  const [deliveryOtpModalOrder, setDeliveryOtpModalOrder] = useState(null);

  // Fetch real backend deliveries assigned to this rider
  const fetchMyDeliveries = async () => {
    setIsLoadingDeliveries(true);
    try {
      const res = await deliveryApi.getMyDeliveries();
      const raw = Array.isArray(res) ? res : res?.deliveries || [];
      let mapped = raw.map((d) => {
        const ord = d.order || {};
        const addr = ord.deliveryAddress || {};
        const fullAddress = [addr.line1, addr.area, addr.city, addr.pincode]
          .filter(Boolean)
          .join(', ');
        const qrToken =
          d.pickupQr?.qrToken ||
          d.batch?.pickupQrs?.[0]?.qrToken ||
          d.qrToken ||
          ord.pickupQrCode ||
          ord.id;

        return {
          id: ord.orderNumber || ord.id,
          backendId: ord.id,
          deliveryId: d.id,
          status: ord.status, // READY_FOR_PICKUP, RIDER_ASSIGNED, OUT_FOR_DELIVERY, DELIVERED
          deliveryStatus: d.status,
          total: (ord.totalPaise || 0) / 100,
          subtotal: (ord.subtotalPaise || 0) / 100,
          paymentMethod: ord.paymentMethod || 'COD',
          paymentStatus: ord.paymentStatus || 'PENDING',
          customerName: addr.fullName || 'Registered Patient',
          customerPhone: addr.phone || '9876543210',
          address: fullAddress || 'Direct Patient Delivery Address',
          area: addr.area || 'Kolkata Metropolitan Area',
          landmark: addr.landmark || '',
          pharmacyName: ord.pharmacy?.name || 'Primary Pharmacy Hub',
          pharmacyAddress: ord.pharmacy?.line1 || 'Dispensary Hub',
          pharmacyPhone: ord.pharmacy?.phone || '',
          pickupQrCode: qrToken,
          deliveryOtp: 'Verified at Doorstep',
          items: (ord.items || []).map((it) => ({
            id: it.id,
            name: it.nameSnapshot || it.name || 'Prescription Medicine',
            quantity: it.quantity || 1,
            price: (it.unitPricePaise || it.mrpPaise || 0) / 100,
            lineTotal: (it.lineTotalPaise || 0) / 100,
            requiresPrescription: it.requiresPrescription,
          })),
        };
      });

      // Notification sync fallback
      if (mapped.length === 0) {
        try {
          const notifsRes = await notificationApi.getNotifications({ category: 'DELIVERY' }, user);
          const notifItems = notifsRes?.items || [];
          const assignNotifs = notifItems.filter((n) =>
            (n.desc || n.body || '').toLowerCase().includes('assigned to you')
          );
          assignNotifs.forEach((n) => {
            const bodyText = n.desc || n.body || '';
            const match = bodyText.match(/Order\s+([A-Za-z0-9-]+)\s+assigned/i);
            const orderIdFromNotif = n.data?.orderId || match?.[1] || 'Assigned Order';
            // Do NOT resurrect if order is already delivered in workspace
            const isAlreadyDelivered = (orders || []).some(
              (wo) =>
                (wo.id === orderIdFromNotif ||
                  wo.backendId === orderIdFromNotif ||
                  wo.orderNumber === orderIdFromNotif) &&
                wo.status === 'DELIVERED'
            );
            if (isAlreadyDelivered) return;

            if (!mapped.some((m) => m.id === orderIdFromNotif || m.backendId === orderIdFromNotif)) {
              mapped.push({
                id: orderIdFromNotif,
                backendId: orderIdFromNotif,
                deliveryId: 'notif-' + n.id,
                status: 'RIDER_ASSIGNED',
                total: 0,
                paymentMethod: 'COD',
                customerName: 'Customer',
                customerPhone: '',
                address: 'Prescription Handover / Customer Address',
                area: 'Kolkata Metropolitan Area',
                landmark: '',
                pharmacyName: 'Primary Medicine Hub',
                pharmacyAddress: 'Kolkata Dispensary Hub',
                pharmacyPhone: '',
                pickupQrCode: orderIdFromNotif,
                deliveryOtp: '9876',
                items: [],
              });
            }
          });
        } catch (e) {}
      }

      setBackendDeliveries(mapped);
    } catch (err) {
      console.warn('Backend getMyDeliveries notice:', err.message);
    } finally {
      setIsLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    fetchMyDeliveries();
  }, [user]);

  useEffect(() => {
    const handleStatusSync = (e) => {
      const { orderId, status } = e.detail || {};
      if (orderId && status) {
        setBackendDeliveries((prev) =>
          prev.map((d) =>
            d.id === orderId || d.backendId === orderId || d.orderNumber === orderId
              ? { ...d, status }
              : d
          )
        );
        fetchMyDeliveries();
      }
    };
    const handleStorageSync = (e) => {
      if (e.key === 'oshud_workspace_orders' || e.key === 'oshud_last_status_event') {
        fetchMyDeliveries();
      }
    };
    window.addEventListener('oshud_order_status_updated', handleStatusSync);
    window.addEventListener('storage', handleStorageSync);
    return () => {
      window.removeEventListener('oshud_order_status_updated', handleStatusSync);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  // Merge backend deliveries with local workspace store orders assigned to this rider
  const allAssignedOrders = React.useMemo(() => {
    const cleanUserPhone = (user?.phone || profileData.phone || '').replace(/[^0-9]/g, '');
    const cleanUserId = user?.id || profileData.id;
    const cleanUserName = (user?.fullName || user?.name || profileData.name || '').toLowerCase().trim();

    const matchedWorkspace = (orders || []).filter((o) => {
      const riderPhone = (o.assignedRider?.phone || '').replace(/[^0-9]/g, '');
      const riderId = o.assignedRider?.id;
      const riderName = (o.assignedRider?.name || '').toLowerCase().trim();
      return (
        (riderId && (riderId === cleanUserId || riderId === user?.id)) ||
        (cleanUserPhone && riderPhone && (riderPhone.slice(-10) === cleanUserPhone.slice(-10) || cleanUserPhone.includes(riderPhone))) ||
        (cleanUserName && riderName && (cleanUserName.includes(riderName) || riderName.includes(cleanUserName))) ||
        (o.status === 'RIDER_ASSIGNED')
      );
    });

    const map = new Map();
    // Prefer backend delivery records first
    backendDeliveries.forEach((d) => map.set(d.backendId || d.id, d));

    matchedWorkspace.forEach((o) => {
      if (!map.has(o.backendId || o.id)) {
        map.set(o.backendId || o.id, {
          id: o.id,
          backendId: o.backendId || o.id,
          status: o.status,
          total: o.total || 0,
          paymentMethod: o.paymentMethod || 'COD',
          customerName: o.customerName || 'Registered Patient',
          customerPhone: o.customerPhone || '',
          address: o.address || 'Kolkata Delivery Address',
          area: o.area || 'Kolkata Metropolitan Area',
          landmark: o.landmark || '',
          pharmacyName: o.pharmacyName || 'Fulfillment Pharmacy',
          pharmacyAddress: o.pharmacyAddress || 'Hub Counter',
          pharmacyPhone: o.pharmacyPhone || '',
          pickupQrCode: o.pickupQrCode || o.id,
          deliveryOtp: o.deliveryOtp || '9876',
          items: o.items || [],
        });
      }
    });

    return Array.from(map.values());
  }, [backendDeliveries, orders, user, profileData]);

  const activeDeliveries = allAssignedOrders.filter((o) =>
    ['READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'SHIPPED', 'PICKED_UP', 'ASSIGNED'].includes(o.status)
  );

  // Sync profile & metrics updates
  useEffect(() => {
    const handleUpdate = () => {
      setProfileData(riderApi.getRiderProfile(user?.id, user));
      setMetrics(riderApi.getRiderMetrics(user?.id, user));
    };

    window.addEventListener('oshud_rider_profile_updated', handleUpdate);
    window.addEventListener('oshud_rider_finance_updated', handleUpdate);

    return () => {
      window.removeEventListener('oshud_rider_profile_updated', handleUpdate);
      window.removeEventListener('oshud_rider_finance_updated', handleUpdate);
    };
  }, [user]);

  // Handle Avatar changes
  const handleGenderChange = (newGender) => {
    setProfileData((prev) => {
      const next = { ...prev, gender: newGender };
      if (!prev.customPic) {
        next.avatar = getRiderAvatar(newGender, null);
      }
      return next;
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('Profile image must be less than 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (result) {
          setCustomPicUrl(result);
          setProfileData((prev) => ({
            ...prev,
            customPic: result,
            avatar: result,
          }));
          addToast('Custom photo selected. Click Save to persist.', 'info');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefaultAvatar = () => {
    setCustomPicUrl('');
    setProfileData((prev) => ({
      ...prev,
      customPic: '',
      avatar: getRiderAvatar(prev.gender, null),
    }));
    addToast('Reset to default gender courier icon.', 'info');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await riderApi.updateRiderProfile(user?.id, {
        ...profileData,
        customPic: customPicUrl,
        avatar: customPicUrl || getRiderAvatar(profileData.gender, null),
      });
      setProfileData(updated);
      addToast('Rider profile and vehicle details updated successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Pickup verified by authenticated scanner
  const handlePickupVerified = (orderId, pickupCode, verifiedResult) => {
    const verifiedOrders = verifiedResult?.orders || [];
    const verifiedItems = verifiedOrders[0]?.items || [];

    // 1. Update local workspace store with verified medicine list
    verifyPickup(orderId, pickupCode, verifiedItems);

    // 2. Update local state
    setBackendDeliveries((prev) =>
      prev.map((d) =>
        d.id === orderId || d.backendId === orderId
          ? {
              ...d,
              status: 'OUT_FOR_DELIVERY',
              items: verifiedItems.length > 0 ? verifiedItems : d.items,
            }
          : d
      )
    );

    // 3. Broadcast status event across all windows & tabs
    window.dispatchEvent(
      new CustomEvent('oshud_order_status_updated', {
        detail: { orderId, status: 'OUT_FOR_DELIVERY', pickupCode, verifiedItems },
      })
    );
    try {
      localStorage.setItem(
        'oshud_last_status_event',
        JSON.stringify({ orderId, status: 'OUT_FOR_DELIVERY', time: Date.now() })
      );
    } catch (e) {}

    addToast(
      `Handover authenticated! Parcel for Order ${orderId} unlocked. Medicine list verified.`,
      'success'
    );
    setPickupModalOrder(null);
  };

  // Handover completed with customer OTP
  const handleDeliveryConfirmed = async (orderId, otp, amount, paymentMethod = 'COD') => {
    try {
      // 1. Call backend to mark delivery & order as DELIVERED in the database
      const targetOrder = allAssignedOrders.find(
        (o) => o.id === orderId || o.backendId === orderId || o.orderNumber === orderId
      );
      const deliveryLookupId = targetOrder?.deliveryId || targetOrder?.backendId || orderId;
      await deliveryApi.completeDelivery(deliveryLookupId, otp, paymentMethod);

      // 2. Update workspace store
      completeDelivery(orderId, otp, amount, paymentMethod);

      // 3. Update local deliveries state
      setBackendDeliveries((prev) =>
        prev.map((d) =>
          d.id === orderId || d.backendId === orderId || d.orderNumber === orderId || d.deliveryId === deliveryLookupId
            ? { ...d, status: 'DELIVERED', paymentMethod }
            : d
        )
      );

      // 4. Broadcast status event across all windows & tabs
      window.dispatchEvent(
        new CustomEvent('oshud_order_status_updated', {
          detail: { orderId, backendId: targetOrder?.backendId, orderNumber: targetOrder?.orderNumber, status: 'DELIVERED', otp, paymentMethod },
        })
      );
      try {
        localStorage.setItem(
          'oshud_last_status_event',
          JSON.stringify({ orderId, status: 'DELIVERED', paymentMethod, time: Date.now() })
        );
      } catch (e) {}

      setDeliveryOtpModalOrder(null);
      await fetchMyDeliveries();
      addToast(
        `Order ${orderId} delivered successfully! Payment method verified (${paymentMethod === 'UPI' ? 'UPI / QR' : 'Cash on Delivery'}).`,
        'success'
      );
    } catch (err) {
      addToast(err.message || 'Failed to complete delivery', 'error');
      throw err;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Rider Operations & Fleet Profile
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Active order dispatches, authenticated pickup QR scanner, vehicle records, and earnings ledger.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchMyDeliveries}
          isLoading={isLoadingDeliveries}
          className="text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDeliveries ? 'animate-spin' : ''}`} />
          <span>Sync Assigned Orders</span>
        </Button>
      </div>

      {/* Profile, Assignments & Earnings Tabs */}
      <div className="flex border-b border-brandBorder-subtle gap-2 text-sm font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-forest-700 text-forest-900'
              : 'border-transparent text-brandText-secondary hover:text-forest-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Courier Identity & Vehicle</span>
        </button>
      </div>

      {/* TAB 2: RIDER IDENTITY & VEHICLE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar & Gender Icon Selector Section */}
          <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card space-y-5">
            <h2 className="font-heading font-bold text-base text-forest-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-forest-700" />
              <span>Rider Avatar & Visual Identity</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative group">
                <img
                  src={profileData.avatar}
                  alt="Rider Avatar"
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-forest-600 bg-forest-50 p-1 shadow-card"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-xl bg-forest-800 text-white hover:bg-forest-900 shadow-md transition-transform active:scale-95"
                  title="Upload Custom Image"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div>
                  <p className="text-xs font-bold text-forest-900">
                    Gender-Based Courier Icon
                  </p>
                  <p className="text-xs text-brandText-secondary mt-0.5">
                    Select your gender to display the official male or female courier icon, or upload your own photo.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-forest-800 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={profileData.gender === 'male'}
                      onChange={() => handleGenderChange('male')}
                      className="accent-forest-700"
                    />
                    <span>Male Courier Icon</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-forest-800 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={profileData.gender === 'female'}
                      onChange={() => handleGenderChange('female')}
                      className="accent-forest-700"
                    />
                    <span>Female Courier Icon</span>
                  </label>

                  {customPicUrl && (
                    <button
                      type="button"
                      onClick={handleResetToDefaultAvatar}
                      className="px-3 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Gender Icon</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card space-y-4">
            <h2 className="font-heading font-bold text-base text-forest-900 flex items-center gap-2">
              <User className="w-4 h-4 text-forest-700" />
              <span>Personal Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-forest-800">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-semibold bg-surface-warm focus:outline-none focus:border-forest-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Phone Number (SMS & WhatsApp)</label>
                <input
                  type="tel"
                  required
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-mono font-semibold bg-surface-warm focus:outline-none focus:border-forest-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Email Address</label>
                <input
                  type="email"
                  required
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-semibold bg-surface-warm focus:outline-none focus:border-forest-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Operating Zone / Hub</label>
                <input
                  type="text"
                  required
                  value={profileData.zone}
                  onChange={(e) => setProfileData({ ...profileData, zone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-semibold bg-surface-warm focus:outline-none focus:border-forest-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-forest-800">Residential Address</label>
                <input
                  type="text"
                  required
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-semibold bg-surface-warm focus:outline-none focus:border-forest-500"
                />
              </div>
            </div>
          </div>

          {/* Vehicle & License Information */}
          <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card space-y-4">
            <h2 className="font-heading font-bold text-base text-forest-900 flex items-center gap-2">
              <Bike className="w-4 h-4 text-forest-700" />
              <span>Vehicle & License Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-forest-800">Vehicle Type & Model</label>
                <select
                  value={profileData.vehicleType}
                  onChange={(e) => setProfileData({ ...profileData, vehicleType: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-semibold bg-surface-warm focus:outline-none focus:border-forest-500"
                >
                  <option value="Electric Two-Wheeler (Hero Optima)">Electric Two-Wheeler (Hero Optima)</option>
                  <option value="Electric Scooter (Ather / Ola)">Electric Scooter (Ather / Ola)</option>
                  <option value="Motorcycle (Hero Splendor / Pulsar)">Motorcycle (Hero Splendor / Pulsar)</option>
                  <option value="Scooter (Honda Activa / TVS)">Scooter (Honda Activa / TVS)</option>
                  <option value="Delivery Bicycle">Delivery Bicycle</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Vehicle Registration Number</label>
                <input
                  type="text"
                  required
                  value={profileData.vehicleNumber}
                  onChange={(e) => setProfileData({ ...profileData, vehicleNumber: e.target.value.toUpperCase() })}
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-mono font-bold uppercase bg-surface-warm focus:outline-none focus:border-forest-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Driving License Number</label>
                <input
                  type="text"
                  required
                  value={profileData.licenseNumber}
                  onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value.toUpperCase() })}
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-mono font-bold uppercase bg-surface-warm focus:outline-none focus:border-forest-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Linked UPI ID (For Payouts)</label>
                <input
                  type="text"
                  required
                  value={profileData.upiId}
                  onChange={(e) => setProfileData({ ...profileData, upiId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-mono font-semibold bg-surface-warm focus:outline-none focus:border-forest-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={Save}
              disabled={isSaving}
              className="text-xs font-bold px-6 shadow-md"
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      )}

      {/* Authenticated Pharmacy Pickup Scanner Modal */}
      {pickupModalOrder && (
        <PharmacyPickupModal
          order={pickupModalOrder}
          isOpen={Boolean(pickupModalOrder)}
          onClose={() => setPickupModalOrder(null)}
          onVerifySuccess={handlePickupVerified}
        />
      )}

      {/* Customer Delivery OTP Modal */}
      {deliveryOtpModalOrder && (
        <DeliveryOtpModal
          order={deliveryOtpModalOrder}
          isOpen={Boolean(deliveryOtpModalOrder)}
          onClose={() => setDeliveryOtpModalOrder(null)}
          onConfirmDelivery={handleDeliveryConfirmed}
        />
      )}
    </div>
  );
};

export default RiderProfilePage;
