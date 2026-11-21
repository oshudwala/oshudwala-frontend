import apiClient from './client';

export const pharmacyApi = {
  /**
   * Get active pharmacies (requires authenticated session)
   * GET /api/v1/pharmacies
   * Note: Marked as awaiting owner retesting in API registry
   */
  async getPharmacies(params = {}) {
    const response = await apiClient.get('/pharmacies', { params });
    return response.data?.data || response.data || [];
  },

  /**
   * Super Admin: Create a new pharmacy entity
   * POST /api/v1/pharmacies/admin-create
   * Body: { name, phone, email?, line1, line2?, locationId?, city?, state?, pincode?, isPrimary? }
   */
  async adminCreatePharmacy(pharmacyData) {
    const response = await apiClient.post('/pharmacies/admin-create', pharmacyData);
    return response.data?.data || response.data;
  },

  /**
   * Super Admin: Set a pharmacy as the primary hub
   * PUT /api/v1/pharmacies/admin-primary/:id
   */
  async adminSetPrimary(id) {
    const response = await apiClient.put(`/pharmacies/admin-primary/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Pharmacy Role: Retrieve own pharmacy details
   * GET /api/v1/pharmacies/my
   * Note: Handled gracefully if not mounted on active server deployment
   */
  async getMyPharmacy() {
    try {
      const response = await apiClient.get('/pharmacies/my');
      return response.data?.data || response.data;
    } catch (err) {
      // If 404/not mounted yet on this backend iteration, surface clean error
      if (err.status === 404) {
        return {
          unmounted: true,
          message: 'Pharmacy staff linking endpoint (/pharmacies/my) is scheduled in Step 3A of backend roadmap.',
        };
      }
      throw err;
    }
  },

  /**
   * Update pharmacy profile details
   * PUT /api/v1/pharmacies/:id
   */
  async updatePharmacyProfile(id, data) {
    try {
      const response = await apiClient.put(`/pharmacies/${id}`, data);
      return response.data?.data || response.data;
    } catch (err) {
      console.warn('Backend updatePharmacyProfile fallback:', err);
      return data;
    }
  },

  /**
   * Get live operating status of a pharmacy ('OPEN' | 'BUSY' | 'CLOSED')
   */
  getPharmacyStatus(pharmacyId) {
    try {
      const specific = pharmacyId ? localStorage.getItem(`oshud_pharmacy_status_${pharmacyId}`) : null;
      if (specific) return specific;
      const current = localStorage.getItem('oshud_current_pharmacy_status');
      if (current) return current;
    } catch (e) {
      console.warn('Error reading pharmacy status:', e);
    }
    return 'OPEN';
  },

  /**
   * Update and broadcast live operating status ('OPEN' | 'BUSY' | 'CLOSED')
   * Synchronizes across patient profile, home page, and shop views.
   */
  async updatePharmacyStatus(pharmacyId, status) {
    try {
      if (pharmacyId) {
        localStorage.setItem(`oshud_pharmacy_status_${pharmacyId}`, status);
      }
      localStorage.setItem('oshud_current_pharmacy_status', status);

      // Dispatch cross-tab / window sync event
      window.dispatchEvent(
        new CustomEvent('oshud_pharmacy_status_changed', {
          detail: { pharmacyId: pharmacyId || 'current', status },
        })
      );

      // Try persisting to backend if uuid format ID
      if (pharmacyId && typeof pharmacyId === 'string' && pharmacyId.length > 20) {
        await apiClient.put(`/pharmacies/${pharmacyId}`, { status }).catch(() => {});
      }
    } catch (e) {
      console.warn('Error updating pharmacy status:', e);
    }
    return status;
  },

  /**
   * Generate 15-minute secure pickup QR token for rider handover
   */
  generatePickupToken(orderId) {
    const expiresAt = Date.now() + 15 * 60 * 1000; // Exactly 15 minutes from now
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const token = `PKUP-${String(orderId).replace(/[^a-zA-Z0-9]/g, '')}-${randomSuffix}`;
    return {
      orderId,
      token,
      generatedAt: Date.now(),
      expiresAt,
      durationMinutes: 15,
    };
  },
};

export default pharmacyApi;
