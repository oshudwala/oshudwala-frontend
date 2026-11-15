import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('oshud_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    // Default initial cart items for preview
    return [
      {
        id: "prod-1",
        name: "Napa Extra",
        genericName: "Paracetamol + Caffeine",
        packaging: "Strip of 10 Tablets",
        price: 30,
        mrp: 35,
        prescriptionRequired: false,
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400",
        quantity: 2
      },
      {
        id: "prod-2",
        name: "Sergel 20",
        genericName: "Esomeprazole 20mg",
        packaging: "Strip of 14 Capsules",
        price: 98,
        mrp: 112,
        prescriptionRequired: true,
        image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=400",
        quantity: 1
      }
    ];
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

  // Calculations
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= 500 || cartItems.length === 0 ? 0 : 40;

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else if (appliedCoupon.type === 'fixed') {
      discount = Math.min(subtotal, appliedCoupon.value);
    }
  }

  const total = Math.max(0, subtotal + deliveryFee - discount);
  const hasPrescriptionRequiredItems = cartItems.some((item) => item.prescriptionRequired);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        itemCount,
        subtotal,
        deliveryFee,
        discount,
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
