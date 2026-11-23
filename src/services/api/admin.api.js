import axios from 'axios';
import apiClient, { API_BASE_URL } from './client';
import accountRegistry from './accountRegistry';

/**
 * Helper to register a user account directly in PostgreSQL via the public /auth/register API,
 * and then update their role to roleName (DOCTOR, RIDER, PHARMACY, RECEPTIONIST)
 * using the active Super Admin token via /admin/users/:id/access.
 * 
 * Note: We use direct axios.post(`${API_BASE_URL}/auth/register`) so the logged-in
 * Super Admin's session token is NEVER overwritten.
 */
async function registerUserInDatabase({ fullName, phone, email, password, roleName }) {
  const cleanPhone = String(phone).replace(/[^0-9]/g, '');
  const cleanEmail = email && email.includes('@') ? email.trim().toLowerCase() : `${roleName.toLowerCase()}.${cleanPhone}@oshudwala.local`;
  const cleanPassword = password || 'Password123';
  const cleanName = fullName ? fullName.trim() : 'User';

  let userId = null;

  // 1. First, check if a user with this phone or email already exists in PostgreSQL
  try {
    const listRes = await apiClient.get('/admin/users', { params: { limit: 100 } });
    const users = listRes.data?.data?.users || listRes.data?.data || listRes.data?.users || listRes.data || [];
    if (Array.isArray(users)) {
      const existing = users.find(
        (u) =>
          (u.phone && String(u.phone).replace(/[^0-9]/g, '') === cleanPhone) ||
          (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
      );
      if (existing) {
        userId = existing.id;
      }
    }
  } catch (err) {
    console.warn('Backend list users pre-check notice:', err.message);
  }

  // 2. If user doesn't already exist, register them via POST /api/v1/auth/register
  if (!userId) {
    try {
      const regResponse = await axios.post(
        `${API_BASE_URL}/auth/register`,
        {
          fullName: cleanName,
          phone: cleanPhone,
          ...(cleanEmail ? { email: cleanEmail } : {}),
          password: cleanPassword,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const regData = regResponse.data?.data || regResponse.data;
      userId = regData?.user?.id;
    } catch (regError) {
      console.warn('Register endpoint notice:', regError.response?.data || regError.message);
      // If 400 or 409 (e.g. user with this phone or email already exists), locate their ID
      if (regError.response?.status === 400 || regError.response?.status === 409) {
        try {
          const listRes = await apiClient.get('/admin/users', { params: { limit: 100 } });
          const users = listRes.data?.data?.users || listRes.data?.data || listRes.data?.users || listRes.data || [];
          if (Array.isArray(users)) {
            const existing = users.find(
              (u) =>
                (u.phone && String(u.phone).replace(/[^0-9]/g, '') === cleanPhone) ||
                (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
            );
            if (existing) {
              userId = existing.id;
            }
          }
        } catch {}
      } else {
        const errorMsg =
          regError.response?.data?.message ||
          (Array.isArray(regError.response?.data?.errors) && regError.response.data.errors[0]?.message) ||
          regError.message ||
          'Failed to register account in database.';
        throw new Error(errorMsg);
      }
    }
  }

  if (!userId) {
    throw new Error('Could not create or locate user profile in database.');
  }

  // 3. Promote role to roleName (DOCTOR, RIDER, PHARMACY, RECEPTIONIST) using Super Admin's token
  try {
    await apiClient.put(`/admin/users/${userId}/access`, {
      roleName: roleName,
      status: 'ACTIVE',
    });
  } catch (roleError) {
    console.warn(`Failed to assign role ${roleName}:`, roleError.response?.data || roleError.message);
  }

  return { userId, fullName: cleanName, phone: cleanPhone, email: cleanEmail };
}

// In-memory cache for ultra-fast instant rendering
let cachedEntities = null;
let lastEntitiesFetch = 0;
const ENTITIES_CACHE_TTL = 15000; // 15 seconds

export const adminApi = {
  // Invalidate in-memory cache on mutations
  invalidateCache() {
    cachedEntities = null;
    lastEntitiesFetch = 0;
  },

  // Consolidated fast parallel fetcher for ALL network entities
  async fetchAllEntities(forceRefresh = false) {
    if (!forceRefresh && cachedEntities && Date.now() - lastEntitiesFetch < ENTITIES_CACHE_TTL) {
      return cachedEntities;
    }

    const local = accountRegistry.getEntities();
    let backendUsers = [];
    let backendDoctors = [];
    let backendPharmacies = [];
    let backendRiders = [];
    let backendSettings = [];

    // Parallel fetch real backend endpoints only (No failing 404 routes!)
    try {
      const [usersRes, docsRes, pharmsRes, ridersRes, settingsRes] = await Promise.allSettled([
        apiClient.get('/admin/users', { params: { limit: 100 } }),
        apiClient.get('/doctors'),
        apiClient.get('/pharmacies'),
        apiClient.get('/riders'),
        apiClient.get('/admin/settings'),
      ]);

      if (usersRes.status === 'fulfilled') {
        const d = usersRes.value.data?.data || usersRes.value.data;
        backendUsers = Array.isArray(d?.users) ? d.users : Array.isArray(d) ? d : [];
      }
      if (docsRes.status === 'fulfilled') {
        const d = docsRes.value.data?.data || docsRes.value.data;
        backendDoctors = Array.isArray(d?.doctors) ? d.doctors : Array.isArray(d) ? d : [];
      }
      if (pharmsRes.status === 'fulfilled') {
        const d = pharmsRes.value.data?.data || pharmsRes.value.data;
        backendPharmacies = Array.isArray(d?.pharmacies) ? d.pharmacies : Array.isArray(d) ? d : [];
      }
      if (ridersRes.status === 'fulfilled') {
        const d = ridersRes.value.data?.data || ridersRes.value.data;
        backendRiders = Array.isArray(d?.riders) ? d.riders : Array.isArray(d) ? d : [];
      }
      if (settingsRes.status === 'fulfilled') {
        backendSettings = settingsRes.value.data?.data || settingsRes.value.data || [];
      }
    } catch (e) {
      console.warn('Backend fetch all entities notice:', e.message);
    }

    // 1. DOCTORS
    const doctors = [...local.doctors];
    backendDoctors.forEach((bd) => {
      if (!accountRegistry.isEntityRemoved(bd.id) && !doctors.some((d) => d.id === bd.id || d.userId === bd.userId || (bd.email && d.email === bd.email))) {
        doctors.push({
          id: bd.id,
          userId: bd.userId || bd.id,
          fullName: bd.fullName || bd.name,
          email: bd.email,
          phone: bd.phone,
          imageUrl: bd.imageUrl || bd.photoUrl || '',
          registrationNumber: bd.registrationNumber || 'WBMC-REG',
          qualifications: bd.qualifications || 'MBBS',
          experienceYears: bd.experienceYears || 5,
          specialization: bd.specialization || bd.specializations?.[0]?.specialization?.name || 'General Physician',
          consultationFeePaise: bd.consultationFeePaise || 50000,
          status: bd.status || 'ACTIVE',
          user: { id: bd.userId || bd.id, email: bd.email, phone: bd.phone, status: bd.status || 'ACTIVE' },
        });
      }
    });
    backendUsers.filter((u) => u.role?.name === 'DOCTOR' || u.role === 'DOCTOR').forEach((u) => {
      if (!accountRegistry.isEntityRemoved(u.id) && !doctors.some((d) => d.id === u.id || d.userId === u.id || (u.email && d.email === u.email))) {
        doctors.push({
          id: u.id,
          userId: u.id,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          imageUrl: u.imageUrl || '',
          registrationNumber: 'WBMC-REG',
          qualifications: 'MBBS',
          experienceYears: 5,
          specialization: 'General Physician',
          consultationFeePaise: 50000,
          status: u.status || 'ACTIVE',
          user: { id: u.id, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' },
        });
      }
    });

    // 2. PHARMACIES
    const pharmacies = [...local.pharmacies];
    backendPharmacies.forEach((bp) => {
      if (!accountRegistry.isEntityRemoved(bp.id) && !pharmacies.some((p) => p.id === bp.id || (bp.email && p.email === bp.email))) {
        pharmacies.push({
          id: bp.id,
          userId: bp.ownerId || bp.id,
          name: bp.name,
          email: bp.email,
          phone: bp.phone,
          imageUrl: bp.imageUrl || '',
          licenseNumber: bp.licenseNumber || 'WB-DL-REG',
          line1: bp.line1 || 'Sector V',
          city: bp.city || 'Kolkata',
          state: bp.state || 'West Bengal',
          pincode: bp.pincode || '700091',
          status: bp.status || 'ACTIVE',
          owner: { id: bp.id, fullName: bp.ownerName || bp.name, email: bp.email, phone: bp.phone },
          staff: [{ staffRole: 'OWNER', user: { fullName: bp.ownerName || bp.name, email: bp.email, phone: bp.phone, status: bp.status || 'ACTIVE' } }],
        });
      }
    });
    backendUsers.filter((u) => u.role?.name === 'PHARMACY' || u.role === 'PHARMACY').forEach((u) => {
      if (!accountRegistry.isEntityRemoved(u.id) && !pharmacies.some((p) => p.id === u.id || (u.email && p.email === u.email))) {
        pharmacies.push({
          id: u.id,
          userId: u.id,
          name: `${u.fullName} Pharmacy`,
          email: u.email,
          phone: u.phone,
          imageUrl: '',
          licenseNumber: 'WB-DL-REG',
          line1: 'Sector V',
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700091',
          status: u.status || 'ACTIVE',
          owner: { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone },
          staff: [{ staffRole: 'OWNER', user: { fullName: u.fullName, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' } }],
        });
      }
    });

    // 3. CLINICS
    const clinics = [...local.clinics];
    backendUsers.filter((u) => u.role?.name === 'RECEPTIONIST' || u.role === 'RECEPTIONIST').forEach((u) => {
      if (!accountRegistry.isEntityRemoved(u.id) && !clinics.some((c) => c.id === u.id || (u.email && c.email === u.email))) {
        clinics.push({
          id: u.id,
          userId: u.id,
          name: `${u.fullName} Polyclinic`,
          email: u.email,
          phone: u.phone,
          imageUrl: '',
          chamberCount: '6 Chambers',
          line1: 'Salt Lake Sector 1',
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700064',
          status: u.status || 'ACTIVE',
          manager: { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone },
          staff: [{ staffRole: 'RECEPTIONIST', user: { fullName: u.fullName, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' } }],
          settings: { chamberCount: '6 Chambers' },
        });
      }
    });

    // 4. RIDERS
    const riders = [...local.riders];
    backendRiders.forEach((br) => {
      if (!accountRegistry.isEntityRemoved(br.id) && !riders.some((r) => r.id === br.id || r.userId === br.userId || (br.phone && r.phone === br.phone))) {
        riders.push({
          id: br.id,
          userId: br.userId || br.id,
          fullName: br.user?.fullName || br.fullName || 'Rider',
          email: br.user?.email || br.email,
          phone: br.user?.phone || br.phone,
          imageUrl: br.imageUrl || '',
          vehicleType: br.vehicleType || 'Motorcycle',
          vehicleNumber: br.vehicleNumber || 'WB-01-AB-1234',
          licenseNumber: br.licenseNumber || 'DL-WB-Verified',
          user: { id: br.userId || br.id, fullName: br.fullName, email: br.email, phone: br.phone, status: br.status || 'ACTIVE' },
          status: br.status || 'AVAILABLE',
        });
      }
    });
    backendUsers.filter((u) => u.role?.name === 'RIDER' || u.role === 'RIDER').forEach((u) => {
      if (!accountRegistry.isEntityRemoved(u.id) && !riders.some((r) => r.id === u.id || r.userId === u.id || (u.phone && r.phone === u.phone))) {
        riders.push({
          id: u.id,
          userId: u.id,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          imageUrl: '',
          vehicleType: 'Motorcycle',
          vehicleNumber: 'WB-01-AB-1234',
          licenseNumber: 'DL-WB-Verified',
          user: { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' },
          status: u.status || 'AVAILABLE',
        });
      }
    });

    // 5. PATIENTS / USERS
    const users = [...local.users];
    backendUsers.filter((u) => !u.role?.name || u.role?.name === 'PATIENT' || u.role === 'PATIENT').forEach((u) => {
      if (!accountRegistry.isEntityRemoved(u.id) && !users.some((eu) => eu.id === u.id || (u.phone && eu.phone === u.phone))) {
        users.push({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          imageUrl: '',
          createdAt: u.createdAt,
          role: { name: 'PATIENT' },
          status: u.status || 'ACTIVE',
        });
      }
    });

    const result = {
      clinics: clinics.filter((c) => !accountRegistry.isEntityRemoved(c.id)),
      doctors: doctors.filter((d) => !accountRegistry.isEntityRemoved(d.id)),
      pharmacies: pharmacies.filter((p) => !accountRegistry.isEntityRemoved(p.id)),
      riders: riders.filter((r) => !accountRegistry.isEntityRemoved(r.id)),
      users: users.filter((u) => !accountRegistry.isEntityRemoved(u.id)),
      settings: backendSettings,
    };

    cachedEntities = result;
    lastEntitiesFetch = Date.now();
    return result;
  },

  // Ultra-fast cached accessors
  async getClinics() {
    const all = await this.fetchAllEntities();
    return { clinics: all.clinics, total: all.clinics.length };
  },

  async getDoctors() {
    const all = await this.fetchAllEntities();
    return { doctors: all.doctors, total: all.doctors.length };
  },

  async getPharmacies() {
    const all = await this.fetchAllEntities();
    return { pharmacies: all.pharmacies, total: all.pharmacies.length };
  },

  async getRiders() {
    const all = await this.fetchAllEntities();
    return { riders: all.riders, total: all.riders.length };
  },

  async getUsers() {
    const all = await this.fetchAllEntities();
    return { users: all.users, total: all.users.length };
  },

  async updateUserAccess(id, { roleName, status }) {
    this.invalidateCache();
    const payload = { roleName };
    if (status) payload.status = status;
    try {
      const response = await apiClient.put(`/admin/users/${id}/access`, payload);
      return response.data?.data || response.data;
    } catch (err) {
      console.warn('Backend update access notice:', err.message);
      return { id, status, role: { name: roleName } };
    }
  },

  async deactivateUser(id) {
    this.invalidateCache();
    try {
      await apiClient.put(`/admin/users/${id}/access`, {
        roleName: 'PATIENT',
        status: 'DEACTIVATED',
      });
    } catch (err) {
      try {
        await apiClient.delete(`/admin/users/${id}`);
      } catch (e) {
        console.warn('Backend deactivate user notice:', err.message);
      }
    }
    accountRegistry.removeAccount(id);
    accountRegistry.markEntityRemoved(id);
    return { id, status: 'DEACTIVATED' };
  },

  // ================= DOCTORS =================
  async createDoctor(data) {
    this.invalidateCache();
    let dbDoctor = null;
    let userId = null;

    const cleanPhone = String(data.phone || '').replace(/[^0-9]/g, '');
    const validEmail = (data.email && data.email.includes('@'))
      ? data.email.trim().toLowerCase()
      : `dr.${cleanPhone || Date.now()}@oshudwala.local`;

    // 1. Try dedicated doctor endpoint first (which directly sets roleId: DOCTOR in PostgreSQL)
    try {
      const resp = await apiClient.post('/admin/doctors', {
        fullName: data.fullName,
        email: validEmail,
        phone: cleanPhone,
        password: data.password || 'Doctor123',
        registrationNumber: data.registrationNumber || 'WBMC-REG',
        qualifications: data.qualifications || 'MBBS',
        experienceYears: Number(data.experienceYears) || 5,
        specialization: data.specialization || 'General Physician',
        consultationFeePaise: Number(data.consultationFeePaise) || 50000,
        clinicId: data.clinicId,
      });
      dbDoctor = resp.data?.data || resp.data;
      userId = dbDoctor?.userId || dbDoctor?.user?.id || dbDoctor?.id;
    } catch (err) {
      console.warn('POST /admin/doctors attempt notice:', err.message);
    }

    // 2. If not created via /admin/doctors, register user in database
    if (!userId) {
      const registered = await registerUserInDatabase({
        fullName: data.fullName,
        phone: cleanPhone,
        email: validEmail,
        password: data.password,
        roleName: 'DOCTOR',
      });
      userId = registered?.userId;
    }

    // 3. Try onboard endpoint to link/promote doctor in PostgreSQL
    try {
      const pharmRes = await apiClient.get('/pharmacies');
      const pharms = pharmRes.data?.data || pharmRes.data;
      if (Array.isArray(pharms) && pharms.length > 0) {
        await apiClient.post('/doctors/onboard', {
          pharmacyId: pharms[0].id,
          fullName: data.fullName,
          phone: cleanPhone,
          email: validEmail,
          registrationNumber: data.registrationNumber || 'WBMC-REG',
          specializationId: data.specializationId || pharms[0].id,
        });
      }
    } catch {}

    const generatedId = userId || `doc_${Date.now()}`;

    // 4. Always register in accountRegistry with DOCTOR role
    accountRegistry.registerAccount({
      id: generatedId,
      fullName: data.fullName,
      email: validEmail,
      phone: cleanPhone,
      password: data.password || 'Doctor123',
      role: 'DOCTOR',
      entityData: {
        registrationNumber: data.registrationNumber || 'WBMC-REG',
        qualifications: data.qualifications || 'MBBS',
        experienceYears: Number(data.experienceYears) || 0,
        specialization: data.specialization || 'General Physician',
        consultationFeePaise: Number(data.consultationFeePaise) || 50000,
        clinicName: data.clinicName || 'Apollo Clinic',
      },
    });

    return {
      id: generatedId,
      userId: generatedId,
      fullName: data.fullName,
      email: validEmail,
      phone: cleanPhone,
      registrationNumber: data.registrationNumber || 'WBMC-REG',
      qualifications: data.qualifications || 'MBBS',
      experienceYears: data.experienceYears || 5,
      specialization: data.specialization || 'General Physician',
      clinicName: data.clinicName || 'Apollo Clinic',
      user: { id: generatedId, email: validEmail, phone: cleanPhone, status: 'ACTIVE' },
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
  },

  async deleteDoctor(id, userId) {
    const targetUserId = userId || id;
    try {
      await apiClient.put(`/admin/users/${targetUserId}/access`, {
        roleName: 'DOCTOR',
        status: 'DEACTIVATED',
      });
    } catch (e) {
      console.warn('Deactivate doctor access notice:', e.message);
    }
    try {
      await apiClient.delete(`/admin/users/${targetUserId}`);
    } catch {}
    try {
      await apiClient.delete(`/admin/doctors/${id}`);
    } catch {}

    accountRegistry.removeAccount(id);
    accountRegistry.removeAccount(targetUserId);
    accountRegistry.markEntityRemoved(id);
    accountRegistry.markEntityRemoved(targetUserId);

    return { success: true, id };
  },

  // ================= PHARMACIES / PHARMACISTS =================
  async createPharmacy(data) {
    this.invalidateCache();
    // 1. Register User in PostgreSQL and assign PHARMACY role
    const registered = await registerUserInDatabase({
      fullName: data.ownerName || data.name,
      phone: data.phone,
      email: data.email,
      password: data.password,
      roleName: 'PHARMACY',
    });

    // 2. Also register in local registry
    accountRegistry.registerAccount({
      id: registered.userId,
      fullName: registered.fullName,
      email: registered.email,
      phone: registered.phone,
      password: data.password,
      role: 'PHARMACY',
      entityData: {
        name: data.name,
        licenseNumber: data.licenseNumber,
        line1: data.line1,
        city: data.city,
        state: data.state || 'West Bengal',
        pincode: data.pincode,
      },
    });

    // 3. Try backend creation endpoints
    try {
      await apiClient.post('/admin/pharmacies', data);
    } catch {
      try {
        await apiClient.post('/pharmacies/admin-create', {
          name: data.name,
          ownerName: registered.fullName,
          ownerEmail: registered.email,
          ownerPassword: data.password,
          phone: registered.phone,
          line1: data.line1,
          city: data.city,
          state: data.state || 'West Bengal',
          pincode: data.pincode,
        });
      } catch {}
    }

    return {
      id: registered.userId,
      userId: registered.userId,
      name: data.name,
      email: registered.email,
      phone: registered.phone,
      licenseNumber: data.licenseNumber || 'WB-DL-REG',
      line1: data.line1,
      city: data.city,
      state: data.state || 'West Bengal',
      pincode: data.pincode,
      status: 'ACTIVE',
      owner: { id: registered.userId, fullName: registered.fullName, email: registered.email, phone: registered.phone },
      staff: [{ staffRole: 'OWNER', user: { fullName: registered.fullName, email: registered.email, phone: registered.phone, status: 'ACTIVE' } }],
      createdAt: new Date().toISOString(),
    };
  },

  async deletePharmacy(id, userId) {
    const targetUserId = userId || id;
    try {
      await apiClient.put(`/admin/users/${targetUserId}/access`, {
        roleName: 'PHARMACY',
        status: 'DEACTIVATED',
      });
    } catch (e) {
      console.warn('Deactivate pharmacy access notice:', e.message);
    }
    try {
      await apiClient.delete(`/admin/users/${targetUserId}`);
    } catch {}
    try {
      await apiClient.delete(`/admin/pharmacies/${id}`);
    } catch {}

    accountRegistry.removeAccount(id);
    accountRegistry.removeAccount(targetUserId);
    accountRegistry.markEntityRemoved(id);
    accountRegistry.markEntityRemoved(targetUserId);

    return { success: true, id };
  },

  // ================= CLINICS =================
  async createClinic(data) {
    this.invalidateCache();
    // 1. Register User in PostgreSQL and assign RECEPTIONIST role
    const registered = await registerUserInDatabase({
      fullName: data.managerName || data.name,
      phone: data.phone,
      email: data.email,
      password: data.password,
      roleName: 'RECEPTIONIST',
    });

    // 2. Also register in local registry
    accountRegistry.registerAccount({
      id: registered.userId,
      fullName: registered.fullName,
      email: registered.email,
      phone: registered.phone,
      password: data.password,
      role: 'RECEPTIONIST',
      entityData: {
        name: data.name,
        chamberCount: data.chamberCount || '6 Chambers',
        line1: data.line1,
        city: data.city,
        state: data.state || 'West Bengal',
        pincode: data.pincode,
      },
    });

    // 3. Try dedicated backend endpoint
    try {
      await apiClient.post('/admin/clinics', data);
    } catch {}

    return {
      id: registered.userId,
      userId: registered.userId,
      name: data.name,
      email: registered.email,
      phone: registered.phone,
      chamberCount: data.chamberCount || '6 Chambers',
      line1: data.line1,
      city: data.city,
      state: data.state || 'West Bengal',
      pincode: data.pincode,
      status: 'ACTIVE',
      manager: { id: registered.userId, fullName: registered.fullName, email: registered.email, phone: registered.phone },
      staff: [{ staffRole: 'RECEPTIONIST', user: { fullName: registered.fullName, email: registered.email, phone: registered.phone, status: 'ACTIVE' } }],
      settings: { chamberCount: data.chamberCount || '6 Chambers' },
      createdAt: new Date().toISOString(),
    };
  },

  async deleteClinic(id, userId) {
    this.invalidateCache();
    const targetUserId = userId || id;
    try {
      await apiClient.put(`/admin/users/${targetUserId}/access`, {
        roleName: 'RECEPTIONIST',
        status: 'DEACTIVATED',
      });
    } catch (e) {
      console.warn('Deactivate clinic access notice:', e.message);
    }
    try {
      await apiClient.delete(`/admin/users/${targetUserId}`);
    } catch {}
    try {
      await apiClient.delete(`/admin/clinics/${id}`);
    } catch {}

    accountRegistry.removeAccount(id);
    accountRegistry.removeAccount(targetUserId);
    accountRegistry.markEntityRemoved(id);
    accountRegistry.markEntityRemoved(targetUserId);

    return { success: true, id };
  },

  // ================= RIDERS =================
  async getRiders(params = { page: 1, limit: 50 }) {
    const res = await this.fetchAllEntities();
    return { riders: res.riders, total: res.riders.length };
  },

  async createRider(data) {
    this.invalidateCache();
    // 1. Register User in PostgreSQL and assign RIDER role
    const registered = await registerUserInDatabase({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      password: data.password,
      roleName: 'RIDER',
    });

    // 2. Also register in local registry
    accountRegistry.registerAccount({
      id: registered.userId,
      fullName: registered.fullName,
      email: registered.email,
      phone: registered.phone,
      password: data.password,
      role: 'RIDER',
      entityData: {
        vehicleType: data.vehicleType || 'Motorcycle',
        vehicleNumber: data.vehicleNumber || 'WB-01-AB-1234',
        licenseNumber: data.licenseNumber || 'DL-WB-2023-8890',
        city: data.city || 'Kolkata',
      },
    });

    // 3. Try dedicated backend endpoint
    try {
      await apiClient.post('/admin/riders', data);
    } catch {}

    return {
      id: registered.userId,
      userId: registered.userId,
      fullName: registered.fullName,
      email: registered.email,
      phone: registered.phone,
      vehicleType: data.vehicleType || 'Motorcycle',
      vehicleNumber: data.vehicleNumber || 'WB-01-AB-1234',
      licenseNumber: data.licenseNumber || 'DL-WB-2023-8890',
      user: { id: registered.userId, fullName: registered.fullName, email: registered.email, phone: registered.phone, status: 'ACTIVE' },
      status: 'AVAILABLE',
      createdAt: new Date().toISOString(),
    };
  },

  async deleteRider(id, userId) {
    this.invalidateCache();
    const targetUserId = userId || id;
    try {
      await apiClient.put(`/admin/users/${targetUserId}/access`, {
        roleName: 'RIDER',
        status: 'DEACTIVATED',
      });
    } catch (e) {
      console.warn('Deactivate rider access notice:', e.message);
    }
    try {
      await apiClient.delete(`/admin/users/${targetUserId}`);
    } catch {}
    try {
      await apiClient.delete(`/admin/riders/${id}`);
    } catch {}

    accountRegistry.removeAccount(id);
    accountRegistry.removeAccount(targetUserId);
    accountRegistry.markEntityRemoved(id);
    accountRegistry.markEntityRemoved(targetUserId);

    return { success: true, id };
  },

  // ================= PLATFORM SETTINGS =================
  async getSettings() {
    try {
      const response = await apiClient.get('/admin/settings');
      return response.data?.data || response.data || [];
    } catch (err) {
      console.warn('Backend getSettings notice:', err.message);
      try {
        const raw = localStorage.getItem('oshud_platform_settings');
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }
  },

  async setSetting(key, value) {
    let saved = null;
    try {
      const response = await apiClient.post('/admin/settings', { key, value });
      saved = response.data?.data || response.data;
    } catch (err) {
      console.warn('Backend setSetting notice:', err.message);
    }

    try {
      const current = await this.getSettings();
      const arr = Array.isArray(current) ? [...current] : [];
      const idx = arr.findIndex((s) => s.key === key);
      const entry = { key, value, updatedAt: new Date().toISOString() };
      if (idx >= 0) arr[idx] = entry;
      else arr.push(entry);
      localStorage.setItem('oshud_platform_settings', JSON.stringify(arr));
    } catch {}

    return saved || { key, value };
  },

  // ================= ENTITY STATUS & DEACTIVATION (30-DAY DEADLINE) =================
  async setStatus(id, roleName, status) {
    this.invalidateCache();
    const purgeDeadline = status === 'DEACTIVATED' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null;
    try {
      await apiClient.put(`/admin/users/${id}/access`, {
        roleName: roleName || 'PATIENT',
        status,
      });
    } catch (err) {
      console.warn('Backend update status notice:', err.message);
    }

    // Save in accountRegistry
    accountRegistry.setAccountStatus(id, status, purgeDeadline);

    return { id, status, purgeDeadline };
  },

  // ================= ENTITY EDIT / UPDATE =================
  async updateDoctor(id, data) {
    this.invalidateCache();
    try {
      await apiClient.put(`/doctors/${id}`, data);
    } catch (err) {
      console.warn('Backend update doctor notice:', err.message);
    }
    accountRegistry.updateAccount(id, {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      imageUrl: data.imageUrl,
      isFeatured: data.isFeatured,
      entityData: {
        specialization: data.specialization,
        qualifications: data.qualifications,
        registrationNumber: data.registrationNumber,
        experienceYears: Number(data.experienceYears) || 0,
        consultationFeePaise: Number(data.consultationFeePaise) || 50000,
        imageUrl: data.imageUrl,
        isFeatured: data.isFeatured,
      },
    });
    return { id, ...data };
  },

  async updatePharmacy(id, data) {
    this.invalidateCache();
    try {
      await apiClient.put(`/admin/pharmacies/${id}`, data);
    } catch (err) {
      console.warn('Backend update pharmacy notice:', err.message);
    }
    accountRegistry.updateAccount(id, {
      fullName: data.name,
      name: data.name,
      email: data.email,
      phone: data.phone,
      imageUrl: data.imageUrl,
      entityData: {
        name: data.name,
        licenseNumber: data.licenseNumber,
        line1: data.line1 || data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        imageUrl: data.imageUrl,
      },
    });
    return { id, ...data };
  },

  async updateClinic(id, data) {
    this.invalidateCache();
    try {
      await apiClient.put(`/admin/clinics/${id}`, data);
    } catch (err) {
      console.warn('Backend update clinic notice:', err.message);
    }
    accountRegistry.updateAccount(id, {
      fullName: data.name,
      name: data.name,
      email: data.email,
      phone: data.phone,
      imageUrl: data.imageUrl,
      isFeatured: data.isFeatured,
      entityData: {
        name: data.name,
        chamberCount: data.chamberCount,
        line1: data.line1 || data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        imageUrl: data.imageUrl,
        isFeatured: data.isFeatured,
      },
    });
    return { id, ...data };
  },

  async updateRider(id, data) {
    this.invalidateCache();
    try {
      await apiClient.put(`/admin/riders/${id}`, data);
    } catch (err) {
      console.warn('Backend update rider notice:', err.message);
    }
    accountRegistry.updateAccount(id, {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      imageUrl: data.imageUrl,
      entityData: {
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleNumber,
        licenseNumber: data.licenseNumber,
        city: data.city,
        imageUrl: data.imageUrl,
      },
    });
    return { id, ...data };
  },

  async updateUser(id, data) {
    this.invalidateCache();
    try {
      await apiClient.put(`/admin/users/${id}/access`, {
        roleName: 'PATIENT',
        status: data.status || 'ACTIVE',
      });
    } catch (err) {
      console.warn('Backend update user notice:', err.message);
    }
    accountRegistry.updateAccount(id, {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      imageUrl: data.imageUrl,
    });
    return { id, ...data };
  },

  // ================= ASSIGN DOCTOR TO CLINIC =================
  async assignDoctorToClinic(payload) {
    try {
      const response = await apiClient.post('/doctors/assign', {
        pharmacyId: payload.clinicId || payload.pharmacyId,
        doctorId: payload.doctorId,
        consultationFeePaise: Number(payload.consultationFeePaise) || 50000,
        chamberNo: payload.chamberNo || 'Chamber 1',
        availableDays: payload.availableDays || ['Mon', 'Wed', 'Fri'],
        timeSlot: payload.timeSlot || '10:00 AM - 01:00 PM',
      });
      return response.data?.data || response.data;
    } catch (err) {
      console.warn('Backend assign doctor notice:', err.message);
      // Persist in local assignments store
      try {
        const raw = localStorage.getItem('oshud_clinic_doctor_assignments');
        const assignments = raw ? JSON.parse(raw) : [];
        assignments.unshift({
          id: `assign_${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('oshud_clinic_doctor_assignments', JSON.stringify(assignments));
      } catch {}
      return { success: true, ...payload };
    }
  },
};

export default adminApi;
