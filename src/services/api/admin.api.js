import apiClient from './client';

export const adminApi = {
  /**
   * Super Admin: Get paginated list of users
   * GET /api/v1/admin/users
   * Query params: page, limit
   */
  async getUsers(params = { page: 1, limit: 10 }) {
    const response = await apiClient.get('/admin/users', { params });
    return response.data?.data || response.data;
  },

  /**
   * Super Admin: Update user access, role and status
   * PUT /api/v1/admin/users/:id/access
   * Body: { roleName, status? }
   */
  async updateUserAccess(id, { roleName, status }) {
    const payload = { roleName };
    if (status) payload.status = status;
    const response = await apiClient.put(`/admin/users/${id}/access`, payload);
    return response.data?.data || response.data;
  },

  /**
   * Super Admin: Get all platform settings
   * GET /api/v1/admin/settings
   */
  async getSettings() {
    const response = await apiClient.get('/admin/settings');
    return response.data?.data || response.data || [];
  },

  /**
   * Super Admin: Create or update a platform setting
   * POST /api/v1/admin/settings
   * Body: { key, value }
   */
  async setSetting({ key, value }) {
    const response = await apiClient.post('/admin/settings', { key, value });
    return response.data?.data || response.data;
  },
};

export default adminApi;
