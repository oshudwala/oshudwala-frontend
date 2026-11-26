import apiClient from './client';

export const categoryApi = {
  /**
   * List all categories
   * GET /api/v1/categories
   */
  async getCategories() {
    const response = await apiClient.get('/categories');
    return response.data?.data || response.data || [];
  },

  /**
   * Super Admin: Create a new category
   * POST /api/v1/categories
   * Body: { name, slug?, parentId?, imageUrl?, sortOrder?, isActive? }
   */
  async createCategory(categoryData) {
    const response = await apiClient.post('/categories', categoryData);
    return response.data?.data || response.data;
  },

  /**
   * Super Admin: Update category
   * PUT /api/v1/categories/:id
   */
  async updateCategory(id, categoryData) {
    const response = await apiClient.put(`/categories/${id}`, categoryData);
    return response.data?.data || response.data;
  },
};

export default categoryApi;
