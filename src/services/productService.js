import apiClient from './api';
import { productsData } from '../data/productsData';

const mapBackendProduct = (p) => ({
  id: p.id,
  name: p.name,
  genericName: p.genericName || '',
  brand: p.manufacturer || p.brand || 'Oshud Wala Quality Assured',
  category: p.category?.slug || p.categoryId || p.category || 'general',
  categoryName: p.category?.name || p.categoryName || 'General Health',
  strength: p.packSize || p.strength || '',
  dosageForm: p.dosageForm || 'Tablet',
  packaging: p.packSize || p.packaging || 'Standard Pack',
  price: p.mrpPaise ? p.mrpPaise / 100 : (Number(p.price) || 0),
  mrp: p.mrpPaise ? p.mrpPaise / 100 : (Number(p.mrp) || Number(p.price) || 0),
  discountPercent: p.discountPercent || 0,
  prescriptionRequired: Boolean(p.requiresPrescription ?? p.prescriptionRequired),
  rating: p.rating || 4.8,
  reviewCount: p.reviewCount || 120,
  inStock: p.isActive !== false && p.inStock !== false,
  stockCount: p.stockCount || 50,
  image: (p.imageUrls && p.imageUrls[0]) || p.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=500',
  description: p.description || '',
  directions: p.directions || '',
  sideEffects: p.sideEffects || '',
  precautions: p.precautions || '',
});

export const productService = {
  async getProducts({ category, search, prescriptionRequired, sort, page = 1, limit = 20 } = {}) {
    try {
      const response = await apiClient.get('/products', {
        params: {
          categoryId: category && category !== 'all' ? category : undefined,
          q: search && search.trim() ? search.trim() : undefined,
          requiresPrescription: prescriptionRequired !== null && prescriptionRequired !== undefined ? String(prescriptionRequired) : undefined,
          page,
          limit
        }
      });
      const data = response.data?.data || response.data;
      const rawList = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data)
        ? data
        : [];

      if (rawList.length > 0) {
        return {
          products: rawList.map(mapBackendProduct),
          pagination: {
            total: data.total || rawList.length,
            pages: data.totalPages || 1,
            current: data.page || page,
            limit
          },
          isMock: false
        };
      }
      // If backend returns 0 items (e.g. fresh DB), fallback to curated demo catalog
      throw new Error('Fallback to local catalog');
    } catch {
      // Development mock adapter fallback
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
      const data = response.data?.data || response.data;
      const rawProd = data?.product || data;
      if (rawProd && rawProd.id) {
        return { product: mapBackendProduct(rawProd), isMock: false };
      }
      throw new Error('Not found in backend');
    } catch {
      const found = productsData.find(p => p.id === id) || productsData[0];
      return { product: found, isMock: true };
    }
  }
};
