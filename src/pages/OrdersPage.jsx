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
  Ticket,
  KeyRound,
  Receipt,
  Sparkles,
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

    const syncOrders = async () => {
      try {
        const data = await orderService.getUserOrders();
        const map = new Map();

        // 1. Add workspace store orders first keyed by canonical identifier
        (storeOrders || []).forEach((so) => {
          const key = so.orderNumber || so.backendId || so.id;
          map.set(key, so);
        });

        // 2. Overlay backend orders
        (data || []).forEach((bo) => {
          const key = bo.orderNumber || bo.backendId || bo.id;
          const existing =
            map.get(key) ||
            (bo.backendId && map.get(bo.backendId)) ||
            (bo.id && map.get(bo.id)) ||
            (bo.orderNumber && map.get(bo.orderNumber));
          const finalStatus =
            existing?.status === 'DELIVERED' || bo.status === 'DELIVERED' ? 'DELIVERED' : bo.status;
          map.set(key, { ...existing, ...bo, status: finalStatus });
        });

        if (isMounted) {
          const mergedList = Array.from(map.values());
          setOrders(mergedList.length > 0 ? mergedList : (storeOrders || []));
        }
      } catch (err) {
        if (isMounted) setOrders(storeOrders || []);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    syncOrders();

    const handleSyncEvent = () => {
      syncOrders();
    };

    window.addEventListener('oshud_order_created', handleSyncEvent);
    window.addEventListener('oshud_order_status_updated', handleSyncEvent);
    window.addEventListener('storage', handleSyncEvent);

    return () => {
      isMounted = false;
      window.removeEventListener('oshud_order_created', handleSyncEvent);
      window.removeEventListener('oshud_order_status_updated', handleSyncEvent);
      window.removeEventListener('storage', handleSyncEvent);
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
            const pharmacyName = order.pharmacy?.name || order.pharmacyName || (order.pharmacyId ? 'Assigned Pharmacy Partner' : 'Licensed Partner Pharmacy');
            const pharmacyAddress = order.pharmacy?.address || order.pharmacyAddress || '';
            const pharmacyPhone = order.pharmacy?.phone || order.pharmacyPhone || '';

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

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-brandBorder-subtle">
                    {order.deliveryOtp && order.status !== 'DELIVERED' && (
                      <div className="bg-forest-900 text-white px-3.5 py-1.5 rounded-2xl shadow-md border border-forest-700/60 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <KeyRound className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left">
                          <p className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-400 leading-tight">Delivery OTP</p>
                          <p className="font-mono font-extrabold text-base tracking-widest text-emerald-300 leading-tight mt-0.5">{order.deliveryOtp}</p>
                        </div>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-[11px] text-brandText-secondary font-medium">Total Amount</p>
                      <p className="font-heading font-extrabold text-forest-800 text-base sm:text-lg">
                        ₹{Number(order.total ?? (order.totalPaise ? order.totalPaise / 100 : 0)).toFixed(2)}
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
                      {pharmacyAddress ? (
                        <p className="text-xs text-brandText-secondary">{pharmacyAddress}</p>
                      ) : null}
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
                          {riderInfo.phone && order.status !== 'DELIVERED' ? (
                            <a
                              href={`tel:${riderInfo.phone}`}
                              className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5" /> Call Rider
                            </a>
                          ) : order.status === 'DELIVERED' ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Completed
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs font-bold text-forest-900">{riderInfo.name}</p>
                        <p className="text-xs text-brandText-secondary">{riderInfo.vehicle}</p>
                        <p className="text-[11px] text-emerald-800 font-medium">
                          {order.status === 'DELIVERED'
                            ? '📍 Express Delivery Partner \u2022 Delivery Completed'
                            : '📍 Express Delivery Partner \u2022 Active on Route'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-1">
                        <h5 className="font-heading font-bold text-xs text-forest-800">Delivery Status</h5>
                        <p className="text-xs text-forest-700 font-bold">
                          {order.status === 'DELIVERED'
                            ? 'Successfully Delivered'
                            : order.status === 'OUT_FOR_DELIVERY' || order.status === 'SHIPPED'
                            ? 'Out for Express Delivery'
                            : order.status === 'RIDER_ASSIGNED'
                            ? 'Delivery Rider Assigned'
                            : order.status === 'READY_FOR_PICKUP'
                            ? 'Approved & Prepared (Ready for Dispatch)'
                            : 'Approved & Preparing Package'}
                        </p>
                        <p className="text-xs text-brandText-secondary">
                          Delivering to: {order.address || 'Your saved delivery address'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Medicines List In Order */}
                  <div className="border-t border-brandBorder-subtle pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-bold text-forest-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-forest-600" />
                        <span>Prescribed Medicines & Items ({(order.items || []).length})</span>
                      </h5>
                      <span className="text-xs font-bold text-forest-700">
                        Package Total: ₹{Number(order.total ?? (order.totalPaise ? order.totalPaise / 100 : 0)).toFixed(2)}
                      </span>
                    </div>

                    <div className="divide-y divide-brandBorder-subtle bg-surface-warm/40 rounded-2xl p-2 border border-brandBorder-subtle">
                      {(order.items || []).length > 0 ? (
                        (order.items || []).map((item, idx) => {
                          const itemName = item.name || item.nameSnapshot || 'Prescription Medicine';
                          const itemQty = Number(item.qty || item.quantity || 1);
                          const itemPrice = Number(item.price ?? (item.unitPricePaise ? item.unitPricePaise / 100 : 0));
                          const itemLineTotal = Number(item.lineTotal || (itemPrice * itemQty));

                          return (
                            <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                              <div className="min-w-0 pr-3 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-forest-900 text-sm">{itemName}</span>
                                  {item.requiresPrescription ? (
                                    <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded">Rx</span>
                                  ) : (
                                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">OTC</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-brandText-secondary">
                                  Quantity: <strong className="text-forest-900">{itemQty}</strong> &bull; Unit: ₹{itemPrice.toFixed(2)}
                                </p>
                              </div>
                              <span className="font-mono font-extrabold text-forest-900 text-sm flex-shrink-0">
                                ₹{itemLineTotal.toFixed(2)}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-brandText-muted">
                          Medicines prepared and verified by fulfillment pharmacist.
                        </div>
                      )}
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
