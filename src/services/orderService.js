import apiClient from './api';

export const orderService = {
  /**
   * Place an order with verified pharmacy
   * POST /api/v1/orders
   */
  async placeOrder({
    items,
    address,
    paymentMethod,
    deliverySlot,
    prescriptionId,
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
    try {
      const response = await apiClient.post('/orders', {
        items,
        address,
        paymentMethod,
        deliverySlot,
        prescriptionId,
        couponCode,
        subtotal: totalMrp || subtotal,
        packagingFee: packagingFee || 6,
        platformFee: platformFee || 9,
        deliveryFee,
        discount,
        cashback,
        total,
      });
      return response.data?.data || response.data;
    } catch (err) {
      // Backend orders module is in active development (Step 6)
      throw new Error(
        'Online checkout integration is currently scheduled for backend Phase 2 (Step 6). To fulfill this order immediately with standard express delivery, please connect with our official WhatsApp helpline.'
      );
    }
  },

  /**
   * Retrieve active and past orders for authenticated user
   * GET /api/v1/orders
   */
  async getUserOrders() {
    try {
      const response = await apiClient.get('/orders');
      return response.data?.data || response.data || [];
    } catch (err) {
      // Return empty list until backend orders API is deployed
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
