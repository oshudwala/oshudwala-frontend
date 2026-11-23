/**
 * Oshud Wala — Official Platform Pricing, Fee & Discount Rules Engine
 * Implements strict compliance rules:
 *  a. Fixed ₹6 packaging fee on every bill
 *  b. Platform fee tiered by order value:
 *     - Below ₹999 (0 - 999): ₹9
 *     - Below ₹1999 (1000 - 1999): ₹12
 *     - Below ₹2999 (2000 - 2999): ₹15
 *     - Below ₹3999 (3000 - 3999): ₹20
 *     - Below ₹4999 (4000 - 4999): ₹25
 *     - ₹5000 onwards (>= 5000): ₹30
 *  c. Above ₹4999 order value:
 *     - 18% direct discount
 *     - 2% wallet cashback for future purchases
 *  d. Wallet balance can be used to pay for orders, but strictly NOT on prescription medicines.
 */

export const PACKAGING_FEE = 6; // Fixed ₹6 packaging fee on every type of bill

/**
 * Calculates platform fee based on order MRP / subtotal
 * @param {number} subtotal 
 * @returns {number}
 */
export function calculatePlatformFee(subtotal) {
  const amount = Number(subtotal) || 0;
  if (amount <= 0) return 0;
  if (amount <= 999) return 9;
  if (amount <= 1999) return 12;
  if (amount <= 2999) return 15;
  if (amount <= 3999) return 20;
  if (amount <= 4999) return 25;
  return 30; // ₹5000 onwards
}

/**
 * Calculates delivery fee based on order subtotal / MRP.
 * Rule: Below ₹499 is ₹30 delivery charge, ₹499 and above is FREE delivery.
 * @param {number} subtotal 
 * @param {boolean} isPickup 
 * @returns {number}
 */
export function calculateDeliveryFee(subtotal, isPickup = false) {
  if (isPickup) return 0;
  const amount = Number(subtotal) || 0;
  if (amount <= 0) return 0;
  return amount >= 499 ? 0 : 30;
}

/**
 * Calculates discount and cashback for an order
 * @param {number} subtotal
 * @param {object|null} coupon
 * @returns {{ discount: number, cashback: number, discountPercent: number, isHighValueTier: boolean }}
 */
export function calculateDiscountsAndCashback(subtotal, coupon = null) {
  const amount = Number(subtotal) || 0;
  if (amount <= 0) {
    return { discount: 0, cashback: 0, discountPercent: 0, isHighValueTier: false };
  }

  // Rule h: Above ₹4999 gets 18% direct discount + 2% wallet cashback
  if (amount > 4999) {
    const discount = Math.round((amount * 18) / 100);
    const cashback = Math.round((amount * 2) / 100);
    return {
      discount,
      cashback,
      discountPercent: 18,
      isHighValueTier: true,
    };
  }

  // Orders <= 4999: coupon discount if applied, otherwise default platform discount (15%)
  if (coupon) {
    if (coupon.type === 'percent') {
      const discount = Math.round((amount * coupon.value) / 100);
      return { discount, cashback: 0, discountPercent: coupon.value, isHighValueTier: false };
    }
    if (coupon.type === 'fixed') {
      const discount = Math.min(amount, coupon.value);
      return { discount, cashback: 0, discountPercent: Math.round((discount / amount) * 100), isHighValueTier: false };
    }
  }

  // Default standard platform discount for orders (15%)
  const defaultDiscount = Math.round((amount * 15) / 100);
  return {
    discount: defaultDiscount,
    cashback: 0,
    discountPercent: 15,
    isHighValueTier: false,
  };
}

/**
 * Calculates maximum wallet balance eligible for deduction.
 * Rule i: Wallet balance CAN be used in bills, but strictly NOT on prescription medicines!
 * @param {Array} items
 * @param {number} availableWalletBalance
 * @returns {{ eligibleAmount: number, prescriptionAmount: number, maxWalletDeduction: number }}
 */
export function calculateWalletEligibility(items = [], availableWalletBalance = 0) {
  const walletBalance = Number(availableWalletBalance) || 0;
  if (walletBalance <= 0 || !Array.isArray(items) || items.length === 0) {
    return { eligibleAmount: 0, prescriptionAmount: 0, maxWalletDeduction: 0 };
  }

  let nonPrescriptionTotal = 0;
  let prescriptionTotal = 0;

  items.forEach((item) => {
    const itemTotal = (Number(item.price) || 0) * (Number(item.quantity || item.qty) || 1);
    const isRxRequired = Boolean(
      item.prescriptionRequired ||
      item.isPrescription ||
      item.requiresPrescription ||
      item.schedule === 'H' ||
      item.schedule === 'H1'
    );

    if (isRxRequired) {
      prescriptionTotal += itemTotal;
    } else {
      nonPrescriptionTotal += itemTotal;
    }
  });

  const maxWalletDeduction = Math.min(nonPrescriptionTotal, walletBalance);

  return {
    eligibleAmount: nonPrescriptionTotal,
    prescriptionAmount: prescriptionTotal,
    maxWalletDeduction,
  };
}

/**
 * Comprehensive Bill Calculator for an Order
 * @param {object} params
 * @returns {object} Full bill breakdown
 */
export function calculateOrderBill({
  items = [],
  customSubtotal = null,
  appliedCoupon = null,
  deliveryFee = null,
  isPickup = false,
  walletAmountToUse = 0,
  availableWalletBalance = 0,
}) {
  // 1. Calculate Total MRP / Subtotal
  let totalMrp = 0;
  if (customSubtotal !== null && customSubtotal !== undefined) {
    totalMrp = Number(customSubtotal) || 0;
  } else if (Array.isArray(items) && items.length > 0) {
    totalMrp = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity || item.qty) || 1),
      0
    );
  }

  // 2. Fixed Packaging Fee: ₹6 on every bill (Rule a)
  const packagingFee = totalMrp > 0 ? PACKAGING_FEE : 0;

  // 3. Platform Fee based on order value tier (Rule b - g)
  const platformFee = calculatePlatformFee(totalMrp);

  // 4. Delivery Fee (Rule: Below ₹499 is ₹30, ₹499 and above is FREE delivery)
  let resolvedDeliveryFee = 0;
  if (isPickup) {
    resolvedDeliveryFee = 0;
  } else if (deliveryFee !== null && deliveryFee !== undefined) {
    resolvedDeliveryFee = Number(deliveryFee) || 0;
  } else {
    resolvedDeliveryFee = calculateDeliveryFee(totalMrp, isPickup);
  }

  // 5. Discount and Cashback (Rule h)
  const { discount, cashback, discountPercent, isHighValueTier } = calculateDiscountsAndCashback(
    totalMrp,
    appliedCoupon
  );

  // 6. Wallet Eligibility & Deduction (Rule i: Not applicable on Rx drugs)
  const { eligibleAmount, prescriptionAmount, maxWalletDeduction } = calculateWalletEligibility(
    items,
    availableWalletBalance
  );

  const walletDeduction = Math.min(Number(walletAmountToUse) || 0, maxWalletDeduction);

  // 7. Net Final Total
  const grossPayable = totalMrp - discount + packagingFee + platformFee + resolvedDeliveryFee;
  const finalTotal = Math.max(0, grossPayable - walletDeduction);

  return {
    totalMrp,
    subtotal: totalMrp,
    packagingFee,
    platformFee,
    deliveryFee: resolvedDeliveryFee,
    discount,
    cashback,
    discountPercent,
    isHighValueTier,
    walletDeduction,
    maxWalletDeduction,
    prescriptionAmount,
    nonPrescriptionAmount: eligibleAmount,
    finalTotal: Number(finalTotal.toFixed(2)),
  };
}

export default {
  PACKAGING_FEE,
  calculatePlatformFee,
  calculateDeliveryFee,
  calculateDiscountsAndCashback,
  calculateWalletEligibility,
  calculateOrderBill,
};
