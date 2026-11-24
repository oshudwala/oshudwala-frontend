import { doctorApi } from './api/doctor.api';
import { doctorsData } from '../data/doctorsData';

export const doctorService = {
  /**
   * Get doctors affiliated with a specific pharmacy chamber
   * GET /api/v1/doctors/pharmacy/:pharmacyId (Authentication required)
   */
  async getDoctorsByPharmacy(pharmacyId) {
    try {
      const data = await doctorApi.getDoctorsByPharmacy(pharmacyId);
      return { doctors: Array.isArray(data) ? data : [], isMock: false };
    } catch (err) {
      console.warn('Backend /doctors/pharmacy error:', err.message);
      return { doctors: [], isMock: false, error: err.message };
    }
  },

  /**
   * Get all registered specializations
   * GET /api/v1/specializations (Authentication required)
   */
  async getSpecializations() {
    try {
      const data = await doctorApi.getSpecializations();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Backend /specializations error:', err.message);
      return [];
    }
  },

  /**
   * Super Admin: Onboard a new doctor
   * POST /api/v1/doctors/onboard
   */
  async onboardDoctor(doctorData) {
    return await doctorApi.onboardDoctor(doctorData);
  },

  /**
   * General Doctor Directory from real backend GET /api/v1/doctors
   */
  async getDoctors({ specialization, search, pharmacyId } = {}) {
    if (pharmacyId) {
      return await this.getDoctorsByPharmacy(pharmacyId);
    }

    try {
      const params = {};
      if (search && search.trim()) params.q = search.trim();
      const data = await doctorApi.getDoctors(params);
      const items = Array.isArray(data) ? data : (data?.doctors || data?.items || []);

      if (items.length > 0) {
        let mapped = items.map((doc) => {
          const specNames = doc.specializations
            ?.map((s) => s.specialization?.name || s.name)
            .filter(Boolean)
            .join(', ') || 'General Medicine';

          const primaryChamber = doc.pharmacies?.[0]?.pharmacy?.name || 'Partner Health Desk';
          const feePaise = doc.pharmacies?.[0]?.consultationFeePaise || 50000;

          return {
            id: doc.id,
            name: doc.fullName,
            fullName: doc.fullName,
            specialty: specNames,
            specialization: specNames,
            degree: doc.qualifications || 'MBBS',
            experience: doc.experienceYears ? `${doc.experienceYears}+ years exp` : 'Certified Specialist',
            fee: `₹${(feePaise / 100).toFixed(0)}`,
            clinicName: primaryChamber,
            clinicId: doc.pharmacies?.[0]?.pharmacy?.id,
            image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
            rating: 4.9,
            reviews: 'Verified Doctor',
            nextAvailable: 'Available Today',
            raw: doc,
          };
        });

        if (specialization && specialization !== 'All') {
          mapped = mapped.filter((d) =>
            d.specialization.toLowerCase().includes(specialization.toLowerCase())
          );
        }

        return { doctors: mapped, isMock: false };
      }
      return { doctors: [], isMock: false };
    } catch (err) {
      console.warn('Backend /doctors fetch error:', err.message);
      return { doctors: [], isMock: false, error: err.message };
    }
  },

  async getDoctorById(id) {
    const doc = doctorsData.find((d) => d.id === id) || doctorsData[0];
    return { doctor: doc, isMock: false };
  },

  /**
   * Chamber queue appointment booking
   * Backend appointments API scheduled for Step 4
   */
  async bookAppointment({ doctorId, clinicId, date, slotTime, patientName, patientPhone, notes }) {
    // Backend appointments module is scheduled for development in Step 4
    throw new Error(
      'Live chamber queue booking API is scheduled for backend Phase 2. Please contact the chamber reception directly.'
    );
  },

  /**
   * Patient appointments list
   */
  getUserAppointments() {
    // When backend appointments API is live, this will call GET /api/v1/appointments
    return [];
  },
};

export default doctorService;
