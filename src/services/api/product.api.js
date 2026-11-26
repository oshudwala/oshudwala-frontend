import apiClient from './client';

export const productApi = {
  /**
   * List medicines & products
   * GET /api/v1/products
   * Query params: { q, categoryId, requiresPrescription, page, limit }
   */
  async getProducts(params = {}) {
    const response = await apiClient.get('/products', { params });
    return response.data?.data || response.data || [];
  },

  /**
   * Get single product by id
   * GET /api/v1/products/:id
   */
  async getProductById(id) {
    const response = await apiClient.get(`/products/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Super Admin: Create a new product / medicine
   * POST /api/v1/products
   * Body: { name, slug?, genericName?, manufacturer?, categoryId, mrpPaise, requiresPrescription, packSize?, description?, imageUrls?, isActive? }
   */
  async createProduct(productData) {
    const response = await apiClient.post('/products', productData);
    return response.data?.data || response.data;
  },

  /**
   * Super Admin: Update product / medicine
   * PUT /api/v1/products/:id
   */
  async updateProduct(id, productData) {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data?.data || response.data;
  },
};

export default productApi;
