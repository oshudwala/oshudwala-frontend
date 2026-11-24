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
        const savedImages = (() => {
          try {
            const raw = localStorage.getItem('oshud_facility_images');
            return raw ? JSON.parse(raw) : {};
          } catch {
            return {};
          }
        })();

        const savedFeaturedClins = (() => {
          try {
            const raw = localStorage.getItem('oshud_featured_clinics');
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();

        const savedFeaturedPharms = (() => {
          try {
            const raw = localStorage.getItem('oshud_featured_pharmacies');
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();

        return {
          pharmacies: items.map((p) => {
            const activeReceptionist =
              p.staff?.find((s) => s.staffRole === 'RECEPTIONIST' && s.isActive !== false)?.user?.fullName ||
              p.staff?.find((s) => s.isActive !== false)?.user?.fullName || null;
            const assignedDoctorNames =
              p.doctors?.map((d) => d.doctor?.fullName).filter(Boolean) || [];

            const facilityImage =
              savedImages[p.id] ||
              p.logoUrl ||
              p.coverUrl ||
              p.imageUrl ||
              '';

            const isItemFeatured = Boolean(
              p.isFeatured ||
              (p.hasClinicService && Array.isArray(savedFeaturedClins) && savedFeaturedClins.includes(p.id)) ||
              (p.hasMedicineService !== false && Array.isArray(savedFeaturedPharms) && savedFeaturedPharms.includes(p.id))
            );

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
              image: facilityImage,
              imageUrl: facilityImage,
              logoUrl: facilityImage || p.logoUrl || '',
              isPrimary: Boolean(p.isPrimary),
              isFeatured: isItemFeatured,
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
