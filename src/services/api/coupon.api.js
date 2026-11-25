import apiClient from './client';

export const couponApi = {
  /**
   * Get coupons list
   * Logged-in: Super Admin gets all coupons (active & inactive), Patients get active coupons
   */
  async getCoupons() {
    try {
      const response = await apiClient.get('/coupons');
      const data = response.data?.data || response.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Backend getCoupons notice:', err.message);
      return [];
    }
  },

  /**
   * Super Admin: Create a new coupon
   * @param {Object} data
   */
  async createCoupon(data) {
    const payload = {
      code: String(data.code || '').trim().toUpperCase(),
      description: data.description ? String(data.description).trim() : null,
      discountType: data.discountType || 'PERCENT', // 'PERCENT' | 'FLAT'
      discountValue: parseInt(data.discountValue, 10),
      maxDiscountPaise: data.maxDiscountPaise ? parseInt(data.maxDiscountPaise, 10) : null,
      minOrderPaise: data.minOrderPaise ? parseInt(data.minOrderPaise, 10) : 0,
      validFrom: data.validFrom ? new Date(data.validFrom).toISOString() : new Date().toISOString(),
      validTo: data.validTo ? new Date(data.validTo).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
      usageLimitTotal: data.usageLimitTotal ? parseInt(data.usageLimitTotal, 10) : null,
      usageLimitPerUser: data.usageLimitPerUser ? parseInt(data.usageLimitPerUser, 10) : 1,
      isActive: data.isActive !== false,
    };

    const response = await apiClient.post('/coupons', payload);
    return response.data?.data || response.data;
  },

  /**
   * Super Admin: Update existing coupon
   * @param {string} id
   * @param {Object} data
   */
  async updateCoupon(id, data) {
    const payload = {};
    if (data.description !== undefined) {
      payload.description = data.description ? String(data.description).trim() : null;
    }
    if (data.maxDiscountPaise !== undefined) {
      payload.maxDiscountPaise = data.maxDiscountPaise ? parseInt(data.maxDiscountPaise, 10) : null;
    }
    if (data.minOrderPaise !== undefined) {
      payload.minOrderPaise = parseInt(data.minOrderPaise, 10) || 0;
    }
    if (data.validTo !== undefined && data.validTo) {
      payload.validTo = new Date(data.validTo).toISOString();
    }
    if (data.usageLimitTotal !== undefined) {
      payload.usageLimitTotal = data.usageLimitTotal ? parseInt(data.usageLimitTotal, 10) : null;
    }
    if (data.usageLimitPerUser !== undefined) {
      payload.usageLimitPerUser = parseInt(data.usageLimitPerUser, 10) || 1;
    }
    if (data.isActive !== undefined) {
      payload.isActive = Boolean(data.isActive);
    }

    const response = await apiClient.put(`/coupons/${id}`, payload);
    return response.data?.data || response.data;
  },

  /**
   * Super Admin: Toggle coupon active/inactive status
   * @param {string} id
   * @param {boolean} isActive
   */
  async updateCouponStatus(id, isActive) {
    try {
      const response = await apiClient.patch(`/coupons/${id}/status`, { isActive });
      return response.data?.data || response.data;
    } catch {
      // Fallback to PUT /coupons/:id
      const response = await apiClient.put(`/coupons/${id}`, { isActive });
      return response.data?.data || response.data;
    }
  },

  /**
   * Patient: Validate coupon code against current subtotal
   * @param {string} code
   * @param {number} subtotalPaise
   */
  async validateCoupon(code, subtotalPaise) {
    const payload = {
      code: String(code || '').trim().toUpperCase(),
      subtotalPaise: Math.round(Number(subtotalPaise) || 0),
    };

    const response = await apiClient.post('/coupons/validate', payload);
    return response.data?.data || response.data;
  },
};

export default couponApi;
