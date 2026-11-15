import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Button from '../common/Button';

export const CartDrawer = () => {
  const {
    cartItems,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    itemCount,
    subtotal,
    deliveryFee,
    discount,
    total,
    updateQuantity,
    removeFromCart,
    hasPrescriptionRequiredItems,
    appliedCoupon
  } = useCart();

  const navigate = useNavigate();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-forest-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface-pure shadow-2xl flex flex-col border-l border-brandBorder-subtle animate-slide-left">
          {/* Header */}
          <div className="p-5 border-b border-brandBorder-subtle flex items-center justify-between bg-surface-warm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-forest-100 rounded-xl text-forest-700">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-forest-800">
                  Your Cart
                </h3>
                <p className="text-xs text-brandText-secondary">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-2 rounded-full hover:bg-forest-100 text-brandText-secondary hover:text-forest-700 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Prescription Alert Banner */}
          {hasPrescriptionRequiredItems && (
            <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Prescription Required:</span> One or more items in your cart require a doctor prescription before pharmacy dispatch.
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-forest-50 flex items-center justify-center text-forest-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-heading font-bold text-forest-800 text-base mb-1">
                  Your cart is empty
                </h4>
                <p className="text-xs text-brandText-secondary max-w-xs mx-auto mb-6">
                  Explore our verified medicines and healthcare essentials to start adding items.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    navigate('/shop');
                  }}
                >
                  Explore Medicines
                </Button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3.5 p-3.5 rounded-2xl border border-brandBorder-subtle hover:border-forest-200 transition-all bg-surface-pure"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-xl border border-brandBorder-subtle flex-shrink-0 bg-surface-warm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-forest-800 truncate">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-brandText-secondary truncate">
                      {item.packaging || item.genericName}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-forest-700 text-sm">
                          ৳{item.price * item.quantity}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[11px] text-brandText-muted">
                            (৳{item.price} each)
                          </span>
                        )}
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-brandBorder-subtle rounded-full bg-surface-warm px-1.5 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center text-forest-700 hover:bg-forest-100 rounded-full"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-forest-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center text-forest-700 hover:bg-forest-100 rounded-full"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-brandBorder-subtle bg-surface-warm space-y-3.5">
              <div className="space-y-1.5 text-xs text-brandText-secondary">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brandText-main">৳{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-brandText-main">
                    {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `৳${deliveryFee}`}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-৳{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-forest-800 pt-2 border-t border-brandBorder-subtle">
                  <span>Total Amount</span>
                  <span className="text-forest-700 text-base">৳{total}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-brandText-secondary justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                <span>100% Genuine Medicine Guarantee from Licensed Pharmacies</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    navigate('/cart');
                  }}
                  className="w-full text-xs"
                >
                  View Full Cart
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={ArrowRight}
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    navigate('/checkout');
                  }}
                  className="w-full text-xs"
                >
                  Checkout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
