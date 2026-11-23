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
  // Read in-memory cached entities synchronously
  getCachedEntities() {
    return cachedEntities;
  },

  // Check if fresh cache is ready
  hasCachedEntities() {
    return Boolean(cachedEntities && Date.now() - lastEntitiesFetch < ENTITIES_CACHE_TTL);
  },

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
    let backendLocations = [];
    let backendSettings = [];

    // Parallel fetch real backend endpoints only (No failing 404 routes!)
    try {
      const [usersRes, docsRes, pharmsRes, ridersRes, locationsRes, settingsRes] = await Promise.allSettled([
        apiClient.get('/admin/users', { params: { limit: 500 } }),
        apiClient.get('/doctors'),
        apiClient.get('/pharmacies'),
        apiClient.get('/riders'),
        apiClient.get('/locations/admin/all').catch(() => apiClient.get('/locations')),
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
      if (locationsRes.status === 'fulfilled') {
        const d = locationsRes.value.data?.data || locationsRes.value.data;
        backendLocations = Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [];
      }
      if (settingsRes.status === 'fulfilled') {
        backendSettings = settingsRes.value.data?.data || settingsRes.value.data || [];
      }
    } catch (e) {
      console.warn('Backend fetch all entities notice:', e.message);
    }

    const isRemoved = (id, userId) => accountRegistry.isEntityRemoved(id, userId);

    // 1. DOCTORS (Backend first as source of truth)
    const doctors = [];
    const seenDocIds = new Set();
    const seenDocEmails = new Set();
    const seenDocPhones = new Set();

    backendDoctors.forEach((bd) => {
      if (isRemoved(bd.id, bd.userId)) return;
      const cleanEmail = bd.email ? bd.email.trim().toLowerCase() : '';
      const cleanPhone = bd.phone ? String(bd.phone).replace(/[^0-9]/g, '') : '';
      const localMatch = local.doctors.find(
        (ld) =>
          ld.id === bd.id ||
          ld.userId === bd.userId ||
          (cleanEmail && ld.email?.toLowerCase() === cleanEmail) ||
          (cleanPhone && ld.phone && String(ld.phone).replace(/[^0-9]/g, '') === cleanPhone)
      );

      doctors.push({
        id: bd.id,
        userId: bd.userId || bd.id,
        fullName: bd.fullName || bd.name,
        email: bd.email,
        phone: bd.phone,
        imageUrl: bd.imageUrl || bd.photoUrl || localMatch?.imageUrl || '',
        registrationNumber: bd.registrationNumber || 'WBMC-REG',
        qualifications: bd.qualifications || 'MBBS',
        experienceYears: bd.experienceYears || 5,
        specialization: bd.specialization || bd.specializations?.[0]?.specialization?.name || 'General Physician',
        consultationFeePaise: bd.consultationFeePaise || localMatch?.consultationFeePaise || 50000,
        status: bd.status || 'ACTIVE',
        user: { id: bd.userId || bd.id, email: bd.email, phone: bd.phone, status: bd.status || 'ACTIVE' },
        isFeatured: bd.isFeatured ?? localMatch?.isFeatured ?? false,
      });

      seenDocIds.add(bd.id);
      if (bd.userId) seenDocIds.add(bd.userId);
      if (cleanEmail) seenDocEmails.add(cleanEmail);
      if (cleanPhone) seenDocPhones.add(cleanPhone);
    });

    backendUsers.filter((u) => u.role?.name === 'DOCTOR' || u.role === 'DOCTOR').forEach((u) => {
      if (isRemoved(u.id)) return;
      const cleanEmail = u.email ? u.email.trim().toLowerCase() : '';
      const cleanPhone = u.phone ? String(u.phone).replace(/[^0-9]/g, '') : '';
      if (seenDocIds.has(u.id) || (cleanEmail && seenDocEmails.has(cleanEmail)) || (cleanPhone && seenDocPhones.has(cleanPhone))) return;

      const localMatch = local.doctors.find(
        (ld) =>
          ld.id === u.id ||
          ld.userId === u.id ||
          (cleanEmail && ld.email?.toLowerCase() === cleanEmail) ||
          (cleanPhone && ld.phone && String(ld.phone).replace(/[^0-9]/g, '') === cleanPhone)
      );

      doctors.push({
        id: u.id,
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        imageUrl: u.imageUrl || localMatch?.imageUrl || '',
        registrationNumber: 'WBMC-REG',
        qualifications: 'MBBS',
        experienceYears: 5,
        specialization: 'General Physician',
        consultationFeePaise: localMatch?.consultationFeePaise || 50000,
        status: u.status || 'ACTIVE',
        user: { id: u.id, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' },
        isFeatured: localMatch?.isFeatured || false,
      });

      seenDocIds.add(u.id);
      if (cleanEmail) seenDocEmails.add(cleanEmail);
      if (cleanPhone) seenDocPhones.add(cleanPhone);
    });

    local.doctors.forEach((ld) => {
      if (isRemoved(ld.id, ld.userId)) return;
      const cleanEmail = ld.email ? ld.email.trim().toLowerCase() : '';
      const cleanPhone = ld.phone ? String(ld.phone).replace(/[^0-9]/g, '') : '';
      if (seenDocIds.has(ld.id) || (ld.userId && seenDocIds.has(ld.userId)) || (cleanEmail && seenDocEmails.has(cleanEmail))) return;
      doctors.push(ld);
      seenDocIds.add(ld.id);
    });

    // 2. PHARMACIES (Backend first as source of truth)
    const pharmacies = [];
    const seenPharmIds = new Set();
    const seenPharmEmails = new Set();

    backendPharmacies.forEach((bp) => {
      if (isRemoved(bp.id, bp.ownerId)) return;
      const cleanEmail = bp.email ? bp.email.trim().toLowerCase() : '';
      const localMatch = local.pharmacies.find(
        (lp) => lp.id === bp.id || (cleanEmail && lp.email?.toLowerCase() === cleanEmail)
      );

      pharmacies.push({
        id: bp.id,
        userId: bp.ownerId || bp.id,
        name: bp.name,
        email: bp.email,
        phone: bp.phone,
        imageUrl: bp.imageUrl || localMatch?.imageUrl || '',
        licenseNumber: bp.licenseNumber || 'WB-DL-REG',
        line1: bp.line1 || 'Sector V',
        city: bp.city || 'Kolkata',
        state: bp.state || 'West Bengal',
        pincode: bp.pincode || '700091',
        status: bp.status || 'ACTIVE',
        owner: { id: bp.id, fullName: bp.ownerName || bp.name, email: bp.email, phone: bp.phone },
        staff: [{ staffRole: 'OWNER', user: { fullName: bp.ownerName || bp.name, email: bp.email, phone: bp.phone, status: bp.status || 'ACTIVE' } }],
      });

      seenPharmIds.add(bp.id);
      if (cleanEmail) seenPharmEmails.add(cleanEmail);
    });

    backendUsers.filter((u) => u.role?.name === 'PHARMACY' || u.role === 'PHARMACY').forEach((u) => {
      if (isRemoved(u.id)) return;
      const cleanEmail = u.email ? u.email.trim().toLowerCase() : '';
      if (seenPharmIds.has(u.id) || (cleanEmail && seenPharmEmails.has(cleanEmail))) return;

      const localMatch = local.pharmacies.find(
        (lp) => lp.id === u.id || (cleanEmail && lp.email?.toLowerCase() === cleanEmail)
      );

      pharmacies.push({
        id: u.id,
        userId: u.id,
        name: `${u.fullName} Pharmacy`,
        email: u.email,
        phone: u.phone,
        imageUrl: localMatch?.imageUrl || '',
        licenseNumber: 'WB-DL-REG',
        line1: 'Sector V',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700091',
        status: u.status || 'ACTIVE',
        owner: { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone },
        staff: [{ staffRole: 'OWNER', user: { fullName: u.fullName, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' } }],
      });

      seenPharmIds.add(u.id);
      if (cleanEmail) seenPharmEmails.add(cleanEmail);
    });

    local.pharmacies.forEach((lp) => {
      if (isRemoved(lp.id, lp.userId)) return;
      const cleanEmail = lp.email ? lp.email.trim().toLowerCase() : '';
      if (seenPharmIds.has(lp.id) || (cleanEmail && seenPharmEmails.has(cleanEmail))) return;
      pharmacies.push(lp);
      seenPharmIds.add(lp.id);
    });

    // 3. CLINICS (Backend Locations & Receptionists first)
    const clinics = [];
    const seenClinicIds = new Set();
    const seenClinicEmails = new Set();

    backendLocations.forEach((loc) => {
      if (isRemoved(loc.id)) return;
      const localMatch = local.clinics.find(
        (lc) => lc.id === loc.id || (lc.name && lc.name.toLowerCase().includes(loc.city?.toLowerCase()))
      );

      clinics.push({
        id: loc.id,
        userId: loc.id,
        name: loc.area ? `${loc.area} Clinic (${loc.city})` : `${loc.city} Health Hub`,
        email: localMatch?.email || `clinic.${String(loc.city || 'hub').toLowerCase().replace(/\s+/g, '')}@oshudwala.com`,
        phone: localMatch?.phone || '9876543210',
        imageUrl: loc.imageUrl || localMatch?.imageUrl || '',
        chamberCount: loc.chamberCount || localMatch?.chamberCount || '6 Chambers',
        line1: loc.area ? `${loc.area}, ${loc.city}` : loc.city,
        city: loc.city,
        state: loc.state,
        pincode: loc.pincode,
        status: loc.isActive === false ? 'DEACTIVATED' : 'ACTIVE',
        manager: { id: loc.id, fullName: localMatch?.manager?.fullName || `${loc.city} Manager`, email: localMatch?.email, phone: localMatch?.phone },
        staff: [{ staffRole: 'RECEPTIONIST', user: { fullName: localMatch?.manager?.fullName || `${loc.city} Manager`, status: loc.isActive === false ? 'DEACTIVATED' : 'ACTIVE' } }],
        settings: { chamberCount: loc.chamberCount || localMatch?.chamberCount || '6 Chambers' },
        isFeatured: localMatch?.isFeatured || false,
      });

      seenClinicIds.add(loc.id);
    });

    backendUsers.filter((u) => u.role?.name === 'RECEPTIONIST' || u.role === 'RECEPTIONIST').forEach((u) => {
      if (isRemoved(u.id)) return;
      const cleanEmail = u.email ? u.email.trim().toLowerCase() : '';
      if (seenClinicIds.has(u.id) || (cleanEmail && seenClinicEmails.has(cleanEmail))) return;

      const localMatch = local.clinics.find(
        (lc) => lc.id === u.id || (cleanEmail && lc.email?.toLowerCase() === cleanEmail)
      );

      clinics.push({
        id: u.id,
        userId: u.id,
        name: `${u.fullName} Polyclinic`,
        email: u.email,
        phone: u.phone,
        imageUrl: localMatch?.imageUrl || '',
        chamberCount: localMatch?.chamberCount || '6 Chambers',
        line1: 'Salt Lake Sector 1',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700064',
        status: u.status || 'ACTIVE',
        manager: { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone },
        staff: [{ staffRole: 'RECEPTIONIST', user: { fullName: u.fullName, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' } }],
        settings: { chamberCount: '6 Chambers' },
        isFeatured: localMatch?.isFeatured || false,
      });

      seenClinicIds.add(u.id);
      if (cleanEmail) seenClinicEmails.add(cleanEmail);
    });

    local.clinics.forEach((lc) => {
      if (isRemoved(lc.id, lc.userId)) return;
      const cleanEmail = lc.email ? lc.email.trim().toLowerCase() : '';
      if (seenClinicIds.has(lc.id) || (cleanEmail && seenClinicEmails.has(cleanEmail))) return;
      clinics.push(lc);
      seenClinicIds.add(lc.id);
    });

    // 4. RIDERS (Backend first as source of truth)
    const riders = [];
    const seenRiderIds = new Set();
    const seenRiderPhones = new Set();

    backendRiders.forEach((br) => {
      if (isRemoved(br.id, br.userId)) return;
      const cleanPhone = br.phone || br.user?.phone ? String(br.phone || br.user?.phone).replace(/[^0-9]/g, '') : '';
      const localMatch = local.riders.find(
        (lr) => lr.id === br.id || lr.userId === br.userId || (cleanPhone && lr.phone && String(lr.phone).replace(/[^0-9]/g, '') === cleanPhone)
      );

      riders.push({
        id: br.id,
        userId: br.userId || br.id,
        fullName: br.user?.fullName || br.fullName || localMatch?.fullName || 'Rider',
        email: br.user?.email || br.email || localMatch?.email,
        phone: br.user?.phone || br.phone || localMatch?.phone,
        imageUrl: br.imageUrl || localMatch?.imageUrl || '',
        vehicleType: br.vehicleType || localMatch?.vehicleType || 'Motorcycle',
        vehicleNumber: br.vehicleNumber || localMatch?.vehicleNumber || 'WB-01-AB-1234',
        licenseNumber: br.licenseNumber || localMatch?.licenseNumber || 'DL-WB-Verified',
        user: { id: br.userId || br.id, fullName: br.fullName, email: br.email, phone: br.phone, status: br.status || 'ACTIVE' },
        status: br.status || 'AVAILABLE',
      });

      seenRiderIds.add(br.id);
      if (br.userId) seenRiderIds.add(br.userId);
      if (cleanPhone) seenRiderPhones.add(cleanPhone);
    });

    backendUsers.filter((u) => u.role?.name === 'RIDER' || u.role === 'RIDER').forEach((u) => {
      if (isRemoved(u.id)) return;
      const cleanPhone = u.phone ? String(u.phone).replace(/[^0-9]/g, '') : '';
      if (seenRiderIds.has(u.id) || (cleanPhone && seenRiderPhones.has(cleanPhone))) return;

      const localMatch = local.riders.find(
        (lr) => lr.id === u.id || lr.userId === u.id || (cleanPhone && lr.phone && String(lr.phone).replace(/[^0-9]/g, '') === cleanPhone)
      );

      riders.push({
        id: u.id,
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        imageUrl: localMatch?.imageUrl || '',
        vehicleType: localMatch?.vehicleType || 'Motorcycle',
        vehicleNumber: localMatch?.vehicleNumber || 'WB-01-AB-1234',
        licenseNumber: localMatch?.licenseNumber || 'DL-WB-Verified',
        user: { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' },
        status: u.status || 'AVAILABLE',
      });

      seenRiderIds.add(u.id);
      if (cleanPhone) seenRiderPhones.add(cleanPhone);
    });

    local.riders.forEach((lr) => {
      if (isRemoved(lr.id, lr.userId)) return;
      const cleanPhone = lr.phone ? String(lr.phone).replace(/[^0-9]/g, '') : '';
      if (seenRiderIds.has(lr.id) || (lr.userId && seenRiderIds.has(lr.userId)) || (cleanPhone && seenRiderPhones.has(cleanPhone))) return;
      riders.push(lr);
      seenRiderIds.add(lr.id);
    });

    // 5. PATIENTS / USERS
    const users = [];
    const seenUserIds = new Set();
    const seenUserPhones = new Set();

    backendUsers
      .filter((u) => !u.role?.name || u.role?.name === 'PATIENT' || u.role === 'PATIENT')
      .forEach((u) => {
        if (isRemoved(u.id)) return;
        const cleanPhone = u.phone ? String(u.phone).replace(/[^0-9]/g, '') : '';

        users.push({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          imageUrl: u.imageUrl || '',
          createdAt: u.createdAt,
          role: { name: 'PATIENT' },
          status: u.status || 'ACTIVE',
        });

        seenUserIds.add(u.id);
        if (cleanPhone) seenUserPhones.add(cleanPhone);
      });

    local.users.forEach((lu) => {
      if (isRemoved(lu.id, lu.userId)) return;
      const cleanPhone = lu.phone ? String(lu.phone).replace(/[^0-9]/g, '') : '';
      if (seenUserIds.has(lu.id) || (cleanPhone && seenUserPhones.has(cleanPhone))) return;
      users.push(lu);
      seenUserIds.add(lu.id);
    });

    const statusStore = accountRegistry.getEntityStatuses();
    const applyStatus = (item) => {
      const match =
        statusStore[item.id] ||
        (item.userId && statusStore[item.userId]) ||
        (item.email && statusStore[item.email.toLowerCase()]) ||
        (item.phone && statusStore[String(item.phone).replace(/[^0-9]/g, '')]);
      if (match) {
        return {
          ...item,
          status: match.status,
          deactivatedAt: match.deactivatedAt,
          purgeDeadline: match.purgeDeadline,
          user: item.user ? { ...item.user, status: match.status } : item.user,
        };
      }
      return item;
    };

    const result = {
      clinics: clinics.filter((c) => !accountRegistry.isEntityRemoved(c.id)).map(applyStatus),
      doctors: doctors.filter((d) => !accountRegistry.isEntityRemoved(d.id)).map(applyStatus),
      pharmacies: pharmacies.filter((p) => !accountRegistry.isEntityRemoved(p.id)).map(applyStatus),
      riders: riders.filter((r) => !accountRegistry.isEntityRemoved(r.id)).map(applyStatus),
      users: users.filter((u) => !accountRegistry.isEntityRemoved(u.id)).map(applyStatus),
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
  async setStatus(id, roleName, status, entityInfo = {}) {
    this.invalidateCache();
    const purgeDeadline = status === 'DEACTIVATED' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null;

    // 1. Immediately record in persistent registry
    accountRegistry.setAccountStatus(id, status, purgeDeadline, {
      ...entityInfo,
      role: roleName,
    });

    // 2. Try backend sync with short timeout so network latency never blocks the UI
    try {
      const targetUserId = entityInfo.userId || entityInfo.id || id;
      const apiPromise = apiClient.put(`/admin/users/${targetUserId}/access`, {
        roleName: roleName || 'PATIENT',
        status,
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 2500)
      );
      await Promise.race([apiPromise, timeoutPromise]);
    } catch (err) {
      console.warn('Backend update status notice:', err.message);
    }

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
  async getDoctorClinicAssignments() {
    try {
      const raw = localStorage.getItem('oshud_clinic_doctor_assignments');
      if (raw) return JSON.parse(raw);
    } catch {}

    const defaultAssignments = [
      {
        id: 'assign_seed_1',
        clinicId: 'cln-01',
        clinicName: 'Apollo Clinic & Polyclinic',
        clinicAddress: 'Sector 1, Salt Lake City, Kolkata',
        doctorId: 'doc-01',
        doctorName: 'Dr. Priya Sharma',
        doctorSpecialization: 'General Medicine & Diabetology',
        doctorQualifications: 'MBBS, MD (Medicine)',
        consultationFee: 500,
        chamberNo: 'Chamber 1 (Room 204)',
        startTime: '09:30 AM',
        endTime: '01:30 PM',
        timeSlot: '09:30 AM - 01:30 PM',
        maxCapacity: 25,
        scheduleType: 'DAILY',
        scheduleSummary: 'Daily (Mon - Sun)',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'ACTIVE',
        createdAt: '2026-11-20T10:00:00.000Z',
      },
      {
        id: 'assign_seed_2',
        clinicId: 'cln-01',
        clinicName: 'Apollo Clinic & Polyclinic',
        clinicAddress: 'Sector 1, Salt Lake City, Kolkata',
        doctorId: 'doc-02',
        doctorName: 'Dr. Rohit Mehta',
        doctorSpecialization: 'Cardiology',
        doctorQualifications: 'MBBS, MD, DM (Cardio)',
        consultationFee: 700,
        chamberNo: 'Chamber 2 (Room 206)',
        startTime: '10:00 AM',
        endTime: '02:00 PM',
        timeSlot: '10:00 AM - 02:00 PM',
        maxCapacity: 20,
        scheduleType: 'WEEKLY_CUSTOM',
        scheduleSummary: 'Weekly: Mon, Wed, Fri',
        availableDays: ['Mon', 'Wed', 'Fri'],
        status: 'ACTIVE',
        createdAt: '2026-11-21T11:00:00.000Z',
      },
      {
        id: 'assign_seed_3',
        clinicId: 'cln-02',
        clinicName: 'CarePlus Poly Clinic',
        clinicAddress: 'Main Road, New Town, Kolkata',
        doctorId: 'doc-03',
        doctorName: 'Dr. Sneha Das',
        doctorSpecialization: 'Dermatology & Cosmetology',
        doctorQualifications: 'MBBS, MD (DVL)',
        consultationFee: 650,
        chamberNo: 'Room 102',
        startTime: '02:00 PM',
        endTime: '06:00 PM',
        timeSlot: '02:00 PM - 06:00 PM',
        maxCapacity: 15,
        scheduleType: 'MONTHLY_SPECIFIC_WEEKDAY',
        scheduleSummary: 'Monthly: 1st & 3rd Saturday',
        availableDays: ['Sat'],
        scheduleDetails: {
          weeks: ['Week 1', 'Week 3'],
          weekday: 'Saturday',
        },
        status: 'ACTIVE',
        createdAt: '2026-11-22T09:00:00.000Z',
      },
    ];

    try {
      localStorage.setItem('oshud_clinic_doctor_assignments', JSON.stringify(defaultAssignments));
    } catch {}
    return defaultAssignments;
  },

  async assignDoctorToClinic(payload) {
    try {
      await apiClient.post('/doctors/assign', {
        pharmacyId: payload.clinicId || payload.pharmacyId,
        doctorId: payload.doctorId,
        consultationFeePaise: (Number(payload.consultationFee) || 500) * 100,
        chamberNo: payload.chamberNo || 'Chamber 1',
        availableDays: payload.availableDays || ['Mon', 'Wed', 'Fri'],
        timeSlot: payload.timeSlot || `${payload.startTime || '10:00 AM'} - ${payload.endTime || '01:00 PM'}`,
      });
    } catch (err) {
      console.warn('Backend assign doctor notice:', err.message);
    }

    try {
      const raw = localStorage.getItem('oshud_clinic_doctor_assignments');
      const assignments = raw ? JSON.parse(raw) : [];
      const newAssignment = {
        id: `assign_${Date.now()}`,
        ...payload,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      assignments.unshift(newAssignment);
      localStorage.setItem('oshud_clinic_doctor_assignments', JSON.stringify(assignments));
      return newAssignment;
    } catch (e) {
      return { success: true, ...payload };
    }
  },

  async removeDoctorClinicAssignment(id) {
    try {
      const raw = localStorage.getItem('oshud_clinic_doctor_assignments');
      const assignments = raw ? JSON.parse(raw) : [];
      const filtered = assignments.filter((a) => a.id !== id);
      localStorage.setItem('oshud_clinic_doctor_assignments', JSON.stringify(filtered));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async toggleAssignmentStatus(id) {
    try {
      const raw = localStorage.getItem('oshud_clinic_doctor_assignments');
      const assignments = raw ? JSON.parse(raw) : [];
      const updated = assignments.map((a) => {
        if (a.id === id) {
          return { ...a, status: a.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE' };
        }
        return a;
      });
      localStorage.setItem('oshud_clinic_doctor_assignments', JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },
};

export default adminApi;
