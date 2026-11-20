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
  const cleanEmail = email && email.includes('@') ? email.trim().toLowerCase() : null;
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

export const adminApi = {
  // ================= USERS / PATIENTS =================
  async getUsers(params = { page: 1, limit: 50, roleName: 'PATIENT' }) {
    let backendUsers = [];
    try {
      const response = await apiClient.get('/admin/users', { params });
      const data = response.data?.data || response.data;
      if (Array.isArray(data?.users)) {
        backendUsers = data.users;
      } else if (Array.isArray(data)) {
        backendUsers = data;
      }
    } catch (err) {
      console.warn('Backend fetch users notice:', err.message);
    }

    const localEntities = accountRegistry.getEntities();
    const allUsers = [...backendUsers];

    // Merge any locally registered patients that haven't shown up in list yet
    localEntities.users.forEach((lu) => {
      if (!allUsers.some((u) => u.id === lu.id || (u.phone && lu.phone && u.phone === lu.phone))) {
        allUsers.push(lu);
      }
    });

    const filtered = allUsers.filter(
      (u) =>
        (!params.roleName || u.role?.name === params.roleName || u.role === params.roleName) &&
        !accountRegistry.isEntityRemoved(u.id)
    );

    return { users: filtered, total: filtered.length };
  },

  async updateUserAccess(id, { roleName, status }) {
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
  async getDoctors(params = { page: 1, limit: 50 }) {
    let list = [];

    // 1. Try dedicated doctor endpoint if present
    try {
      const response = await apiClient.get('/admin/doctors', { params });
      const data = response.data?.data || response.data;
      if (Array.isArray(data?.doctors)) list = data.doctors;
      else if (Array.isArray(data)) list = data;
    } catch (err) {
      console.warn('Backend fetch doctors notice:', err.message);
    }

    // Filter out removed doctors from direct endpoint
    list = list.filter(
      (d) =>
        !accountRegistry.isEntityRemoved(d.id) &&
        !accountRegistry.isEntityRemoved(d.userId) &&
        d.user?.status !== 'DEACTIVATED' &&
        d.status !== 'DEACTIVATED'
    );

    // 2. Query /admin/users to retrieve real users with DOCTOR role
    try {
      const usersRes = await apiClient.get('/admin/users', { params: { limit: 100 } });
      const uData = usersRes.data?.data || usersRes.data;
      const allUsers = Array.isArray(uData?.users) ? uData.users : Array.isArray(uData) ? uData : [];
      const doctorUsers = allUsers.filter(
        (u) =>
          (u.role?.name === 'DOCTOR' || u.role === 'DOCTOR' || u.doctor != null) &&
          u.status !== 'DEACTIVATED' &&
          !accountRegistry.isEntityRemoved(u.id) &&
          !accountRegistry.isEntityRemoved(u.doctor?.id)
      );

      doctorUsers.forEach((u) => {
        if (!list.some((d) => d.id === u.id || d.userId === u.id || (u.phone && d.phone === u.phone))) {
          list.push({
            id: u.doctor?.id || u.id,
            userId: u.id,
            fullName: u.doctor?.fullName || u.fullName,
            email: u.email,
            phone: u.phone,
            registrationNumber: u.doctor?.registrationNumber || 'WBMC-REG',
            qualifications: u.doctor?.qualifications || 'MBBS',
            experienceYears: u.doctor?.experienceYears || 5,
            specialization: u.doctor?.specializations?.[0]?.specialization?.name || 'General Physician',
            specializations: u.doctor?.specializations || [{ specialization: { name: 'General Physician' } }],
            clinicName: u.doctor?.pharmacies?.[0]?.pharmacy?.name || 'Apollo Clinic',
            pharmacies: u.doctor?.pharmacies || [{ pharmacy: { name: 'Apollo Clinic' } }],
            user: { id: u.id, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' },
            status: u.status || 'ACTIVE',
            createdAt: u.createdAt,
          });
        }
      });
    } catch (err) {
      console.warn('Backend query users for doctors notice:', err.message);
    }

    // 3. Include any doctor registered in local registry
    const registryDoctors = accountRegistry.getEntities().doctors.filter(
      (rd) => !accountRegistry.isEntityRemoved(rd.id) && !accountRegistry.isEntityRemoved(rd.userId)
    );
    registryDoctors.forEach((rd) => {
      if (!list.some((d) => d.id === rd.id || (rd.email && d.email === rd.email) || (rd.phone && d.phone === rd.phone))) {
        list.push(rd);
      }
    });

    return { doctors: list, total: list.length };
  },

  async createDoctor(data) {
    // 1. Register User in PostgreSQL and assign DOCTOR role
    const registered = await registerUserInDatabase({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      password: data.password,
      roleName: 'DOCTOR',
    });

    // 2. Also register in local storage registry
    accountRegistry.registerAccount({
      id: registered.userId,
      fullName: registered.fullName,
      email: registered.email,
      phone: registered.phone,
      password: data.password,
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

    // 3. Try dedicated doctor endpoint or onboard endpoint if available
    try {
      await apiClient.post('/admin/doctors', data);
    } catch {
      try {
        const pharmRes = await apiClient.get('/pharmacies');
        const pharms = pharmRes.data?.data || pharmRes.data;
        if (Array.isArray(pharms) && pharms.length > 0) {
          await apiClient.post('/doctors/onboard', {
            pharmacyId: pharms[0].id,
            fullName: registered.fullName,
            phone: registered.phone,
            email: registered.email,
            registrationNumber: data.registrationNumber || 'WBMC-REG',
            specializationId: data.specializationId || pharms[0].id,
          });
        }
      } catch {}
    }

    return {
      id: registered.userId,
      userId: registered.userId,
      fullName: registered.fullName,
      email: registered.email,
      phone: registered.phone,
      registrationNumber: data.registrationNumber || 'WBMC-REG',
      qualifications: data.qualifications || 'MBBS',
      experienceYears: data.experienceYears || 5,
      specialization: data.specialization || 'General Physician',
      clinicName: data.clinicName || 'Apollo Clinic',
      user: { id: registered.userId, email: registered.email, phone: registered.phone, status: 'ACTIVE' },
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
  async getPharmacies(params = { page: 1, limit: 50 }) {
    let list = [];

    // 1. Try /admin/pharmacies or /pharmacies
    try {
      const response = await apiClient.get('/admin/pharmacies', { params });
      const data = response.data?.data || response.data;
      if (Array.isArray(data?.pharmacies)) list = data.pharmacies;
      else if (Array.isArray(data)) list = data;
    } catch (err) {
      try {
        const fallbackRes = await apiClient.get('/pharmacies');
        const d = fallbackRes.data?.data || fallbackRes.data;
        if (Array.isArray(d)) list = d;
      } catch {
        console.warn('Backend fetch pharmacies notice:', err.message);
      }
    }

    list = list.filter(
      (p) =>
        !accountRegistry.isEntityRemoved(p.id) &&
        !accountRegistry.isEntityRemoved(p.owner?.id) &&
        p.status !== 'CLOSED' &&
        p.status !== 'DEACTIVATED'
    );

    // 2. Query /admin/users for PHARMACY role users
    try {
      const usersRes = await apiClient.get('/admin/users', { params: { limit: 100 } });
      const uData = usersRes.data?.data || usersRes.data;
      const allUsers = Array.isArray(uData?.users) ? uData.users : Array.isArray(uData) ? uData : [];
      const pharmacyUsers = allUsers.filter(
        (u) =>
          (u.role?.name === 'PHARMACY' || u.role === 'PHARMACY' || u.pharmacyStaff != null) &&
          u.status !== 'DEACTIVATED' &&
          !accountRegistry.isEntityRemoved(u.id)
      );

      pharmacyUsers.forEach((u) => {
        if (!list.some((p) => p.id === u.id || (p.email && u.email && p.email.toLowerCase() === u.email.toLowerCase()))) {
          list.push({
            id: u.id,
            userId: u.id,
            name: u.pharmacyStaff?.pharmacy?.name || `${u.fullName} Pharmacy`,
            email: u.email,
            phone: u.phone,
            licenseNumber: 'WB-DL-REG',
            line1: u.pharmacyStaff?.pharmacy?.city || 'Salt Lake Sector V',
            city: u.pharmacyStaff?.pharmacy?.city || 'Kolkata',
            state: 'West Bengal',
            pincode: '700091',
            status: u.status || 'ACTIVE',
            owner: { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone },
            staff: [{ staffRole: 'OWNER', user: { fullName: u.fullName, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' } }],
            createdAt: u.createdAt,
          });
        }
      });
    } catch (err) {
      console.warn('Backend query users for pharmacies notice:', err.message);
    }

    // 3. Include any pharmacy registered in local registry
    const registryPharmacies = accountRegistry.getEntities().pharmacies.filter(
      (rp) => !accountRegistry.isEntityRemoved(rp.id) && !accountRegistry.isEntityRemoved(rp.userId)
    );
    registryPharmacies.forEach((rp) => {
      if (!list.some((p) => p.id === rp.id || (rp.email && p.email === rp.email) || (rp.phone && p.phone === rp.phone))) {
        list.push(rp);
      }
    });

    return { pharmacies: list, total: list.length };
  },

  async createPharmacy(data) {
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
  async getClinics(params = { page: 1, limit: 50 }) {
    let list = [];

    // 1. Try /admin/clinics
    try {
      const response = await apiClient.get('/admin/clinics', { params });
      const data = response.data?.data || response.data;
      if (Array.isArray(data?.clinics)) list = data.clinics;
      else if (Array.isArray(data)) list = data;
    } catch (err) {
      console.warn('Backend fetch clinics notice:', err.message);
    }

    list = list.filter(
      (c) =>
        !accountRegistry.isEntityRemoved(c.id) &&
        !accountRegistry.isEntityRemoved(c.manager?.id) &&
        c.status !== 'CLOSED' &&
        c.status !== 'DEACTIVATED'
    );

    // 2. Query /admin/users for RECEPTIONIST role users
    try {
      const usersRes = await apiClient.get('/admin/users', { params: { limit: 100 } });
      const uData = usersRes.data?.data || usersRes.data;
      const allUsers = Array.isArray(uData?.users) ? uData.users : Array.isArray(uData) ? uData : [];
      const receptionistUsers = allUsers.filter(
        (u) =>
          (u.role?.name === 'RECEPTIONIST' || u.role === 'RECEPTIONIST') &&
          u.status !== 'DEACTIVATED' &&
          !accountRegistry.isEntityRemoved(u.id)
      );

      receptionistUsers.forEach((u) => {
        if (!list.some((c) => c.id === u.id || (c.email && u.email && c.email.toLowerCase() === u.email.toLowerCase()))) {
          list.push({
            id: u.id,
            userId: u.id,
            name: `${u.fullName} Clinic & Diagnostics`,
            email: u.email,
            phone: u.phone,
            chamberCount: '6 Chambers',
            line1: 'City Centre, Sector 1',
            city: 'Kolkata',
            state: 'West Bengal',
            pincode: '700064',
            status: u.status || 'ACTIVE',
            manager: { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone },
            staff: [{ staffRole: 'RECEPTIONIST', user: { fullName: u.fullName, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' } }],
            settings: { chamberCount: '6 Chambers' },
            createdAt: u.createdAt,
          });
        }
      });
    } catch (err) {
      console.warn('Backend query users for clinics notice:', err.message);
    }

    // 3. Include any clinic registered in local registry
    const registryClinics = accountRegistry.getEntities().clinics.filter(
      (rc) => !accountRegistry.isEntityRemoved(rc.id) && !accountRegistry.isEntityRemoved(rc.userId)
    );
    registryClinics.forEach((rc) => {
      if (!list.some((c) => c.id === rc.id || (rc.email && c.email === rc.email) || (rc.phone && c.phone === rc.phone))) {
        list.push(rc);
      }
    });

    return { clinics: list, total: list.length };
  },

  async createClinic(data) {
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
    let list = [];

    // 1. Try dedicated rider endpoint
    try {
      const response = await apiClient.get('/admin/riders', { params });
      const data = response.data?.data || response.data;
      if (Array.isArray(data?.riders)) list = data.riders;
      else if (Array.isArray(data)) list = data;
    } catch (err) {
      console.warn('Backend fetch riders notice:', err.message);
    }

    list = list.filter(
      (r) =>
        !accountRegistry.isEntityRemoved(r.id) &&
        !accountRegistry.isEntityRemoved(r.userId) &&
        r.user?.status !== 'DEACTIVATED' &&
        r.status !== 'DEACTIVATED'
    );

    // 2. Query /admin/users for RIDER role users
    try {
      const usersRes = await apiClient.get('/admin/users', { params: { limit: 100 } });
      const uData = usersRes.data?.data || usersRes.data;
      const allUsers = Array.isArray(uData?.users) ? uData.users : Array.isArray(uData) ? uData : [];
      const riderUsers = allUsers.filter(
        (u) =>
          (u.role?.name === 'RIDER' || u.role === 'RIDER' || u.riderProfile != null) &&
          u.status !== 'DEACTIVATED' &&
          !accountRegistry.isEntityRemoved(u.id) &&
          !accountRegistry.isEntityRemoved(u.riderProfile?.id)
      );

      riderUsers.forEach((u) => {
        if (!list.some((r) => r.id === u.id || r.userId === u.id || (u.phone && r.phone === u.phone))) {
          list.push({
            id: u.riderProfile?.id || u.id,
            userId: u.id,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone,
            vehicleType: u.riderProfile?.vehicleType || 'Motorcycle',
            vehicleNumber: u.riderProfile?.vehicleNumber || 'WB-01-AB-1234',
            licenseNumber: u.riderProfile?.licenseNumber || 'DL-WB-2023-8890',
            user: { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' },
            status: u.status || 'AVAILABLE',
            createdAt: u.createdAt,
          });
        }
      });
    } catch (err) {
      console.warn('Backend query users for riders notice:', err.message);
    }

    // 3. Include any rider registered in local registry
    const registryRiders = accountRegistry.getEntities().riders.filter(
      (rr) => !accountRegistry.isEntityRemoved(rr.id) && !accountRegistry.isEntityRemoved(rr.userId)
    );
    registryRiders.forEach((rr) => {
      if (!list.some((r) => r.id === rr.id || (rr.email && r.email === rr.email) || (rr.phone && r.phone === rr.phone))) {
        list.push(rr);
      }
    });

    return { riders: list, total: list.length };
  },

  async createRider(data) {
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
};

export default adminApi;
