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
};

export default pharmacyApi;
