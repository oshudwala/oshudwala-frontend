import apiClient from './api';

export const prescriptionService = {
  async uploadPrescription({ file, patientNotes, preferredPharmacyId, patientName, patientPhone }) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (patientNotes) formData.append('notes', patientNotes);
      if (preferredPharmacyId) formData.append('pharmacyId', preferredPharmacyId);
      if (patientName) formData.append('patientName', patientName);
      if (patientPhone) formData.append('patientPhone', patientPhone);

      const response = await apiClient.post('/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch {
      // Local development mock adapter
      const prescriptionId = "RX-" + Math.floor(100000 + Math.random() * 900000);
      const newPrescription = {
        id: prescriptionId,
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        fileType: file.type,
        previewUrl: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        status: "PENDING_VERIFICATION", // PENDING_VERIFICATION, VERIFIED, REJECTED
        patientNotes: patientNotes || "Please dispense generic alternatives if branded medicine is unavailable.",
        pharmacyName: preferredPharmacyId ? "MedPlus Pharmacy, Kolkata" : "Nearest Verified Pharmacy in West Bengal",
        pharmacistReview: "Prescription queued for West Bengal Registered Pharmacist verification.",
        isMock: true
      };

      const existing = JSON.parse(localStorage.getItem('oshud_prescriptions') || '[]');
      existing.unshift(newPrescription);
      localStorage.setItem('oshud_prescriptions', JSON.stringify(existing));

      return { prescription: newPrescription, isMock: true };
    }
  },

  getUserPrescriptions() {
    const defaultList = [
      {
        id: "RX-841920",
        fileName: "Dr_Priya_Sharma_Apollo_Prescription.pdf",
        fileSize: "1.4 MB",
        fileType: "application/pdf",
        uploadedAt: "2026-11-14T10:30:00.000Z",
        status: "VERIFIED",
        patientNotes: "Deliver to Salt Lake Sector 1 address",
        pharmacyName: "MedPlus Pharmacy, Salt Lake, Kolkata",
        pharmacistReview: "Verified by WB Registered Pharmacist S. Banerjee (Reg #WBSPC-A-1982). All medications confirmed in stock."
      }
    ];

    const stored = localStorage.getItem('oshud_prescriptions');
    if (!stored) {
      localStorage.setItem('oshud_prescriptions', JSON.stringify(defaultList));
      return defaultList;
    }
    return JSON.parse(stored);
  }
};
