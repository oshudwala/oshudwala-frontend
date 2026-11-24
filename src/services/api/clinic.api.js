import apiClient from './client';
import { adminApi } from './admin.api';
import { doctorApi } from './doctor.api';
import accountRegistry from './accountRegistry';

const CLINIC_DOCTORS_KEY_PREFIX = 'oshud_clinic_doctors_';
const CLINIC_APPOINTMENTS_KEY_PREFIX = 'oshud_clinic_appointments_';

// Default initial clinic doctors
const INITIAL_CLINIC_DOCTORS = [
  {
    id: 'doc-01',
    doctorId: 'doc-01',
    userId: 'usr-doc-01',
    name: 'Dr. Priya Sharma',
    fullName: 'Dr. Priya Sharma',
    specialty: 'General Medicine & Diabetology',
    specialization: 'General Medicine & Diabetology',
    qualifications: 'MBBS, MD (Medicine)',
    registrationNumber: 'WBMC-78219',
    room: 'Room 204 (2nd Floor)',
    chamber: 'Room 204',
    shift: '09:30 AM – 01:30 PM',
    phone: '+91 98301 22334',
    email: 'dr.priya@oshudwala.com',
    phoneExt: 'Ext 204',
    fee: 500,
    status: 'CONSULTING',
  },
  {
    id: 'doc-02',
    doctorId: 'doc-02',
    userId: 'usr-doc-02',
    name: 'Dr. Rohit Mehta',
    fullName: 'Dr. Rohit Mehta',
    specialty: 'Cardiology',
    specialization: 'Cardiology',
    qualifications: 'MBBS, MD, DM (Cardio)',
    registrationNumber: 'WBMC-65104',
    room: 'Room 206 (2nd Floor)',
    chamber: 'Room 206',
    shift: '10:00 AM – 02:00 PM',
    phone: '+91 98302 44556',
    email: 'dr.rohit@oshudwala.com',
    phoneExt: 'Ext 206',
    fee: 700,
    status: 'CONSULTING',
  },
  {
    id: 'doc-03',
    doctorId: 'doc-03',
    userId: 'usr-doc-03',
    name: 'Dr. Sneha Das',
    fullName: 'Dr. Sneha Das',
    specialty: 'Dermatology & Cosmetology',
    specialization: 'Dermatology & Cosmetology',
    qualifications: 'MBBS, MD (DVL)',
    registrationNumber: 'WBMC-90312',
    room: 'Room 208 (2nd Floor)',
    chamber: 'Room 208',
    shift: '10:30 AM – 01:30 PM',
    phone: '+91 98303 66778',
    email: 'dr.sneha@oshudwala.com',
    phoneExt: 'Ext 208',
    fee: 600,
    status: 'ON_BREAK',
  },
  {
    id: 'doc-04',
    doctorId: 'doc-04',
    userId: 'usr-doc-04',
    name: 'Dr. Amit Verma',
    fullName: 'Dr. Amit Verma',
    specialty: 'Pediatrics & Child Care',
    specialization: 'Pediatrics & Child Care',
    qualifications: 'MBBS, DCH, MD (Ped)',
    registrationNumber: 'WBMC-54201',
    room: 'Room 210 (2nd Floor)',
    chamber: 'Room 210',
    shift: '11:00 AM – 03:00 PM',
    phone: '+91 98304 88990',
    email: 'dr.amit@oshudwala.com',
    phoneExt: 'Ext 210',
    fee: 550,
    status: 'AVAILABLE',
  },
];

// Initial appointments template (No demo data)
const INITIAL_APPOINTMENTS = [];

// In-memory instant caches
let memoryProfileCache = null;
const memoryDoctorsCache = new Map();
const memoryAppointmentsCache = new Map();

export const clinicApi = {
  /**
   * Resolve active clinic info for current receptionist user (Instant <5ms)
   */
  async getClinicProfile(currentUser = null) {
    if (memoryProfileCache) return memoryProfileCache;

    let clinicName = 'Apollo Clinic & Polyclinic';
    let city = 'Kolkata';
    let address = 'Sector 1, Salt Lake City, Kolkata 700064';
    let chamberCount = '6 Chambers';
    let coordinatorName = currentUser?.fullName || currentUser?.name || 'Reception Lead';
    let phone = currentUser?.phone || '+91 33 2358 1000';
    let email = currentUser?.email || 'reception.saltlake@apolloclinic.com';

    // 1. Instant local registry lookup (0ms)
    try {
      const localClinics = accountRegistry.getEntities().clinics || [];
      if (localClinics.length > 0) {
        const matched = currentUser
          ? localClinics.find(
              (c) =>
                c.id === currentUser.id ||
                c.userId === currentUser.id ||
                (c.email && currentUser.email && c.email.toLowerCase() === currentUser.email.toLowerCase()) ||
                (c.phone && currentUser.phone && c.phone === currentUser.phone)
            ) || localClinics[0]
          : localClinics[0];

        if (matched) {
          clinicName = matched.name || clinicName;
          city = matched.city || city;
          address = matched.line1 ? `${matched.line1}, ${matched.city || 'Kolkata'}` : address;
          chamberCount = matched.chamberCount || matched.settings?.chamberCount || chamberCount;
          phone = matched.phone || phone;
          email = matched.email || email;
        }
      } else if (currentUser && currentUser.fullName) {
        clinicName = `${currentUser.fullName} Clinic & Polyclinic`;
      }
    } catch (e) {
      console.warn('Local clinic profile read notice:', e.message);
    }

    const resolved = {
      id: currentUser?.id || 'clinic-primary-01',
      name: clinicName,
      address,
      city,
      chamberCount,
      coordinatorName,
      phone,
      email,
    };

    memoryProfileCache = resolved;
    return resolved;
  },

  /**
   * Get all doctors affiliated with this clinic (Instant cache-first <10ms)
   */
  async getClinicDoctors(clinicId = 'default') {
    const storageKey = `${CLINIC_DOCTORS_KEY_PREFIX}${clinicId}`;

    if (memoryDoctorsCache.has(storageKey)) {
      return memoryDoctorsCache.get(storageKey);
    }

    let clinicDoctors = [];

    // 1. Read existing clinic roster from localStorage (0ms)
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          clinicDoctors = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse clinic doctors storage:', e);
    }

    // 2. If empty, initialize with default initial doctors
    if (clinicDoctors.length === 0) {
      clinicDoctors = [...INITIAL_CLINIC_DOCTORS];
    }

    // 3. Merge real platform doctors from accountRegistry instantly (0ms)
    try {
      const localEntities = accountRegistry.getEntities();
      const localDoctors = localEntities.doctors || [];

      localDoctors.forEach((bd) => {
        const exists = clinicDoctors.some(
          (cd) =>
            cd.id === bd.id ||
            cd.doctorId === bd.id ||
            cd.userId === bd.userId ||
            (bd.email && cd.email && cd.email.toLowerCase() === bd.email.toLowerCase()) ||
            (bd.phone && cd.phone && cd.phone === bd.phone)
        );

        if (!exists && !accountRegistry.isEntityRemoved(bd.id) && !accountRegistry.isEntityRemoved(bd.userId)) {
          clinicDoctors.push({
            id: bd.id,
            doctorId: bd.id,
            userId: bd.userId || bd.id,
            name: bd.fullName || bd.name,
            fullName: bd.fullName || bd.name,
            specialty: bd.specialization || 'General Medicine',
            specialization: bd.specialization || 'General Medicine',
            qualifications: bd.qualifications || 'MBBS',
            registrationNumber: bd.registrationNumber || 'WBMC-REG',
            room: `Room ${210 + (clinicDoctors.length % 5) * 2} (2nd Floor)`,
            chamber: `Room ${210 + (clinicDoctors.length % 5) * 2}`,
            shift: '10:00 AM – 02:00 PM',
            phone: bd.phone || '',
            email: bd.email || '',
            phoneExt: `Ext ${210 + (clinicDoctors.length % 5) * 2}`,
            fee: bd.consultationFeePaise ? Math.round(bd.consultationFeePaise / 100) : 500,
            status: 'AVAILABLE',
          });
        }
      });
    } catch (err) {
      console.warn('Merge local registry doctors notice:', err.message);
    }

    // 4. Filter out any doctors marked as removed
    clinicDoctors = clinicDoctors.filter(
      (d) =>
        !accountRegistry.isEntityRemoved(d.id) &&
        !accountRegistry.isEntityRemoved(d.doctorId) &&
        !accountRegistry.isEntityRemoved(d.userId)
    );

    // Save and cache in memory
    try {
      localStorage.setItem(storageKey, JSON.stringify(clinicDoctors));
    } catch {}

    memoryDoctorsCache.set(storageKey, clinicDoctors);
    return clinicDoctors;
  },

  /**
   * Get platform doctors available to link, excluding doctors already in this clinic (Instant)
   */
  async getAvailablePlatformDoctors(clinicId = 'default') {
    const currentClinicDoctors = await this.getClinicDoctors(clinicId);

    // Read from local registry
    let allPlatformDoctors = [];
    try {
      const regEntities = accountRegistry.getEntities();
      allPlatformDoctors = regEntities.doctors || [];
    } catch {}

    // Filter out removed doctors and already assigned doctors
    const available = allPlatformDoctors.filter((pd) => {
      if (accountRegistry.isEntityRemoved(pd.id) || accountRegistry.isEntityRemoved(pd.userId)) {
        return false;
      }
      const alreadyAssigned = currentClinicDoctors.some(
        (cd) =>
          cd.id === pd.id ||
          cd.doctorId === pd.id ||
          cd.userId === pd.userId ||
          (pd.email && cd.email && cd.email.toLowerCase() === pd.email.toLowerCase()) ||
          (pd.phone && cd.phone && cd.phone === pd.phone)
      );
      return !alreadyAssigned;
    });

    return available;
  },

  /**
   * Add / Link a doctor to this clinic with strict duplicate validation
   */
  async addDoctorToClinic(clinicId = 'default', doctorData) {
    const storageKey = `${CLINIC_DOCTORS_KEY_PREFIX}${clinicId}`;
    const currentDoctors = await this.getClinicDoctors(clinicId);

    let newDoctorObj = null;

    if (doctorData.isExisting && doctorData.existingDoctor) {
      const existing = doctorData.existingDoctor;
      const targetId = existing.id;
      const targetPhone = existing.phone;
      const targetEmail = existing.email ? existing.email.toLowerCase() : null;

      // Duplicate check: verify doctor is not already in clinic
      const isDuplicate = currentDoctors.some(
        (d) =>
          d.id === targetId ||
          d.doctorId === targetId ||
          d.userId === targetId ||
          (targetPhone && d.phone && d.phone === targetPhone) ||
          (targetEmail && d.email && d.email.toLowerCase() === targetEmail)
      );

      if (isDuplicate) {
        throw new Error(
          `Dr. ${existing.fullName || existing.name} is already assigned to this clinic roster.`
        );
      }

      newDoctorObj = {
        id: existing.id,
        doctorId: existing.id,
        userId: existing.userId || existing.id,
        name: existing.fullName || existing.name,
        fullName: existing.fullName || existing.name,
        specialty: existing.specialization || existing.specialty || 'General Medicine',
        specialization: existing.specialization || existing.specialty || 'General Medicine',
        qualifications: existing.qualifications || 'MBBS',
        registrationNumber: existing.registrationNumber || 'WBMC-REG',
        room: doctorData.room || 'Room 212 (2nd Floor)',
        chamber: doctorData.room ? doctorData.room.split(' ')[0] + ' ' + (doctorData.room.split(' ')[1] || '') : 'Room 212',
        shift: doctorData.shift || '09:30 AM – 01:30 PM',
        phone: existing.phone || '',
        email: existing.email || '',
        phoneExt: doctorData.phoneExt || 'Ext 212',
        fee: Number(doctorData.fee) || 500,
        status: 'AVAILABLE',
      };

      // Always register in accountRegistry with DOCTOR role
      accountRegistry.registerAccount({
        id: newDoctorObj.id,
        fullName: newDoctorObj.fullName,
        email: newDoctorObj.email,
        phone: newDoctorObj.phone,
        password: doctorData.password || 'Doctor123',
        role: 'DOCTOR',
        entityData: {
          room: newDoctorObj.room,
          chamber: newDoctorObj.chamber,
          shift: newDoctorObj.shift,
          fee: newDoctorObj.fee,
          registrationNumber: newDoctorObj.registrationNumber,
          qualifications: newDoctorObj.qualifications,
          specialization: newDoctorObj.specialization,
        },
      });
    } else {
      // Mode B: Onboarding a new doctor
      const cleanPhone = String(doctorData.phone || '').replace(/[^0-9]/g, '');
      const validEmail = doctorData.email && doctorData.email.includes('@')
        ? doctorData.email.trim().toLowerCase()
        : `dr.${cleanPhone || Date.now()}@oshudwala.local`;

      // Duplicate check: verify doctor phone or email is not already in clinic
      const isDuplicate = currentDoctors.some(
        (d) =>
          (cleanPhone && d.phone && d.phone.replace(/[^0-9]/g, '') === cleanPhone) ||
          (validEmail && d.email && d.email.toLowerCase() === validEmail)
      );

      if (isDuplicate) {
        throw new Error(
          `A doctor with phone ${doctorData.phone} or email ${doctorData.email} is already in this clinic roster.`
        );
      }

      // Register doctor in database
      let dbDoctor = null;
      try {
        dbDoctor = await adminApi.createDoctor({
          fullName: doctorData.fullName || doctorData.name,
          email: validEmail,
          phone: doctorData.phone,
          password: doctorData.password || 'Doctor123',
          specialization: doctorData.specialization || doctorData.specialty || 'General Medicine',
          qualifications: doctorData.qualifications || 'MBBS',
          registrationNumber: doctorData.registrationNumber || 'WBMC-REG',
          consultationFeePaise: (Number(doctorData.fee) || 500) * 100,
          experienceYears: Number(doctorData.experienceYears) || 5,
        });
      } catch (err) {
        console.warn('Backend doctor registration notice:', err.message);
      }

      const generatedId = dbDoctor?.id || `doc-${Date.now()}`;
      newDoctorObj = {
        id: generatedId,
        doctorId: generatedId,
        userId: dbDoctor?.userId || generatedId,
        name: doctorData.fullName || doctorData.name,
        fullName: doctorData.fullName || doctorData.name,
        specialty: doctorData.specialization || doctorData.specialty || 'General Medicine',
        specialization: doctorData.specialization || doctorData.specialty || 'General Medicine',
        qualifications: doctorData.qualifications || 'MBBS',
        registrationNumber: doctorData.registrationNumber || 'WBMC-REG',
        room: doctorData.room || 'Room 214 (2nd Floor)',
        chamber: doctorData.room || 'Room 214',
        shift: doctorData.shift || '09:30 AM – 01:30 PM',
        phone: doctorData.phone || '',
        email: validEmail,
        phoneExt: doctorData.phoneExt || 'Ext 214',
        fee: Number(doctorData.fee) || 500,
        status: 'AVAILABLE',
      };

      // Always register in accountRegistry with DOCTOR role
      accountRegistry.registerAccount({
        id: generatedId,
        fullName: newDoctorObj.fullName,
        email: newDoctorObj.email,
        phone: newDoctorObj.phone,
        password: doctorData.password || 'Doctor123',
        role: 'DOCTOR',
        entityData: {
          room: newDoctorObj.room,
          chamber: newDoctorObj.chamber,
          shift: newDoctorObj.shift,
          fee: newDoctorObj.fee,
          registrationNumber: newDoctorObj.registrationNumber,
          qualifications: newDoctorObj.qualifications,
          specialization: newDoctorObj.specialization,
          experienceYears: Number(doctorData.experienceYears) || 5,
        },
      });
    }

    // Add to clinic roster, update cache and dispatch event
    const updatedDoctors = [...currentDoctors.filter((d) => d.id !== newDoctorObj.id), newDoctorObj];
    memoryDoctorsCache.set(storageKey, updatedDoctors);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedDoctors));
      window.dispatchEvent(new CustomEvent('oshud_clinic_doctors_updated', { detail: updatedDoctors }));
    } catch (e) {
      console.warn('Failed to save updated clinic doctors:', e);
    }

    return newDoctorObj;
  },

  /**
   * Remove a doctor from this clinic roster
   */
  async removeDoctorFromClinic(clinicId = 'default', doctorId) {
    const storageKey = `${CLINIC_DOCTORS_KEY_PREFIX}${clinicId}`;
    const currentDoctors = await this.getClinicDoctors(clinicId);

    const updatedDoctors = currentDoctors.filter((d) => d.id !== doctorId && d.doctorId !== doctorId);
    memoryDoctorsCache.set(storageKey, updatedDoctors);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedDoctors));
      window.dispatchEvent(new CustomEvent('oshud_clinic_doctors_updated', { detail: updatedDoctors }));
    } catch (e) {
      console.warn('Failed to update clinic roster on doctor removal:', e);
    }

    return updatedDoctors;
  },

  /**
   * Update an existing doctor's details in clinic roster and synchronize globally
   */
  async updateClinicDoctor(clinicId = 'default', doctorId, updates) {
    const storageKey = `${CLINIC_DOCTORS_KEY_PREFIX}${clinicId}`;
    const currentDoctors = await this.getClinicDoctors(clinicId);

    const index = currentDoctors.findIndex((d) => d.id === doctorId || d.doctorId === doctorId);
    if (index >= 0) {
      currentDoctors[index] = {
        ...currentDoctors[index],
        ...updates,
        name: updates.fullName || updates.name || currentDoctors[index].name,
        fullName: updates.fullName || updates.name || currentDoctors[index].fullName,
        specialty: updates.specialization || updates.specialty || currentDoctors[index].specialty,
        specialization: updates.specialization || updates.specialty || currentDoctors[index].specialization,
        room: updates.room || currentDoctors[index].room,
        chamber: updates.room || currentDoctors[index].chamber,
        shift: updates.shift || currentDoctors[index].shift,
        fee: updates.fee !== undefined ? Number(updates.fee) : currentDoctors[index].fee,
        imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : currentDoctors[index].imageUrl,
      };

      memoryDoctorsCache.set(storageKey, currentDoctors);
      try {
        localStorage.setItem(storageKey, JSON.stringify(currentDoctors));
        window.dispatchEvent(new CustomEvent('oshud_clinic_doctors_updated', { detail: currentDoctors }));
      } catch (e) {
        console.warn('Failed to save updated clinic doctor:', e);
      }

      // Also sync to global accountRegistry
      try {
        accountRegistry.updateAccount(doctorId, {
          fullName: currentDoctors[index].fullName,
          phone: updates.phone,
          email: updates.email,
          imageUrl: updates.imageUrl,
          entityData: {
            specialization: currentDoctors[index].specialization,
            qualifications: updates.qualifications,
            registrationNumber: updates.registrationNumber,
            experienceYears: updates.experienceYears,
            consultationFeePaise: (Number(updates.fee) || 500) * 100,
            room: currentDoctors[index].room,
            shift: currentDoctors[index].shift,
          },
        });
      } catch {}

      // Attempt backend doctor update
      try {
        await adminApi.updateDoctor(doctorId, {
          fullName: currentDoctors[index].fullName,
          email: updates.email,
          phone: updates.phone ? String(updates.phone).replace(/[^0-9]/g, '') : undefined,
          imageUrl: updates.imageUrl,
          specialization: currentDoctors[index].specialization,
          qualifications: updates.qualifications,
          registrationNumber: updates.registrationNumber,
          experienceYears: Number(updates.experienceYears) || 0,
          consultationFeePaise: (Number(updates.fee) || 500) * 100,
        });
      } catch {}

      return currentDoctors[index];
    }
    return null;
  },

  /**
   * Get clinic appointments (Instant cache-first <5ms)
   */
  async getClinicAppointments(clinicId = 'default') {
    const storageKey = `${CLINIC_APPOINTMENTS_KEY_PREFIX}${clinicId}`;
    if (memoryAppointmentsCache.has(storageKey)) {
      return memoryAppointmentsCache.get(storageKey);
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter((a) => !String(a.id || '').startsWith('APT-100'));
          memoryAppointmentsCache.set(storageKey, clean);
          return clean;
        }
      }
    } catch (e) {
      console.warn('Error reading clinic appointments:', e);
    }

    memoryAppointmentsCache.set(storageKey, []);
    return [];
  },

  /**
   * Book a new clinic appointment
   */
  async createAppointment(clinicId = 'default', appointmentData) {
    const storageKey = `${CLINIC_APPOINTMENTS_KEY_PREFIX}${clinicId}`;
    const currentList = await this.getClinicAppointments(clinicId);

    const newId = `APT-${1000 + currentList.length + 1}`;
    const newApt = {
      id: newId,
      patientName: appointmentData.patientName.trim(),
      phone: appointmentData.phone.trim(),
      age: Number(appointmentData.age) || 30,
      gender: appointmentData.gender || 'Other',
      doctorId: appointmentData.doctorId,
      doctor: appointmentData.doctor || `${appointmentData.doctorName} (${appointmentData.room})`,
      doctorName: appointmentData.doctorName,
      room: appointmentData.room || 'Room 204',
      slot: appointmentData.slot || '10:00 AM',
      date: appointmentData.date || 'Today',
      symptoms: appointmentData.symptoms || 'Scheduled OPD Consultation',
      checkedIn: false,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString(),
    };

    const updated = [newApt, ...currentList];
    memoryAppointmentsCache.set(storageKey, updated);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('oshud_clinic_appointments_updated', { detail: updated }));
    } catch (e) {
      console.warn('Failed to save new clinic appointment:', e);
    }

    return newApt;
  },

  /**
   * Mark appointment as checked in
   */
  async checkInAppointment(clinicId = 'default', appointmentId) {
    const storageKey = `${CLINIC_APPOINTMENTS_KEY_PREFIX}${clinicId}`;
    const currentList = await this.getClinicAppointments(clinicId);

    const updated = currentList.map((a) =>
      a.id === appointmentId ? { ...a, checkedIn: true, status: 'CHECKED_IN' } : a
    );

    memoryAppointmentsCache.set(storageKey, updated);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('oshud_clinic_appointments_updated', { detail: updated }));
    } catch (e) {
      console.warn('Failed to update appointment checkin:', e);
    }

    return updated;
  },
};

export default clinicApi;
