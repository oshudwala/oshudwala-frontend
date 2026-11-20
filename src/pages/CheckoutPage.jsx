import React, { useState } from 'react';
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
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderService } from '../services/orderService';
import { prescriptionService } from '../services/prescriptionService';
import { userApi } from '../services/api/user.api';
import Button from '../components/common/Button';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    subtotal,
    deliveryFee,
    discount,
    total,
    appliedCoupon,
    clearCart,
    hasPrescriptionRequiredItems
  } = useCart();
  const { addToast } = useToast();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('express');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('RX-841920');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderResult, setPlacedOrderResult] = useState(null);
  const [orderNotice, setOrderNotice] = useState(null);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const data = await userApi.getAddresses();
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((addr) => ({
            id: addr.id,
            tag: addr.label || 'Home',
            recipient: addr.fullName,
            phone: addr.phone,
            address: `${addr.line1}${addr.line2 ? `, ${addr.line2}` : ''}, ${addr.city}, ${addr.state} - ${addr.pincode}`,
            isDefault: addr.isDefault,
          }));
          setSavedAddresses(formatted);
          const defaultAddr = formatted.find((a) => a.isDefault) || formatted[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          const fallback = [
            {
              id: 'addr-default',
              tag: 'Default',
              recipient: user?.fullName || user?.name || 'Patient',
              phone: user?.phone || '',
              address: 'City Centre, Durgapur, West Bengal 713216',
              isDefault: true,
            },
          ];
          setSavedAddresses(fallback);
          setSelectedAddressId('addr-default');
        }
      } catch {
        const fallback = [
          {
            id: 'addr-default',
            tag: 'Default',
            recipient: user?.fullName || user?.name || 'Patient',
            phone: user?.phone || '',
            address: 'City Centre, Durgapur, West Bengal 713216',
            isDefault: true,
          },
        ];
        setSavedAddresses(fallback);
        setSelectedAddressId('addr-default');
      }
    };
    fetchAddresses();
  }, [user]);

  const existingPrescriptions = prescriptionService.getUserPrescriptions();

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

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const activeAddress = savedAddresses.find((a) => a.id === selectedAddressId)?.address;
      const res = await orderService.placeOrder({
        items: cartItems,
        address: activeAddress,
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'bKash / Nagad Mobile Banking',
        deliverySlot: deliverySlot === 'express' ? 'Standard Express (35-45 mins)' : 'Scheduled Delivery',
        prescriptionId: hasPrescriptionRequiredItems ? selectedPrescriptionId : null,
        couponCode: appliedCoupon?.code,
        subtotal,
        deliveryFee,
        discount,
        total,
      });

      if (res?.id) {
        setPlacedOrderResult(res);
        clearCart();
        addToast(`Order ${res.id} placed successfully!`, 'success');
      } else {
        throw new Error('Online checkout integration pending');
      }
    } catch (err) {
      setOrderNotice({
        title: 'Online Checkout Notice',
        message: err.message,
        total,
        itemCount: cartItems.length,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {orderNotice ? (
        <div className="bg-surface-pure rounded-3xl p-8 sm:p-12 border border-brandBorder-subtle shadow-card max-w-2xl mx-auto text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Package className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
              Direct Pharmacy Fulfillment
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-800 mt-1">
              Order Ready for Dispatch
            </h1>
            <p className="text-xs sm:text-sm text-brandText-secondary mt-2 max-w-md mx-auto leading-relaxed">
              Automated online checkout is scheduled for backend Phase 2 (Step 6).
              Our registered local pharmacies are fulfilling express deliveries immediately via WhatsApp and direct telephone helpline.
            </p>
          </div>

          <div className="bg-forest-50/70 p-5 rounded-2xl border border-forest-100 text-left text-xs space-y-2.5 text-brandText-main">
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Order Value:</span>
              <span className="font-bold text-forest-800 text-sm">₹{orderNotice.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Items in Cart:</span>
              <span className="font-semibold">{orderNotice.itemCount} Prescribed Medicines / Health Products</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">WhatsApp Delivery Desk:</span>
              <span className="font-semibold text-forest-700">+91 98000 00000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Phone Helpline:</span>
              <span className="font-semibold text-forest-700">+91 98000 00000 (Toll-Free)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={`https://wa.me/919800000000?text=${encodeURIComponent(
                `Hello Oshud Wala! I would like to order my medicines worth ₹${orderNotice.total}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-6 bg-forest-600 hover:bg-forest-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-card transition-all"
            >
              Order via WhatsApp Helpline
            </a>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setOrderNotice(null)}
              className="flex-1"
            >
              Back to Checkout
            </Button>
          </div>
        </div>
      ) : placedOrderResult ? (
        /* Order Placed Success View */
        <div className="bg-surface-pure rounded-3xl p-8 sm:p-12 border border-brandBorder-subtle shadow-card max-w-2xl mx-auto text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-forest-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
              Order Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-800 mt-1">
              Thank You! Your Order is Placed
            </h1>
            <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
              Order ID: <span className="font-bold text-forest-700">{placedOrderResult.id}</span>
            </p>
          </div>

          <div className="bg-forest-50/70 p-5 rounded-2xl border border-forest-100 text-left text-xs space-y-2.5 text-brandText-main">
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Delivery Destination:</span>
              <span className="font-semibold">{placedOrderResult.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Assigned Pharmacy:</span>
              <span className="font-semibold">{placedOrderResult.pharmacy.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Delivery OTP:</span>
              <span className="font-mono font-bold text-sm text-forest-800 bg-white px-2 py-0.5 rounded border border-forest-200">
                {placedOrderResult.deliveryOtp}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brandText-secondary">Total Paid / Payable:</span>
              <span className="font-bold text-forest-800 text-sm">₹{placedOrderResult.total}</span>
            </div>
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
              className="flex-1 shadow-card"
            >
              Track Order Live
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Steps */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="p-2 rounded-full hover:bg-forest-100 text-forest-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-heading font-extrabold text-forest-800">
                Secure Checkout
              </h1>
            </div>

            {/* Step 1: Delivery Address */}
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="font-heading font-bold text-base text-forest-800">
                  Select Delivery Address
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-forest-600 bg-forest-50/60 shadow-sm'
                        : 'border-brandBorder-subtle hover:border-forest-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-forest-800 uppercase px-2 py-0.5 rounded-full bg-forest-100">
                        {addr.tag}
                      </span>
                      {selectedAddressId === addr.id && (
                        <CheckCircle2 className="w-4 h-4 text-forest-600" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-brandText-main">{addr.recipient}</p>
                    <p className="text-xs text-brandText-secondary mt-1">{addr.address}</p>
                    <p className="text-[11px] text-brandText-muted mt-0.5">{addr.phone}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Delivery Slot */}
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="font-heading font-bold text-base text-forest-800">
                  Delivery Speed & Schedule
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div
                  onClick={() => setDeliverySlot('express')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    deliverySlot === 'express'
                      ? 'border-forest-600 bg-forest-50/60 shadow-sm'
                      : 'border-brandBorder-subtle hover:border-forest-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-forest-600" />
                      <span className="text-xs font-bold text-forest-800">Standard Express</span>
                    </div>
                    {deliverySlot === 'express' && <CheckCircle2 className="w-4 h-4 text-forest-600" />}
                  </div>
                  <p className="text-xs text-brandText-secondary mt-1">
                    Delivered in 35-45 minutes from nearest pharmacy
                  </p>
                </div>

                <div
                  onClick={() => setDeliverySlot('scheduled')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    deliverySlot === 'scheduled'
                      ? 'border-forest-600 bg-forest-50/60 shadow-sm'
                      : 'border-brandBorder-subtle hover:border-forest-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-forest-600" />
                      <span className="text-xs font-bold text-forest-800">Evening Delivery</span>
                    </div>
                    {deliverySlot === 'scheduled' && <CheckCircle2 className="w-4 h-4 text-forest-600" />}
                  </div>
                  <p className="text-xs text-brandText-secondary mt-1">
                    Delivered today between 06:00 PM – 09:00 PM
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Prescription Attachment (If Required) */}
            {hasPrescriptionRequiredItems && (
              <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-forest-800">
                      Prescription Attachment
                    </h3>
                    <p className="text-xs text-amber-800">
                      Required for Sergel 20, Finix 20, or other Rx items in your cart
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {existingPrescriptions.map((rx) => (
                    <label
                      key={rx.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-brandBorder-subtle bg-surface-warm cursor-pointer hover:border-forest-300"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="prescription"
                          value={rx.id}
                          checked={selectedPrescriptionId === rx.id}
                          onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                          className="text-forest-600 focus:ring-forest-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-forest-800">{rx.fileName}</p>
                          <p className="text-[11px] text-brandText-secondary">
                            Ref: {rx.id} • {rx.pharmacyName}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {rx.status}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Payment Method */}
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-700 flex items-center justify-center font-bold text-xs">
                  {hasPrescriptionRequiredItems ? '4' : '3'}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-forest-800">
                    Payment Method
                  </h3>
                  <p className="text-[11px] text-brandText-secondary">
                    Select your preferred payment channel
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'cod' ? 'border-forest-600 bg-forest-50/60 shadow-sm' : 'border-brandBorder-subtle'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-forest-600 focus:ring-forest-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-forest-800">Cash on Delivery (COD)</p>
                      <p className="text-[11px] text-brandText-secondary">Pay cash to delivery rider upon handover and verification.</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'bkash' ? 'border-forest-600 bg-forest-50/60 shadow-sm' : 'border-brandBorder-subtle'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="bkash"
                      checked={paymentMethod === 'bkash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-forest-600 focus:ring-forest-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-forest-800">bKash / Nagad Mobile Banking</p>
                      <p className="text-[11px] text-brandText-secondary">SSLCommerz secure gateway (sandbox / dev enabled).</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Honest Demo State Disclaimer per Prompt Instructions */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-snug">
                <span className="font-bold">Development Sandbox:</span> Backend API is currently in development. Placing an order registers it securely into your local order tracking workflow without charging actual money.
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Button */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4 sticky top-28">
              <h3 className="font-heading font-bold text-base text-forest-800">
                Order Items ({cartItems.length})
              </h3>

              <div className="max-h-56 overflow-y-auto space-y-3 pr-1 divide-y divide-brandBorder-light">
                {cartItems.map((item) => (
                  <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-forest-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-brandText-secondary">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-brandText-main flex-shrink-0">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-brandBorder-subtle space-y-2 text-xs text-brandText-secondary">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brandText-main">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-brandText-main">
                    {deliveryFee === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : `₹${deliveryFee}`}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-brandBorder-subtle flex justify-between text-base font-heading font-extrabold text-forest-800">
                  <span>Total Payable</span>
                  <span className="text-forest-700 text-lg">₹{total}</span>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full shadow-card font-bold"
              >
                Confirm & Place Order
              </Button>

              <div className="flex items-center gap-1.5 text-[11px] text-brandText-secondary justify-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                <span>Zero Risk • Certified Pharmacy Verification</span>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CheckoutPage;
