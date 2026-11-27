import apiClient from './api';

const isUuid = (val) =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

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
      const data = response?.data?.data || response?.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return [];
    }
  },

  /**
   * Get single order details
   * GET /api/v1/orders/:id
   */
  async getOrderById(id) {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data?.data || response.data;
  },
};

export default orderService;
