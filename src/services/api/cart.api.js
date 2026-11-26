import apiClient from './client';

export const cartApi = {
  /**
   * Get current cart items (PATIENT role)
   * GET /api/v1/cart
   */
  async getCart() {
    const response = await apiClient.get('/cart');
    return response.data?.data || response.data;
  },

  /**
   * Add item to cart (PATIENT role)
   * POST /api/v1/cart/items
   * Body: { productId: "uuid", quantity: number }
   */
  async addItem(productId, quantity = 1) {
    const response = await apiClient.post('/cart/items', { productId, quantity });
    return response.data?.data || response.data;
  },

  /**
   * Update item quantity in cart (PATIENT role)
   * PUT /api/v1/cart/items/:productId
   * Body: { quantity: number }
   */
  async updateItemQuantity(productId, quantity) {
    const response = await apiClient.put(`/cart/items/${productId}`, { quantity });
    return response.data?.data || response.data;
  },

  /**
   * Remove item from cart (PATIENT role)
   * DELETE /api/v1/cart/items/:productId
   */
  async removeItem(productId) {
    const response = await apiClient.delete(`/cart/items/${productId}`);
    return response.data?.data || response.data;
  },

  /**
   * Clear all items from cart (PATIENT role)
   * DELETE /api/v1/cart
   */
  async clearCart() {
    const response = await apiClient.delete('/cart');
    return response.data?.data || response.data;
  },
};

export default cartApi;
