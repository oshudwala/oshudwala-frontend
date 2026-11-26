import apiClient from './client';

export const orderApi = {
  /**
   * Get orders for the primary pharmacy (or specific pharmacy)
   * GET /orders or GET /orders/pharmacy/:pharmacyId
   */
  async getPharmacyOrders(pharmacyId) {
    const endpoint = pharmacyId ? `/orders/pharmacy/${pharmacyId}` : '/orders';
    const res = await apiClient.get(endpoint);
    return res.data?.data || res.data || [];
  },

  /**
   * Patient gets their own placed orders
   * GET /orders/my
   */
  async getMyOrders() {
    const res = await apiClient.get('/orders/my');
    return res.data?.data || res.data || [];
  },

  /**
   * Register and bill a walk-in / in-store counter order
   * POST /orders/walk-in
   */
  async createWalkInOrder(orderData) {
    const res = await apiClient.post('/orders/walk-in', orderData);
    return res.data?.data || res.data;
  },

  /**
   * Place COD / cart order for patient
   * POST /orders
   */
  async placeOrder(payload) {
    const res = await apiClient.post('/orders', payload);
    return res.data?.data || res.data;
  },

  /**
   * Transition order status (ACCEPTED, PREPARING, READY_FOR_PICKUP, REJECTED)
   * PATCH /orders/:id/status
   */
  async updateOrderStatus(orderId, status, reason) {
    const res = await apiClient.patch(`/orders/${orderId}/status`, { status, reason });
    return res.data?.data || res.data;
  },

  /**
   * Cancel order
   * PATCH /orders/:id/cancel
   */
  async cancelOrder(orderId, cancelReason) {
    const res = await apiClient.patch(`/orders/${orderId}/cancel`, { cancelReason });
    return res.data?.data || res.data;
  },
};

export default orderApi;
