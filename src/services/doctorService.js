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
   * General Doctor Directory
   * Scoped to pharmacy chambers or curated catalog
   */
  async getDoctors({ specialization, search, pharmacyId } = {}) {
    if (pharmacyId) {
      return await this.getDoctorsByPharmacy(pharmacyId);
    }

    let filtered = [...doctorsData];
    if (specialization && specialization !== 'All') {
      filtered = filtered.filter((d) =>
        d.specialization.toLowerCase().includes(specialization.toLowerCase())
      );
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.clinicName.toLowerCase().includes(q)
      );
    }
    return { doctors: filtered, isMock: false };
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
