import React, { useState } from 'react';
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
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';

export const OrdersPage = () => {
  const [searchParams] = useSearchParams();
  const highlightedOrderId = searchParams.get('order');
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const orders = orderService.getUserOrders();

  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED');
  const pastOrders = orders.filter((o) => o.status === 'DELIVERED');

  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const handleReorder = (order) => {
    order.items.forEach((item) => {
      addToCart(item, item.quantity);
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
            Track active medicine dispatches, assigned riders, and order history
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
        <div className="bg-surface-pure rounded-3xl p-12 text-center border border-brandBorder-subtle max-w-md mx-auto space-y-3">
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
                <div className="p-5 sm:p-6 bg-surface-warm border-b border-brandBorder-subtle flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-heading font-extrabold text-base sm:text-lg text-forest-800">
                        {order.id}
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}
                      >
                        {order.status === 'DELIVERED' ? 'Delivered' : 'Out for Delivery'}
                      </span>
                    </div>
                    <p className="text-xs text-brandText-secondary">
                      Placed on {new Date(order.placedAt).toLocaleDateString()} at{' '}
                      {new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {order.deliveryOtp && order.status !== 'DELIVERED' && (
                      <div className="bg-forest-900 text-white px-3.5 py-1.5 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-forest-200">Delivery OTP</p>
                        <p className="font-mono font-bold text-sm text-emerald-300">{order.deliveryOtp}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-brandText-secondary">Total Paid</p>
                      <p className="font-heading font-extrabold text-forest-800 text-lg">₹{order.total}</p>
                    </div>
                  </div>
                </div>

                {/* Main Order Details Body */}
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Visual Multi-Stage Delivery Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-forest-800 uppercase tracking-wider">
                      Delivery Progress Tracker
                    </h4>

                    <div className="relative pt-2 pb-4">
                      {/* Timeline Steps Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        {(order.timeline || []).map((step, idx) => {
                          const isDone = step.completed;
                          const isCurrent = step.current;

                          return (
                            <div key={idx} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                              {/* Step circle */}
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                                  isDone
                                    ? 'bg-forest-600 text-white'
                                    : isCurrent
                                    ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                              </div>

                              <div className="text-left sm:text-center">
                                <p className={`text-xs font-bold ${isCurrent ? 'text-amber-800' : isDone ? 'text-forest-800' : 'text-slate-400'}`}>
                                  {step.title}
                                </p>
                                <p className="text-[11px] text-brandText-muted mt-0.5">
                                  {step.time}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Rider & Pharmacy Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Assigned Pharmacy */}
                    <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-2">
                      <div className="flex items-center gap-2 text-forest-700">
                        <Building2 className="w-4 h-4" />
                        <h5 className="font-heading font-bold text-xs">Fulfilling Pharmacy</h5>
                      </div>
                      <p className="text-xs font-bold text-forest-900">{order.pharmacy.name}</p>
                      <p className="text-xs text-brandText-secondary">{order.pharmacy.address}</p>
                      {order.pharmacy.phone && (
                        <p className="text-xs text-forest-600 font-semibold">{order.pharmacy.phone}</p>
                      )}
                    </div>

                    {/* Assigned Rider */}
                    {order.rider ? (
                      <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                        <div className="flex items-center justify-between text-forest-700">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            <h5 className="font-heading font-bold text-xs">Assigned Delivery Rider</h5>
                          </div>
                          <a
                            href={`tel:${order.rider.phone}`}
                            className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call Rider
                          </a>
                        </div>
                        <p className="text-xs font-bold text-forest-900">{order.rider.name}</p>
                        <p className="text-xs text-brandText-secondary">{order.rider.vehicle}</p>
                        <p className="text-[11px] text-emerald-800 font-medium">
                          📍 {order.rider.currentLocation}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-1">
                        <h5 className="font-heading font-bold text-xs text-forest-800">Delivery Status</h5>
                        <p className="text-xs text-emerald-700 font-bold">Successfully Delivered</p>
                        <p className="text-xs text-brandText-secondary">Delivered to: {order.address}</p>
                      </div>
                    )}
                  </div>

                  {/* Medicines List In Order */}
                  <div className="border-t border-brandBorder-subtle pt-4">
                    <h5 className="text-xs font-bold text-forest-800 uppercase tracking-wider mb-3">
                      Ordered Medicines & Items
                    </h5>
                    <div className="divide-y divide-brandBorder-light">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-forest-800">{item.name}</span>
                            <span className="text-brandText-secondary ml-2">({item.packaging || 'Pack'})</span>
                            <span className="text-brandText-muted ml-2">x{item.quantity}</span>
                          </div>
                          <span className="font-bold text-forest-700">
                            ₹{item.price * item.quantity}
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
