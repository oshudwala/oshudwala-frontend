import { prescriptionApi } from './api/prescription.api';

export const prescriptionService = {
  /**
   * Upload prescription for licensed pharmacist verification
   * POST /api/v1/prescriptions (auto-routed to Primary Pharmacy)
   */
  async uploadPrescription({ file, patientNotes, preferredPharmacyId, patientName, patientPhone }) {
    try {
      const res = await prescriptionApi.uploadPrescription({
        file,
        patientNotes,
        doctorName: patientName,
        preferredPharmacyId,
      });
      return res;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Prescription submission failed. Please ensure a valid image or PDF is attached.';
      throw new Error(message);
    }
  },

  /**
   * Retrieve uploaded prescriptions for authenticated user
   * GET /api/v1/prescriptions/my
   */
  async getUserPrescriptions() {
    try {
      return await prescriptionApi.getMyPrescriptions();
    } catch {
      return [];
    }
  },
};

export default prescriptionService;
