import apiClient from './api';

export const prescriptionService = {
  /**
   * Upload prescription for licensed pharmacist verification
   * POST /api/v1/prescriptions/upload
   */
  async uploadPrescription({ file, patientNotes, preferredPharmacyId, patientName, patientPhone }) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (patientNotes) formData.append('notes', patientNotes);
      if (preferredPharmacyId) formData.append('pharmacyId', preferredPharmacyId);
      if (patientName) formData.append('patientName', patientName);
      if (patientPhone) formData.append('patientPhone', patientPhone);

      const response = await apiClient.post('/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data || response.data;
    } catch (err) {
      // Backend prescription module is in development (Step 5)
      throw new Error(
        'Prescription OCR and digital verification is currently in development (Backend Step 5). Please send your prescription directly to our registered pharmacist via WhatsApp for immediate verification and delivery.'
      );
    }
  },

  /**
   * Retrieve uploaded prescriptions for authenticated user
   * GET /api/v1/prescriptions
   */
  async getUserPrescriptions() {
    try {
      const response = await apiClient.get('/prescriptions');
      return response.data?.data || response.data || [];
    } catch {
      return [];
    }
  },
};

export default prescriptionService;
