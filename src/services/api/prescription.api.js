import apiClient from './client';

export const prescriptionApi = {
  /**
   * Submit Prescription (PATIENT role)
   * POST /api/v1/prescriptions
   * Automatically routes to the Primary Pharmacy
   */
  async submitPrescription(data) {
    let response;
    if (data instanceof FormData) {
      response = await apiClient.post('/prescriptions', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      response = await apiClient.post('/prescriptions', data);
    }
    return response.data?.data || response.data;
  },

  /**
   * Upload prescription helper accepting file, notes, doctorName
   */
  async uploadPrescription({ file, patientNotes, doctorName, preferredPharmacyId }) {
    const formData = new FormData();
    if (file) {
      formData.append('files', file);
    }
    if (patientNotes) {
      formData.append('patientNote', patientNotes);
    }
    if (doctorName) {
      formData.append('doctorName', doctorName);
    }
    if (preferredPharmacyId) {
      formData.append('pharmacyId', preferredPharmacyId);
    }
    return this.submitPrescription(formData);
  },

  /**
   * Retrieve patient's own submitted prescriptions (PATIENT role)
   * GET /api/v1/prescriptions/my
   */
  async getMyPrescriptions() {
    const response = await apiClient.get('/prescriptions/my');
    return response.data?.data || response.data || [];
  },

  /**
   * Retrieve prescriptions for review queue (SUPER_ADMIN or PHARMACY role)
   * GET /api/v1/prescriptions or GET /api/v1/prescriptions/pharmacy/:pharmacyId
   */
  async getPharmacyPrescriptions(pharmacyId) {
    const url = pharmacyId ? `/prescriptions/pharmacy/${pharmacyId}` : '/prescriptions';
    const response = await apiClient.get(url);
    return response.data?.data || response.data || [];
  },

  /**
   * Pharmacist / Super Admin: Review & Verify or Reject a Prescription
   * PATCH /api/v1/prescriptions/:id/review
   * Body: { status: 'VERIFIED' | 'REJECTED', rejectionReason?: string }
   */
  async reviewPrescription(id, { status, rejectionReason }) {
    const payload = {
      status,
      ...(rejectionReason ? { rejectionReason: rejectionReason.trim() } : {}),
    };
    const response = await apiClient.patch(`/prescriptions/${id}/review`, payload);
    return response.data?.data || response.data;
  },
};

export default prescriptionApi;
