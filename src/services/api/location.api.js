import apiClient from './client';

export const locationApi = {
  /**
   * Get public active locations (for patient delivery selection & search)
   * GET /api/v1/locations
   * Query params: city, state, q, page, limit
   */
  async getLocations(params = {}) {
    const response = await apiClient.get('/locations', { params });
    return response.data?.data || response.data;
  },

  /**
   * Get single location details by ID
   * GET /api/v1/locations/:id
   */
  async getLocationById(id) {
    const response = await apiClient.get(`/locations/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Super Admin: Get all locations (including inactive)
   * GET /api/v1/locations/admin/all
   */
  async getAdminLocations(params = {}) {
    const response = await apiClient.get('/locations/admin/all', { params });
    return response.data?.data || response.data;
  },

  /**
   * Super Admin: Create new location
   * POST /api/v1/locations
   */
  async createLocation(locationData) {
    const response = await apiClient.post('/locations', locationData);
    return response.data?.data || response.data;
  },

  /**
   * Super Admin: Update location details
   * PUT /api/v1/locations/:id
   */
  async updateLocation(id, locationData) {
    const response = await apiClient.put(`/locations/${id}`, locationData);
    return response.data?.data || response.data;
  },

  /**
   * Super Admin: Toggle location active status
   * PATCH /api/v1/locations/:id/status
   */
  async updateLocationStatus(id, isActive) {
    const response = await apiClient.patch(`/locations/${id}/status`, { isActive });
    return response.data?.data || response.data;
  },
};

export default locationApi;
