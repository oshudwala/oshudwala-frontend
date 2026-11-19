import apiClient from './client';

export const doctorApi = {
  /**
   * Get doctors affiliated with a specific pharmacy
   * GET /api/v1/doctors/pharmacy/:pharmacyId
   */
  async getDoctorsByPharmacy(pharmacyId) {
    if (!pharmacyId) return [];
    const response = await apiClient.get(`/doctors/pharmacy/${pharmacyId}`);
    return response.data?.data || response.data || [];
  },

  /**
   * Super Admin: Onboard a new doctor to a pharmacy
   * POST /api/v1/doctors/onboard
   * Body: { pharmacyId, fullName, phone, specializationId, registrationNumber }
   */
  async onboardDoctor(doctorData) {
    const response = await apiClient.post('/doctors/onboard', doctorData);
    return response.data?.data || response.data;
  },

  /**
   * Get list of all doctor specializations
   * GET /api/v1/specializations
   */
  async getSpecializations() {
    const response = await apiClient.get('/specializations');
    return response.data?.data || response.data || [];
  },

  /**
   * Super Admin: Create a new specialization
   * POST /api/v1/specializations
   * Body: { name, description?, icon? }
   */
  async createSpecialization(specData) {
    const response = await apiClient.post('/specializations', specData);
    return response.data?.data || response.data;
  },
};

export default doctorApi;
