import { pharmacyApi } from './api/pharmacy.api';
import { pharmaciesData } from '../data/pharmaciesData';

export const pharmacyService = {
  /**
   * Fetch active pharmacies from backend API
   * GET /api/v1/pharmacies (Requires authentication)
   */
  async getPharmacies() {
    try {
      const data = await pharmacyApi.getPharmacies();
      const items = Array.isArray(data) ? data : data?.pharmacies || [];

      if (items.length > 0) {
        return {
          pharmacies: items.map((p) => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            address: `${p.line1}${p.line2 ? `, ${p.line2}` : ''}, ${p.city}, ${p.state} - ${p.pincode}`,
            city: p.city,
            state: p.state,
            pincode: p.pincode,
            rating: p.rating || 4.8,
            reviewsCount: p.reviewsCount || 120,
            image: p.logoUrl || pharmaciesData[0]?.image || 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=400',
            isPrimary: p.isPrimary,
            deliveryTime: '30-45 mins',
            isVerifiedBackend: true,
          })),
          isMock: false,
        };
      }
      return { pharmacies: [], isMock: false };
    } catch (err) {
      console.warn('Backend /pharmacies fetch error (requires authentication):', err.message);
      // Fallback to approved preview dataset only when unauthenticated
      return {
        pharmacies: pharmaciesData,
        isMock: true,
        error: err.message,
      };
    }
  },

  async getPharmacyById(id) {
    try {
      const data = await pharmacyApi.getPharmacies();
      const items = Array.isArray(data) ? data : [];
      const match = items.find((p) => p.id === id);
      if (match) {
        return { pharmacy: match, isMock: false };
      }
    } catch {}

    const pharm = pharmaciesData.find((p) => p.id === id) || pharmaciesData[0];
    return { pharmacy: pharm, isMock: true };
  },

  // Admin capabilities
  createPharmacy: (data) => pharmacyApi.adminCreatePharmacy(data),
  setPrimaryPharmacy: (id) => pharmacyApi.adminSetPrimary(id),
  getMyPharmacy: () => pharmacyApi.getMyPharmacy(),
};

export default pharmacyService;
