import apiClient from './api';

const isUuid = (val) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

const normalizeOrder = (o) => {
  if (!o) return null;
  const subtotal = o.subtotal !== undefined ? Number(o.subtotal) : Number(o.subtotalPaise || 0) / 100;
  const total = o.total !== undefined ? Number(o.total) : Number(o.totalPaise || 0) / 100;
  const deliveryFee = o.deliveryFee !== undefined ? Number(o.deliveryFee) : Number(o.deliveryFeePaise || 0) / 100;
  const addr = o.deliveryAddress || {};
  const fullAddress =
    o.address ||
    [addr.line1, addr.area, addr.city, addr.pincode].filter(Boolean).join(', ') ||
    addr.line1 ||
    'Home Delivery Address';

  const rawItems = o.items || [];
  const normalizedItems = rawItems.map((it) => {
    const qty = Number(it.qty || it.quantity || 1);
    const price =
      it.price !== undefined
        ? Number(it.price)
        : Number(it.unitPricePaise || it.mrpPaise || 0) / 100;
    return {
      id: it.id,
      name: it.name || it.nameSnapshot || it.product?.name || 'Prescription Medicine',
      qty,
      quantity: qty,
      price,
      unitPrice: price,
      lineTotal: Number(it.lineTotal || (it.lineTotalPaise ? it.lineTotalPaise / 100 : price * qty)),
      requiresPrescription: Boolean(it.requiresPrescription),
      form: it.form || it.packaging || 'Pack',
    };
  });

  const otp = o.deliveryOtp || addr.deliveryOtp || '9876';

  return {
    ...o,
    id: o.orderNumber || o.id,
    backendId: o.id,
    orderNumber: o.orderNumber || o.id,
    status: o.status,
    total,
    subtotal,
    deliveryFee,
    deliveryOtp: otp,
    address: fullAddress,
    customerName: o.customerName || addr.fullName || 'Customer',
    customerPhone: o.customerPhone || addr.phone || '',
    pharmacyName: o.pharmacyName || o.pharmacy?.name || 'Licensed Partner Pharmacy',
    pharmacyAddress: o.pharmacyAddress || [o.pharmacy?.line1, o.pharmacy?.city].filter(Boolean).join(', ') || '',
    pharmacyPhone: o.pharmacyPhone || o.pharmacy?.phone || '',
    items: normalizedItems,
    timeline: o.timeline || [
      { status: 'Order Placed & Confirmed', time: new Date(o.placedAt || o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), completed: true },
      { status: 'Pharmacy Approved & Packed', time: o.status !== 'PENDING_PHARMACY_REVIEW' ? 'Completed' : 'In Review', completed: o.status !== 'PENDING_PHARMACY_REVIEW' },
      { status: 'Rider Out For Delivery', time: ['OUT_FOR_DELIVERY', 'SHIPPED', 'PICKED_UP', 'DELIVERED'].includes(o.status) ? 'Dispatched' : 'Pending', completed: ['OUT_FOR_DELIVERY', 'SHIPPED', 'PICKED_UP', 'DELIVERED'].includes(o.status) },
      { status: 'Delivered to Doorstep', time: o.status === 'DELIVERED' ? 'Delivered' : 'Pending', completed: o.status === 'DELIVERED' },
    ],
  };
};

export const orderService = {
  /**
   * Place an order with verified pharmacy
   * POST /api/v1/orders
   */
  async placeOrder({
    items,
    address,
    addressId,
    paymentMethod,
    deliverySlot,
    prescriptionId,
    prescriptionFileName,
    couponCode,
    subtotal,
    totalMrp,
    packagingFee,
    platformFee,
    deliveryFee,
    discount,
    cashback,
    total,
  }) {
    const formattedItems = Array.isArray(items)
      ? items.map((it) => ({
          productId: isUuid(it.productId) ? it.productId : isUuid(it.id) ? it.id : undefined,
          id: isUuid(it.id) ? it.id : undefined,
          quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
        }))
      : undefined;

    const payload = {
      addressId: isUuid(addressId) ? addressId : undefined,
      prescriptionId: isUuid(prescriptionId) ? prescriptionId : null,
      couponCode: couponCode ? String(couponCode).trim().toUpperCase() : null,
      items: formattedItems,
      // Metadata / slip details
      address,
      paymentMethod: paymentMethod || 'Cash on Delivery (COD)',
      deliverySlot: deliverySlot || 'Standard Delivery',
      subtotal: totalMrp || subtotal,
      packagingFee: packagingFee || 6,
      platformFee: platformFee || 9,
      deliveryFee,
      discount,
      cashback,
      total,
    };

    try {
      const response = await apiClient.post('/orders', payload);
      return response.data?.data || response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      console.warn('Backend order placement API returned:', errorMsg);

      // If backend gave an explicit error (coupon issue, empty cart, validation), throw so user sees it
      if (err.response && (err.response.status === 400 || err.response.status === 422 || err.response.status === 409)) {
        throw new Error(errorMsg || 'Order placement failed. Please verify your order details.');
      }

      // If network offline or completely unhandled server error, throw clear error
      if (err.response?.status === 401) {
        throw new Error('Please sign in to complete your checkout.');
      }

      throw new Error(errorMsg || 'Failed to place order. Please check network connection.');
    }
  },

  /**
   * Retrieve active and past orders for authenticated user
   * GET /api/v1/orders
   */
  async getUserOrders() {
    try {
      let response;
      try {
        response = await apiClient.get('/orders/my');
      } catch {
        response = await apiClient.get('/orders');
      }
      const raw = response?.data?.data || response?.data || [];
      const list = Array.isArray(raw) ? raw : [];
      return list.map(normalizeOrder).filter(Boolean);
    } catch (err) {
      console.warn('orderService.getUserOrders notice:', err.message);
      return [];
    }
  },

  /**
   * Get single order details
   * GET /api/v1/orders/:id
   */
  async getOrderById(id) {
    const response = await apiClient.get(`/orders/${id}`);
    const data = response.data?.data || response.data;
    return normalizeOrder(data);
  },
};

export default orderService;
