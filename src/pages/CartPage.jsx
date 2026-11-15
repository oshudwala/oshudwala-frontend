import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Tag,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import Button from '../components/common/Button';

export const CartPage = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    itemCount,
    subtotal,
    deliveryFee,
    discount,
    total,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    updateQuantity,
    removeFromCart,
    clearCart,
    hasPrescriptionRequiredItems
  } = useCart();

  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const ok = applyCoupon(couponInput);
    if (ok) setCouponInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-800">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            {itemCount} {itemCount === 1 ? 'medicine' : 'medicines'} in your cart
          </p>
        </div>

        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-surface-pure rounded-3xl p-16 text-center border border-brandBorder-subtle space-y-4 max-w-lg mx-auto">
          <div className="w-20 h-20 mx-auto rounded-full bg-forest-50 text-forest-500 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-heading font-bold text-forest-800">
            Your Medicine Cart is Empty
          </h2>
          <p className="text-xs text-brandText-secondary max-w-sm mx-auto">
            Browse our pharmacy catalog or upload your prescription to get started with fast home delivery.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="lg" onClick={() => navigate('/shop')}>
              Browse Medicines
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {/* Prescription Warning */}
            {hasPrescriptionRequiredItems && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Prescription Required Items in Cart:</span>
                  <p className="mt-0.5 text-amber-800">
                    You have one or more prescription medicines. You can attach a prescription during checkout or upload it directly.
                  </p>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-subtle divide-y divide-brandBorder-subtle overflow-hidden">
              {cartItems.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-between">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-18 h-18 sm:w-20 sm:h-20 object-contain rounded-2xl bg-forest-50/50 p-2 border border-brandBorder-subtle flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-base text-forest-800 truncate">
                          {item.name}
                        </h3>
                        {item.prescriptionRequired && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Rx
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brandText-secondary">
                        {item.packaging || item.genericName}
                      </p>
                      <p className="text-xs font-semibold text-forest-700 mt-1">
                        ₹{item.price} each
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper & Subtotal */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-brandBorder-subtle">
                    {/* Stepper */}
                    <div className="flex items-center border border-brandBorder-subtle rounded-full bg-surface-warm px-2 py-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-forest-700 hover:bg-forest-100 rounded-full"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-forest-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-forest-700 hover:bg-forest-100 rounded-full"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total item price */}
                    <div className="text-right min-w-[70px]">
                      <p className="text-base font-heading font-bold text-forest-800">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping Link */}
            <div className="pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-forest-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Continue Shopping Medicines</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Coupon & Order Summary */}
          <div className="lg:col-span-4 space-y-4">
            {/* Coupon Box */}
            <div className="bg-surface-pure rounded-3xl p-5 border border-brandBorder-subtle shadow-subtle space-y-3">
              <h3 className="font-heading font-bold text-sm text-forest-800 flex items-center gap-2">
                <Tag className="w-4 h-4 text-forest-600" />
                Apply Promo Coupon
              </h3>

              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-800">{appliedCoupon.code}</span>
                    <p className="text-[11px] text-emerald-700">{appliedCoupon.label}</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. OSHUD10"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl uppercase tracking-wider font-semibold focus:outline-none focus:border-forest-500"
                    />
                    <Button variant="secondary" size="sm" type="submit">
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-rose-600">{couponError}</p>
                  )}
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyCoupon('OSHUD10')}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-50 hover:bg-forest-100 text-forest-700 border border-forest-200"
                    >
                      Use OSHUD10 (10% OFF)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCoupon('WELCOME50')}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-50 hover:bg-forest-100 text-forest-700 border border-forest-200"
                    >
                      Use WELCOME50 (₹50 OFF)
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Price Summary Box */}
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
              <h3 className="font-heading font-bold text-base text-forest-800">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs text-brandText-secondary">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-brandText-main">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-brandText-main">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE (Above ₹500)</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-brandBorder-subtle flex justify-between text-base font-heading font-extrabold text-forest-800">
                  <span>Total Payable</span>
                  <span className="text-forest-700 text-lg">₹{total}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={ArrowRight}
                  onClick={() => navigate('/checkout')}
                  className="w-full shadow-card font-bold"
                >
                  Proceed to Checkout
                </Button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-brandText-secondary justify-center pt-2">
                <ShieldCheck className="w-4 h-4 text-forest-600" />
                <span>SSL Encrypted & Authentic Pharmacy Delivery</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
