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
      const items = Array.isArray(data) ? data : data?.pharmacies || data?.items || [];

      if (items.length > 0) {
        return {
          pharmacies: items.map((p) => {
            const activeReceptionist =
              p.staff?.find((s) => s.staffRole === 'RECEPTIONIST' && s.isActive !== false)?.user?.fullName ||
              p.staff?.find((s) => s.isActive !== false)?.user?.fullName || null;
            const assignedDoctorNames =
              p.doctors?.map((d) => d.doctor?.fullName).filter(Boolean) || [];

            return {
              id: p.id,
              name: p.name,
              phone: p.phone,
              email: p.email,
              address: `${p.line1 || ''}${p.line2 ? `, ${p.line2}` : ''}, ${p.city || ''}, ${p.state || ''} - ${p.pincode || ''}`.replace(/^,\s*/, ''),
              city: p.city,
              state: p.state,
              pincode: p.pincode,
              rating: p.rating || 4.8,
              reviewsCount: p.reviewsCount || 120,
              image: p.logoUrl || 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=400',
              isPrimary: p.isPrimary,
              hasClinicService: Boolean(p.hasClinicService),
              hasMedicineService: Boolean(p.hasMedicineService !== false),
              deliveryTime: '30-45 mins',
              receptionistName: activeReceptionist,
              doctorNames: assignedDoctorNames,
              doctorsCount: p.doctors?.length || 0,
              isVerifiedBackend: true,
              raw: p,
            };
          }),
          isMock: false,
        };
      }
      return { pharmacies: [], isMock: false };
    } catch (err) {
      console.warn('Backend /pharmacies fetch error:', err.message);
      return {
        pharmacies: [],
        isMock: false,
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

    return { pharmacy: null, isMock: false };
  },

  // Admin capabilities
  createPharmacy: (data) => pharmacyApi.adminCreatePharmacy(data),
  setPrimaryPharmacy: (id) => pharmacyApi.adminSetPrimary(id),
  getMyPharmacy: () => pharmacyApi.getMyPharmacy(),
};

export default pharmacyService;
