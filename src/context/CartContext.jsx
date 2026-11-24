import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateOrderBill } from '../services/pricingRules';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('oshud_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy preview demo items if present
          return parsed.filter((i) => i.id !== 'prod-1' && i.id !== 'prod-2');
        }
        return [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    localStorage.setItem('oshud_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      } else {
        return [...prev, { ...product, quantity }];
      }
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code) => {
    setCouponError('');
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode === 'OSHUD10') {
      setAppliedCoupon({ code: 'OSHUD10', type: 'percent', value: 10, label: '10% OFF Oshud Care' });
      return true;
    } else if (cleanCode === 'WELCOME50') {
      setAppliedCoupon({ code: 'WELCOME50', type: 'fixed', value: 50, label: '₹50 OFF First Order' });
      return true;
    } else {
      setCouponError('Invalid coupon code. Try OSHUD10 or WELCOME50');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  // Calculations using Platform Pricing Rules
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const bill = calculateOrderBill({
    items: cartItems,
    appliedCoupon,
    isPickup: false,
  });

  const subtotal = bill.totalMrp;
  const packagingFee = bill.packagingFee;
  const platformFee = bill.platformFee;
  const deliveryFee = bill.deliveryFee;
  const discount = bill.discount;
  const cashback = bill.cashback;
  const total = bill.finalTotal;
  const hasPrescriptionRequiredItems = cartItems.some((item) => item.prescriptionRequired);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        itemCount,
        subtotal,
        totalMrp: subtotal,
        packagingFee,
        platformFee,
        deliveryFee,
        discount,
        cashback,
        total,
        appliedCoupon,
        couponError,
        hasPrescriptionRequiredItems,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
