import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  CheckCircle2,
  MapPin,
  Building2,
  Phone,
  Receipt,
  Coins,
  ShieldCheck,
  RefreshCw,
  Bike,
  Search,
  Calendar,
} from 'lucide-react';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import deliveryApi from '../../services/api/delivery.api';

export const RiderHistoryPage = () => {
  const { user } = useAuth();
  const { orders } = useWorkspaceStore();

  const [backendDeliveries, setBackendDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCompletedDeliveries = async () => {
    setIsLoading(true);
    try {
      const res = await deliveryApi.getMyDeliveries();
      const raw = Array.isArray(res) ? res : res?.deliveries || [];
      const mapped = raw.map((d) => {
        const ord = d.order || {};
        const addr = ord.deliveryAddress || {};
        const fullAddress = [addr.line1, addr.area, addr.city, addr.pincode].filter(Boolean).join(', ');
        return {
          id: ord.orderNumber || ord.id || d.id,
          backendId: ord.id,
          deliveryId: d.id,
          status: ord.status || d.status,
          deliveryStatus: d.status,
          total: (ord.totalPaise || 0) / 100,
          subtotal: (ord.subtotalPaise || 0) / 100,
          paymentMethod: ord.paymentMethod || 'COD',
          paymentStatus: ord.paymentStatus || 'COLLECTED',
          customerName: addr.fullName || 'Registered Patient',
          customerPhone: addr.phone || '',
          address: fullAddress || 'Direct Patient Delivery Address',
          area: addr.area || 'Kolkata Metropolitan Area',
          landmark: addr.landmark || '',
          pharmacyName: ord.pharmacy?.name || 'Primary Pharmacy Hub',
          pharmacyAddress: [ord.pharmacy?.line1, ord.pharmacy?.city].filter(Boolean).join(', ') || 'Dispensary Hub',
          pharmacyPhone: ord.pharmacy?.phone || '',
          items: (ord.items || []).map((it) => ({
            id: it.id,
            name: it.nameSnapshot || it.name || 'Prescription Medicine',
            quantity: it.quantity || 1,
            price: (it.unitPricePaise || it.mrpPaise || 0) / 100,
            lineTotal: (it.lineTotalPaise || 0) / 100,
            requiresPrescription: it.requiresPrescription,
          })),
          deliveredAt: d.deliveredAt || ord.deliveredAt || ord.updatedAt || new Date().toISOString(),
        };
      });
      setBackendDeliveries(mapped);
    } catch (err) {
      console.warn('Failed to load completed deliveries:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedDeliveries();
  }, [user]);

  // Real-time cross-tab sync when deliveries are completed
  useEffect(() => {
    const handleSync = (e) => {
      fetchCompletedDeliveries();
    };

    window.addEventListener('oshud_order_status_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('oshud_order_status_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Merge backend completed deliveries with workspace store completed orders
  const completedDeliveries = useMemo(() => {
    const map = new Map();

    // 1. Add real backend delivered records first
    backendDeliveries
      .filter((d) => d.status === 'DELIVERED' || d.deliveryStatus === 'DELIVERED')
      .forEach((d) => map.set(d.id, d));

    // 2. Overlay workspace delivered orders assigned to this rider
    const cleanUserId = user?.id;
    const cleanUserPhone = (user?.phone || '').replace(/[^0-9]/g, '');
    const cleanUserName = (user?.fullName || user?.name || '').toLowerCase().trim();

    (orders || [])
      .filter((o) => o.status === 'DELIVERED')
      .forEach((o) => {
        const key = o.orderNumber || o.id;
        const riderId = o.assignedRider?.id;
        const riderPhone = (o.assignedRider?.phone || '').replace(/[^0-9]/g, '');
        const riderName = (o.assignedRider?.name || '').toLowerCase().trim();

        const isMatch =
          !o.assignedRider ||
          (riderId && (riderId === cleanUserId || riderId === user?.id)) ||
          (cleanUserPhone && riderPhone && riderPhone.slice(-10) === cleanUserPhone.slice(-10)) ||
          (cleanUserName && riderName && cleanUserName.includes(riderName));

        if (isMatch && !map.has(key)) {
          map.set(key, {
            id: o.orderNumber || o.id,
            backendId: o.backendId || o.id,
            status: 'DELIVERED',
            total: Number(o.total || 0),
            subtotal: Number(o.subtotal || o.total || 0),
            paymentMethod: o.paymentMethod || 'COD',
            paymentStatus: 'COLLECTED',
            customerName: o.customerName || 'Registered Patient',
            customerPhone: o.customerPhone || '',
            address: o.address || 'Direct Patient Delivery Address',
            area: o.area || 'Kolkata Metropolitan Area',
            pharmacyName: o.pharmacyName || 'Partner Pharmacy Hub',
            pharmacyAddress: o.pharmacyAddress || 'Dispensary Counter',
            pharmacyPhone: o.pharmacyPhone || '',
            items: o.items || [],
            deliveredAt: o.deliveredAt || o.updatedAt || new Date().toISOString(),
          });
        }
      });

    return Array.from(map.values());
  }, [backendDeliveries, orders, user]);

  // Filtered by search query
  const filteredDeliveries = useMemo(() => {
    if (!searchQuery.trim()) return completedDeliveries;
    const q = searchQuery.toLowerCase().trim();
    return completedDeliveries.filter(
      (o) =>
        o.id?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerPhone?.includes(q) ||
        o.pharmacyName?.toLowerCase().includes(q) ||
        o.address?.toLowerCase().includes(q)
    );
  }, [completedDeliveries, searchQuery]);

  const totalCollectedAmount = useMemo(() => {
    return completedDeliveries.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [completedDeliveries]);

  const totalEarnings = useMemo(() => {
    return completedDeliveries.length * 40; // ₹40 per delivered parcel
  }, [completedDeliveries]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900 flex items-center gap-2">
            <History className="w-6 h-6 text-forest-700" />
            <span>Completed Deliveries</span>
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            History of all successfully handed-over medicine packages, verified OTPs, and reconciled cash.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchCompletedDeliveries}
          isLoading={isLoading}
          className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Deliveries</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-pure rounded-2xl p-4 border border-brandBorder-subtle shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-brandText-secondary uppercase tracking-wider">
              Total Completed
            </p>
            <p className="text-xl font-heading font-extrabold text-forest-900">
              {completedDeliveries.length} Packages
            </p>
          </div>
        </div>

        <div className="bg-surface-pure rounded-2xl p-4 border border-brandBorder-subtle shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Coins className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-brandText-secondary uppercase tracking-wider">
              Cash Reconciled
            </p>
            <p className="text-xl font-heading font-extrabold text-forest-900">
              ₹{totalCollectedAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-surface-pure rounded-2xl p-4 border border-brandBorder-subtle shadow-card flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
            <Bike className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-brandText-secondary uppercase tracking-wider">
              Rider Remuneration
            </p>
            <p className="text-xl font-heading font-extrabold text-forest-900">
              ₹{totalEarnings.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order ID, customer name, phone number, or pharmacy..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-pure border border-brandBorder-subtle rounded-2xl text-xs text-forest-900 focus:outline-none focus:border-forest-600 shadow-xs"
        />
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-12 text-center space-y-3 shadow-card">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-extrabold text-lg text-forest-900">
            {searchQuery ? 'No Matching Deliveries Found' : 'No Completed Deliveries Yet'}
          </h3>
          <p className="text-xs text-brandText-secondary max-w-sm mx-auto">
            {searchQuery
              ? 'Try searching with another keyword, phone number, or order ID.'
              : 'As soon as you verify customer OTPs and complete medicine deliveries, your delivery receipts will automatically populate here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeliveries.map((order) => (
            <div
              key={order.id}
              className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-5 sm:p-6 space-y-4 transition-all"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brandBorder-subtle pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-extrabold text-xs text-forest-900 bg-surface-warm px-2.5 py-1 rounded-xl border border-brandBorder-subtle">
                    {order.id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>DELIVERED</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-extrabold text-base text-forest-900">
                    ₹{Number(order.total || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] font-bold block uppercase tracking-wider text-emerald-700">
                    {order.paymentMethod === 'COD' ? '• COD Cash Collected' : '• Paid Online'}
                  </span>
                </div>
              </div>

              {/* Handover & Wallet Credited Verification Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Customer OTP Authenticated & Handed Over</span>
                </span>
                <span className="px-3 py-1 rounded-xl bg-forest-50 text-forest-900 border border-forest-200 font-bold flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-forest-700" />
                  <span>₹40.00 Delivery Fee Credited to Rider Wallet</span>
                </span>
              </div>

              {/* Routing Information (Pharmacy & Customer) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Pharmacy Information */}
                <div className="p-3.5 rounded-2xl bg-surface-warm/40 border border-brandBorder-subtle space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-forest-900">
                    <Building2 className="w-4 h-4 text-purple-700" />
                    <span>Fulfillment Pharmacy</span>
                  </div>
                  <p className="font-bold text-forest-900 pl-5">{order.pharmacyName}</p>
                  <p className="text-brandText-secondary pl-5">{order.pharmacyAddress}</p>
                  {order.pharmacyPhone && (
                    <p className="text-brandText-muted pl-5 text-[11px]">Tel: {order.pharmacyPhone}</p>
                  )}
                </div>

                {/* Customer Information */}
                <div className="p-3.5 rounded-2xl bg-surface-warm/40 border border-brandBorder-subtle space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-forest-900">
                      <MapPin className="w-4 h-4 text-emerald-700" />
                      <span>Delivered to Patient</span>
                    </div>
                    {order.customerPhone && (
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="p-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px] font-bold flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>
                  <p className="font-bold text-forest-900 pl-5">{order.customerName}</p>
                  <p className="text-brandText-secondary pl-5">{order.address}</p>
                  {order.customerPhone && (
                    <p className="text-brandText-muted pl-5 text-[11px]">Contact: {order.customerPhone}</p>
                  )}
                </div>
              </div>

              {/* Verified Medicine Items Checklist */}
              <div className="p-4 rounded-2xl bg-forest-50/60 border border-forest-100 space-y-2.5">
                <h4 className="font-heading font-bold text-xs text-forest-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Receipt className="w-3.5 h-3.5 text-forest-700" />
                  <span>Delivered Medicines ({order.items?.length || 0} Items)</span>
                </h4>
                <div className="border border-brandBorder-subtle rounded-xl overflow-hidden divide-y divide-brandBorder-subtle bg-surface-pure text-xs">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((it, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-forest-900">{it.name || it.nameSnapshot || 'Prescription Medicine'}</p>
                          <p className="text-[10px] text-brandText-muted">
                            Qty: <strong className="text-forest-800">{it.quantity}</strong>{' '}
                            {it.requiresPrescription ? '• Prescription Drug' : '• OTC Item'}
                          </p>
                        </div>
                        <span className="font-bold text-forest-800 font-mono">
                          ₹{(Number(it.price || it.unitPrice || 0) * Number(it.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-brandText-muted">
                      Prescription package handed over and verified by patient.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RiderHistoryPage;
