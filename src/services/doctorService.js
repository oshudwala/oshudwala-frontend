import apiClient from './api';
import { doctorsData } from '../data/doctorsData';

export const doctorService = {
  async getDoctors({ specialization, search } = {}) {
    try {
      const response = await apiClient.get('/doctors', { params: { specialization, search } });
      return response.data;
    } catch {
      let filtered = [...doctorsData];
      if (specialization && specialization !== 'All') {
        filtered = filtered.filter(d => d.specialization.toLowerCase().includes(specialization.toLowerCase()));
      }
      if (search && search.trim() !== '') {
        const q = search.toLowerCase();
        filtered = filtered.filter(d =>
          d.name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.clinicName.toLowerCase().includes(q)
        );
      }
      return { doctors: filtered, isMock: true };
    }
  },

  async getDoctorById(id) {
    try {
      const response = await apiClient.get(`/doctors/${id}`);
      return response.data;
    } catch {
      const doc = doctorsData.find(d => d.id === id) || doctorsData[0];
      return { doctor: doc, isMock: true };
    }
  },

  async bookAppointment({ doctorId, clinicId, date, slotTime, patientName, patientPhone, notes }) {
    try {
      const response = await apiClient.post('/appointments', {
        doctorId, clinicId, date, slotTime, patientName, patientPhone, notes
      });
      return response.data;
    } catch {
      const doc = doctorsData.find(d => d.id === doctorId) || doctorsData[0];
      const randomNum = Math.floor(10 + Math.random() * 25);
      const tokenNumber = `${doc.tokenPrefix || 'AP'}-${randomNum}`;
      
      const appointment = {
        id: "apt-" + Date.now(),
        doctorId,
        doctorName: doc.name,
        doctorSpecialization: doc.specialization,
        doctorImage: doc.image,
        clinicName: doc.clinicName,
        date: date || new Date().toISOString().split('T')[0],
        slotTime: slotTime || "05:00 PM",
        patientName: patientName || "Ayon Paul",
        patientPhone: patientPhone || "+880 1712-345678",
        tokenNumber,
        currentServingToken: `${doc.tokenPrefix || 'AP'}-${Math.max(1, randomNum - 3)}`,
        status: "CONFIRMED",
        fee: doc.consultationFee,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage for demo persistence
      const existing = JSON.parse(localStorage.getItem('oshud_appointments') || '[]');
      existing.unshift(appointment);
      localStorage.setItem('oshud_appointments', JSON.stringify(existing));

      return { appointment, tokenNumber, isMock: true };
    }
  },

  getUserAppointments() {
    const defaultAppointments = [
      {
        id: "apt-default-1",
        doctorId: "doc-1",
        doctorName: "Dr. Priya Sharma",
        doctorSpecialization: "General Physician",
        doctorImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600",
        clinicName: "Central Health Clinic, Dhanmondi",
        date: "Today",
        slotTime: "05:30 PM",
        patientName: "Ayon Paul",
        tokenNumber: "GP-14",
        currentServingToken: "GP-11",
        estimatedWait: "18 mins",
        status: "IN_QUEUE",
        fee: 500,
        createdAt: new Date().toISOString()
      }
    ];

    const stored = localStorage.getItem('oshud_appointments');
    if (!stored) {
      localStorage.setItem('oshud_appointments', JSON.stringify(defaultAppointments));
      return defaultAppointments;
    }
    return JSON.parse(stored);
  }
};
