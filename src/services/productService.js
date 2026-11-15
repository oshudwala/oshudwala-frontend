import apiClient from './api';
import { productsData } from '../data/productsData';

export const productService = {
  async getProducts({ category, search, prescriptionRequired, sort, page = 1, limit = 20 } = {}) {
    try {
      const response = await apiClient.get('/products', {
        params: { category, search, prescriptionRequired, sort, page, limit }
      });
      return response.data;
    } catch {
      // Development mock adapter
      let filtered = [...productsData];

      if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
      }

      if (search && search.trim() !== '') {
        const q = search.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.genericName.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
        );
      }

      if (prescriptionRequired !== undefined && prescriptionRequired !== null) {
        filtered = filtered.filter(p => p.prescriptionRequired === Boolean(prescriptionRequired));
      }

      if (sort === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sort === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
      }

      return {
        products: filtered,
        pagination: {
          total: filtered.length,
          pages: 1,
          current: page,
          limit
        },
        isMock: true
      };
    }
  },

  async getProductById(id) {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return response.data;
    } catch {
      const found = productsData.find(p => p.id === id) || productsData[0];
      return { product: found, isMock: true };
    }
  }
};
