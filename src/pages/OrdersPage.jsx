import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Phone,
  Building2,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  MapPin,
  Ticket
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { useWorkspaceStore } from '../services/workspace/useWorkspaceStore';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import StatusBadge from '../components/workspace/StatusBadge';

export const OrdersPage = () => {
  const [searchParams] = useSearchParams();
  const highlightedOrderId = searchParams.get('order');
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const { orders: storeOrders } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await orderService.getUserOrders();
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setOrders(data);
          } else {
            // Fallback to real-time synchronized workspace orders
            setOrders(storeOrders);
          }
        }
      } catch {
        if (isMounted) setOrders(storeOrders);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [storeOrders]);

  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const pastOrders = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED');

  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const handleReorder = (order) => {
    order.items.forEach((item) => {
      addToCart(item, item.quantity || item.qty || 1);
    });
    addToast('Items added to cart for re-ordering!', 'success');
    navigate('/cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Page Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-800">
            My Orders & Deliveries
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Track active medicine dispatches, assigned riders, and order history in real-time
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-2xl p-1 bg-surface-pure border border-brandBorder-subtle shadow-subtle self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'active'
                ? 'bg-forest-600 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-forest-700'
            }`}
          >
            Active Orders ({activeOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-forest-600 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-forest-700'
            }`}
          >
            Past Orders ({pastOrders.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <div className="bg-surface-pure rounded-3xl p-8 sm:p-12 text-center border border-brandBorder-subtle max-w-md mx-auto space-y-3">
          <div className="w-16 h-16 rounded-full bg-forest-50 text-forest-600 mx-auto flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-bold text-lg text-forest-800">
            {activeTab === 'active' ? 'No active orders' : 'No past orders found'}
          </h3>
          <p className="text-xs text-brandText-secondary">
            {activeTab === 'active'
              ? 'All your medicine deliveries have arrived safely.'
              : 'You have not completed any medicine orders yet.'}
          </p>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/shop')}>
              Browse Medicines
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedOrders.map((order) => {
            const isHighlighted = highlightedOrderId === order.id;
            const riderInfo = order.rider || order.assignedRider;
            const pharmacyName = order.pharmacy?.name || order.pharmacyName || 'MedPlus Pharmacy';
            const pharmacyAddress = order.pharmacy?.address || order.pharmacyAddress || 'Sector V, Salt Lake, Kolkata';
            const pharmacyPhone = order.pharmacy?.phone || order.pharmacyPhone || '+91 33 2357 8900';

            return (
              <div
                key={order.id}
                className={`bg-surface-pure rounded-3xl border transition-all overflow-hidden ${
                  isHighlighted
                    ? 'border-forest-600 ring-2 ring-forest-500/20 shadow-card'
                    : 'border-brandBorder-subtle shadow-subtle'
                }`}
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-6 bg-surface-warm border-b border-brandBorder-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-mono font-extrabold text-base sm:text-lg text-forest-800">
                        {order.id}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-[11px] sm:text-xs text-brandText-secondary">
                      Placed on {new Date(order.placedAt || order.createdAt || Date.now()).toLocaleDateString('en-IN')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-brandBorder-subtle">
                    {order.deliveryOtp && order.status !== 'DELIVERED' && (
                      <div className="bg-forest-900 text-white px-3.5 py-1.5 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-forest-200">Delivery OTP</p>
                        <p className="font-mono font-bold text-sm text-emerald-300">{order.deliveryOtp}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-[11px] text-brandText-secondary">Total Amount</p>
                      <p className="font-heading font-extrabold text-forest-800 text-base sm:text-lg">
                        ₹{Number(order.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Order Details Body */}
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Visual Multi-Stage Delivery Timeline */}
                  {order.timeline && order.timeline.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-forest-800 uppercase tracking-wider">
                        Delivery Progress Tracker
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                        {order.timeline.map((step, idx) => {
                          const isDone = step.completed;
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-warm/60 border border-brandBorder-subtle"
                            >
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                  isDone
                                    ? 'bg-forest-600 text-white'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-xs font-bold truncate ${isDone ? 'text-forest-900' : 'text-brandText-muted'}`}>
                                  {step.status || step.title}
                                </p>
                                <p className="text-[10px] text-brandText-secondary truncate">
                                  {step.time}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rider & Pharmacy Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Assigned Pharmacy */}
                    <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-1.5">
                      <div className="flex items-center gap-2 text-forest-700">
                        <Building2 className="w-4 h-4" />
                        <h5 className="font-heading font-bold text-xs">Fulfilling Pharmacy</h5>
                      </div>
                      <p className="text-xs font-bold text-forest-900">{pharmacyName}</p>
                      <p className="text-xs text-brandText-secondary">{pharmacyAddress}</p>
                      {pharmacyPhone && (
                        <p className="text-xs text-forest-600 font-semibold">{pharmacyPhone}</p>
                      )}
                    </div>

                    {/* Assigned Rider */}
                    {riderInfo ? (
                      <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
                        <div className="flex items-center justify-between text-forest-700">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            <h5 className="font-heading font-bold text-xs">Assigned Delivery Rider</h5>
                          </div>
                          {riderInfo.phone && (
                            <a
                              href={`tel:${riderInfo.phone}`}
                              className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5" /> Call Rider
                            </a>
                          )}
                        </div>
                        <p className="text-xs font-bold text-forest-900">{riderInfo.name}</p>
                        <p className="text-xs text-brandText-secondary">{riderInfo.vehicle}</p>
                        <p className="text-[11px] text-emerald-800 font-medium">
                          📍 Express Delivery Partner &bull; Active on Route
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-1">
                        <h5 className="font-heading font-bold text-xs text-forest-800">Delivery Status</h5>
                        <p className="text-xs text-forest-700 font-bold">
                          {order.status === 'DELIVERED' ? 'Successfully Delivered' : 'Pharmacy Preparing Package'}
                        </p>
                        <p className="text-xs text-brandText-secondary">
                          Delivering to: {order.address || 'Your saved delivery address'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Medicines List In Order */}
                  <div className="border-t border-brandBorder-subtle pt-4">
                    <h5 className="text-xs font-bold text-forest-800 uppercase tracking-wider mb-3">
                      Ordered Medicines & Items ({order.items?.length || 0})
                    </h5>
                    <div className="divide-y divide-brandBorder-light">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-3">
                            <span className="font-bold text-forest-900">{item.name}</span>
                            <span className="text-brandText-secondary ml-2">({item.form || item.packaging || 'Pack'})</span>
                            <span className="text-brandText-muted ml-2">x{item.qty || item.quantity || 1}</span>
                          </div>
                          <span className="font-bold text-forest-800 flex-shrink-0">
                            ₹{((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reorder Button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={RotateCcw}
                      onClick={() => handleReorder(order)}
                      className="text-xs font-bold"
                    >
                      Reorder Items
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
