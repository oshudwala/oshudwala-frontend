import apiClient from './client';
import accountRegistry from './accountRegistry';
import { clinicApi } from './clinic.api';

const PATIENT_RECORDS_KEY = 'oshud_patient_records';
const DOCTOR_STATUS_KEY_PREFIX = 'oshud_doctor_status_';
const DOCTOR_CLINICS_KEY_PREFIX = 'oshud_doctor_associated_clinics_';

// Initial realistic EHR Patient Records
const INITIAL_PATIENT_RECORDS = [
  {
    id: 'PAT-901',
    name: 'Subhasis Deb',
    phone: '+91 98301 77889',
    age: 48,
    gender: 'Male',
    bloodGroup: 'O+',
    chronicConditions: 'Hypertension, Allergic Bronchitis',
    allergies: 'Penicillin, Dust Mites',
    visits: 4,
    lastVisit: '20 Nov 2026',
    latestVitals: {
      bp: '130/85',
      pulse: '76',
      temp: '98.4',
      weight: '72',
      spO2: '98',
    },
    history: [
      {
        id: 'VST-201',
        date: '20 Nov 2026',
        doctorName: 'Dr. Priya Sharma',
        clinicName: 'Apollo Clinic, Salt Lake Kolkata',
        symptoms: 'Persistent dry cough for 5 days, mild evening fever',
        diagnosis: 'Acute Upper Respiratory Tract Infection',
        vitals: { bp: '130/85', pulse: '76', temp: '98.4', weight: '72', spO2: '98' },
        prescription: {
          medicines: [
            { name: 'Augmentin 625 Duo Tablet', dosage: '1 tab twice daily after meals', duration: '5 days' },
            { name: 'Pan 40 Tablet', dosage: '1 tab once daily before breakfast', duration: '7 days' },
            { name: 'Ascoril D Plus Syrup', dosage: '10ml thrice daily', duration: '5 days' },
          ],
          advice: 'Drink warm fluids. Avoid cold beverages and air drafts.',
        },
      },
      {
        id: 'VST-192',
        date: '14 Oct 2026',
        doctorName: 'Dr. Priya Sharma',
        clinicName: 'Apollo Clinic, Salt Lake Kolkata',
        symptoms: 'Routine hypertension follow-up',
        diagnosis: 'Essential Hypertension Stage 1',
        vitals: { bp: '138/88', pulse: '78', temp: '98.6', weight: '73', spO2: '99' },
        prescription: {
          medicines: [
            { name: 'Telma 40 Tablet', dosage: '1 tab once daily morning', duration: '30 days' },
          ],
          advice: 'Maintain low sodium diet. 30 mins brisk morning walk daily.',
        },
      },
    ],
  },
  {
    id: 'PAT-902',
    name: 'Debarati Ganguly',
    phone: '+91 98312 99001',
    age: 32,
    gender: 'Female',
    bloodGroup: 'B+',
    chronicConditions: 'Migraine with Aura',
    allergies: 'Sulfa Drugs',
    visits: 2,
    lastVisit: '19 Nov 2026',
    latestVitals: {
      bp: '118/76',
      pulse: '72',
      temp: '98.6',
      weight: '58',
      spO2: '99',
    },
    history: [
      {
        id: 'VST-202',
        date: '19 Nov 2026',
        doctorName: 'Dr. Priya Sharma',
        clinicName: 'Apollo Clinic, Salt Lake Kolkata',
        symptoms: 'Throbbing hemicranial headache triggered by screen glare',
        diagnosis: 'Acute Migraine Episode',
        vitals: { bp: '118/76', pulse: '72', temp: '98.6', weight: '58', spO2: '99' },
        prescription: {
          medicines: [
            { name: 'Naprosyn 500 Tablet', dosage: '1 tab SOS during attack', duration: '5 days' },
            { name: 'Domstal Tablet', dosage: '1 tab 15 mins prior to meal', duration: '3 days' },
          ],
          advice: 'Ensure adequate 8hr sleep. Use anti-glare screen protectors.',
        },
      },
    ],
  },
  {
    id: 'PAT-903',
    name: 'Monojit Ghosh',
    phone: '+91 98366 11234',
    age: 55,
    gender: 'Male',
    bloodGroup: 'A+',
    chronicConditions: 'Type 2 Diabetes, High BP',
    allergies: 'None Known',
    visits: 6,
    lastVisit: '18 Nov 2026',
    latestVitals: {
      bp: '142/90',
      pulse: '82',
      temp: '99.1',
      weight: '79',
      spO2: '97',
    },
    history: [
      {
        id: 'VST-203',
        date: '18 Nov 2026',
        doctorName: 'Dr. Priya Sharma',
        clinicName: 'Apollo Clinic, Salt Lake Kolkata',
        symptoms: 'Dizziness after morning walk, elevated fasting glucose',
        diagnosis: 'Uncontrolled Glycemia & Mild Hypertension',
        vitals: { bp: '142/90', pulse: '82', temp: '99.1', weight: '79', spO2: '97' },
        prescription: {
          medicines: [
            { name: 'Glycomet GP 1 Tablet', dosage: '1 tab before breakfast', duration: '30 days' },
            { name: 'Amlong 5 Tablet', dosage: '1 tab at night', duration: '30 days' },
          ],
          advice: 'Strictly avoid refined sugars. Repeat HbA1c in 3 months.',
        },
      },
    ],
  },
  {
    id: 'PAT-904',
    name: 'Priyanka Roy',
    phone: '+91 94321 00987',
    age: 27,
    gender: 'Female',
    bloodGroup: 'AB+',
    chronicConditions: 'Seasonal Allergic Rhinitis',
    allergies: 'Pollen',
    visits: 3,
    lastVisit: '17 Nov 2026',
    latestVitals: {
      bp: '120/80',
      pulse: '74',
      temp: '98.2',
      weight: '54',
      spO2: '99',
    },
    history: [
      {
        id: 'VST-204',
        date: '17 Nov 2026',
        doctorName: 'Dr. Priya Sharma',
        clinicName: 'Apollo Clinic, Salt Lake Kolkata',
        symptoms: 'Sneezing bouts in morning, watery nasal discharge',
        diagnosis: 'Allergic Rhinitis Flare',
        vitals: { bp: '120/80', pulse: '74', temp: '98.2', weight: '54', spO2: '99' },
        prescription: {
          medicines: [
            { name: 'Montair LC Tablet', dosage: '1 tab at bedtime', duration: '10 days' },
            { name: 'Otrivin Nasal Spray', dosage: '1 spray each nostril SOS', duration: '3 days' },
          ],
          advice: 'Avoid early morning dust exposure. Steam inhalation twice daily.',
        },
      },
    ],
  },
];

// Initial Doctor Associated Clinics
const DEFAULT_ASSOCIATED_CLINICS = [
  {
    id: 'cln-apollo',
    name: 'Apollo Clinic, Salt Lake Kolkata',
    address: 'Block DC, Sector 1, Salt Lake City, Kolkata 700064',
    city: 'Kolkata',
    phone: '+91 33 4012 3456',
    chamber: 'Room 204 (2nd Floor)',
    phoneExt: 'Ext 204',
    deskStaff: 'Ananya Roy (Front Desk Receptionist)',
    consultationFee: 600,
    status: 'PRIMARY_CHAMBER',
    schedule: [
      { day: 'Monday', morning: '09:30 AM – 01:30 PM', evening: '05:00 PM – 08:30 PM', isOff: false },
      { day: 'Tuesday', morning: '09:30 AM – 01:30 PM', evening: '05:00 PM – 08:30 PM', isOff: false },
      { day: 'Wednesday', morning: '09:30 AM – 01:30 PM', evening: 'Chamber Closed', isOff: false },
      { day: 'Thursday', morning: '09:30 AM – 01:30 PM', evening: '05:00 PM – 08:30 PM', isOff: false },
      { day: 'Friday', morning: '09:30 AM – 01:30 PM', evening: '05:00 PM – 08:30 PM', isOff: false },
      { day: 'Saturday', morning: '10:00 AM – 02:00 PM', evening: 'Chamber Closed', isOff: false },
      { day: 'Sunday', morning: 'Weekly Off', evening: 'Weekly Off', isOff: true },
    ],
  },
  {
    id: 'cln-bm-birla',
    name: 'BM Birla Heart Research Polyclinic',
    address: '1/1 National Library Avenue, Alipore, Kolkata 700027',
    city: 'Kolkata',
    phone: '+91 33 2456 7890',
    chamber: 'OPD Block C, Chamber 12',
    phoneExt: 'Ext 112',
    deskStaff: 'Central Hospital OPD Desk',
    consultationFee: 900,
    status: 'SECONDARY_CHAMBER',
    schedule: [
      { day: 'Monday', morning: 'Chamber Closed', evening: 'Chamber Closed', isOff: true },
      { day: 'Tuesday', morning: 'Chamber Closed', evening: 'Chamber Closed', isOff: true },
      { day: 'Wednesday', morning: '02:30 PM – 06:30 PM', evening: 'Chamber Closed', isOff: false },
      { day: 'Thursday', morning: 'Chamber Closed', evening: 'Chamber Closed', isOff: true },
      { day: 'Friday', morning: 'Chamber Closed', evening: 'Chamber Closed', isOff: true },
      { day: 'Saturday', morning: '03:00 PM – 07:00 PM', evening: 'Chamber Closed', isOff: false },
      { day: 'Sunday', morning: 'Weekly Off', evening: 'Weekly Off', isOff: true },
    ],
  },
];

export const doctorApi = {
  // ================= DUTY STATUS (Persisted & Synced Across All Profiles) =================
  getDutyStatus(doctorId = 'default') {
    try {
      const specific = localStorage.getItem(`${DOCTOR_STATUS_KEY_PREFIX}${doctorId}`);
      if (specific) return specific;
      const global = localStorage.getItem('oshud_current_doctor_status');
      if (global) return global;
    } catch {}
    return 'AVAILABLE';
  },

  updateDutyStatus(newStatus, doctorId = 'default', doctorName = '') {
    const statusUpper = String(newStatus).toUpperCase();
    try {
      localStorage.setItem(`${DOCTOR_STATUS_KEY_PREFIX}${doctorId}`, statusUpper);
      localStorage.setItem('oshud_current_doctor_status', statusUpper);

      // 1. Update status in local account registry so other users/admins see it
      accountRegistry.updateEntityData('doctors', doctorId, { status: statusUpper });

      // 2. Broadcast cross-tab and cross-component custom event
      window.dispatchEvent(
        new CustomEvent('oshud_doctor_status_changed', {
          detail: { doctorId, status: statusUpper, doctorName },
        })
      );
    } catch (e) {
      console.warn('Failed to persist doctor duty status:', e);
    }

    // 3. Optional real backend sync
    apiClient.put('/doctors/status', { status: statusUpper }).catch(() => {});

    return statusUpper;
  },

  // ================= EHR PATIENT RECORDS =================
  getPatientRecords() {
    try {
      const raw = localStorage.getItem(PATIENT_RECORDS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading patient records from storage:', e);
    }
    // Seed defaults if empty
    try {
      localStorage.setItem(PATIENT_RECORDS_KEY, JSON.stringify(INITIAL_PATIENT_RECORDS));
    } catch {}
    return INITIAL_PATIENT_RECORDS;
  },

  savePatientRecord(record) {
    const records = this.getPatientRecords();
    const cleanPhone = String(record.phone || record.patientPhone || '').replace(/[^0-9]/g, '');
    const cleanName = (record.name || record.patientName || 'Patient').trim();

    // Check if patient already exists by phone or ID
    const existingIndex = records.findIndex(
      (p) =>
        (p.id && (p.id === record.id || p.id === record.patientId)) ||
        (cleanPhone.length >= 10 && p.phone && p.phone.replace(/[^0-9]/g, '').slice(-10) === cleanPhone.slice(-10))
    );

    const nowFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newVisitEntry = {
      id: `VST-${Date.now()}`,
      date: nowFormatted,
      doctorName: record.doctorName || 'Dr. Priya Sharma',
      clinicName: record.clinicName || 'Apollo Clinic, Salt Lake Kolkata',
      symptoms: record.symptoms || record.chiefComplaint || 'General Checkup',
      diagnosis: record.diagnosis || 'Clinical Consultation',
      vitals: {
        bp: record.vitals?.bp || record.bp || '120/80',
        pulse: record.vitals?.pulse || record.pulse || '74',
        temp: record.vitals?.temp || record.temp || '98.4',
        weight: record.vitals?.weight || record.weight || '68',
        spO2: record.vitals?.spO2 || record.spO2 || '99',
      },
      prescription: {
        medicines: record.prescription?.medicines || record.medicines || [],
        advice: record.prescription?.advice || record.advice || 'Follow-up as needed.',
      },
    };

    let savedPatientObj = null;

    if (existingIndex >= 0) {
      const existing = records[existingIndex];
      savedPatientObj = {
        ...existing,
        name: cleanName || existing.name,
        age: Number(record.age) || existing.age,
        gender: record.gender || existing.gender,
        bloodGroup: record.bloodGroup || existing.bloodGroup || 'O+',
        chronicConditions: record.chronicConditions || existing.chronicConditions || 'None',
        allergies: record.allergies || existing.allergies || 'None Known',
        visits: (existing.visits || 0) + 1,
        lastVisit: nowFormatted,
        latestVitals: newVisitEntry.vitals,
        history: [newVisitEntry, ...(existing.history || [])],
      };
      records[existingIndex] = savedPatientObj;
    } else {
      const generatedId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
      savedPatientObj = {
        id: generatedId,
        name: cleanName,
        phone: record.phone || record.patientPhone || '',
        age: Number(record.age) || 30,
        gender: record.gender || 'Male',
        bloodGroup: record.bloodGroup || 'O+',
        chronicConditions: record.chronicConditions || 'None Reported',
        allergies: record.allergies || 'None Known',
        visits: 1,
        lastVisit: nowFormatted,
        latestVitals: newVisitEntry.vitals,
        history: [newVisitEntry],
      };
      records.unshift(savedPatientObj);
    }

    try {
      localStorage.setItem(PATIENT_RECORDS_KEY, JSON.stringify(records));
      window.dispatchEvent(
        new CustomEvent('oshud_patient_records_updated', { detail: savedPatientObj })
      );
    } catch (e) {
      console.warn('Failed to save patient EHR record:', e);
    }

    return savedPatientObj;
  },

  // ================= ASSOCIATED CLINICS & TIMETABLE SCHEDULE =================
  getAssociatedClinics(doctorId = 'default') {
    const key = `${DOCTOR_CLINICS_KEY_PREFIX}${doctorId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading associated clinics:', e);
    }

    // Default seeded associated clinics
    try {
      localStorage.setItem(key, JSON.stringify(DEFAULT_ASSOCIATED_CLINICS));
    } catch {}
    return DEFAULT_ASSOCIATED_CLINICS;
  },

  saveAssociatedClinics(doctorId = 'default', clinics) {
    const key = `${DOCTOR_CLINICS_KEY_PREFIX}${doctorId}`;
    try {
      localStorage.setItem(key, JSON.stringify(clinics));
      window.dispatchEvent(
        new CustomEvent('oshud_doctor_clinics_updated', { detail: clinics })
      );
    } catch (e) {
      console.warn('Failed to save associated clinics:', e);
    }
    return clinics;
  },

  addAssociatedClinic(doctorId = 'default', clinicData) {
    const current = this.getAssociatedClinics(doctorId);
    const newClinic = {
      id: clinicData.id || `cln-${Date.now()}`,
      name: clinicData.name,
      address: clinicData.address || clinicData.line1 || 'City Center, Kolkata',
      city: clinicData.city || 'Kolkata',
      phone: clinicData.phone || '+91 33 2200 1100',
      chamber: clinicData.chamber || 'Room 101',
      phoneExt: clinicData.phoneExt || 'Ext 101',
      deskStaff: clinicData.deskStaff || 'Reception Desk Coordinator',
      consultationFee: Number(clinicData.consultationFee || clinicData.fee) || 500,
      status: current.length === 0 ? 'PRIMARY_CHAMBER' : 'SECONDARY_CHAMBER',
      schedule: clinicData.schedule || [
        { day: 'Monday', morning: '09:30 AM – 01:30 PM', evening: '05:00 PM – 08:30 PM', isOff: false },
        { day: 'Tuesday', morning: '09:30 AM – 01:30 PM', evening: '05:00 PM – 08:30 PM', isOff: false },
        { day: 'Wednesday', morning: '09:30 AM – 01:30 PM', evening: '05:00 PM – 08:30 PM', isOff: false },
        { day: 'Thursday', morning: '09:30 AM – 01:30 PM', evening: '05:00 PM – 08:30 PM', isOff: false },
        { day: 'Friday', morning: '09:30 AM – 01:30 PM', evening: '05:00 PM – 08:30 PM', isOff: false },
        { day: 'Saturday', morning: '10:00 AM – 02:00 PM', evening: 'Chamber Closed', isOff: false },
        { day: 'Sunday', morning: 'Weekly Off', evening: 'Weekly Off', isOff: true },
      ],
    };

    const updated = [newClinic, ...current.filter((c) => c.id !== newClinic.id)];
    return this.saveAssociatedClinics(doctorId, updated);
  },

  updateClinicDetails(doctorId = 'default', clinicId, updateFields) {
    const current = this.getAssociatedClinics(doctorId);
    const updated = current.map((c) => {
      if (c.id === clinicId) {
        return {
          ...c,
          ...updateFields,
          schedule: updateFields.schedule || c.schedule,
        };
      }
      return c;
    });
    return this.saveAssociatedClinics(doctorId, updated);
  },

  removeAssociatedClinic(doctorId = 'default', clinicId) {
    const current = this.getAssociatedClinics(doctorId);
    const updated = current.filter((c) => c.id !== clinicId);
    return this.saveAssociatedClinics(doctorId, updated);
  },

  // ================= REAL BACKEND SPECIALIZATIONS & PHARMACIES =================
  async getDoctorsByPharmacy(pharmacyId) {
    if (!pharmacyId) return [];
    try {
      const response = await apiClient.get(`/doctors/pharmacy/${pharmacyId}`);
      return response.data?.data || response.data || [];
    } catch {
      return [];
    }
  },

  async onboardDoctor(doctorData) {
    const response = await apiClient.post('/doctors/onboard', doctorData);
    return response.data?.data || response.data;
  },

  async getSpecializations() {
    try {
      const response = await apiClient.get('/specializations');
      return response.data?.data || response.data || [];
    } catch {
      return [];
    }
  },

  async createSpecialization(specData) {
    const response = await apiClient.post('/specializations', specData);
    return response.data?.data || response.data;
  },
};

export default doctorApi;
