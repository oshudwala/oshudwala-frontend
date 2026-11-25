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
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  const cleanEmail = email && email.includes('@') ? email.trim().toLowerCase() : `${roleName.toLowerCase()}.${cleanPhone}@oshudwala.local`;
  const cleanPassword = password || 'Password123';
  const cleanName = fullName ? fullName.trim() : 'User';

  // 1. First, check if a user with this phone or email already exists in PostgreSQL
  try {
    const listRes = await apiClient.get('/admin/users', { params: { limit: 500 } });
    const users = listRes.data?.data?.users || listRes.data?.data || listRes.data?.users || listRes.data || [];
    if (Array.isArray(users)) {
      const existing = users.find(
        (u) =>
          (cleanPhone && u.phone && String(u.phone).replace(/[^0-9]/g, '') === cleanPhone) ||
          (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
      );
      if (existing) {
        throw new Error('Already used credentials. This phone number or email is already assigned to another profile.');
      }
    }
  } catch (err) {
    if (err.message?.includes('Already used credentials')) {
      throw err;
    }
    console.warn('Backend list users pre-check notice:', err.message);
  }

  // 2. Check local account registry as well
  const regMatch = (cleanPhone && accountRegistry.findAccountByPhone(cleanPhone)) || (cleanEmail && accountRegistry.findAccountByEmail(cleanEmail));
  if (regMatch) {
    throw new Error('Already used credentials. This phone number or email is already assigned to another profile.');
  }

  // 3. Register brand new user via POST /api/v1/auth/register
  let userId = null;
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
    if (
      regError.response?.status === 400 ||
      regError.response?.status === 409 ||
      regError.response?.data?.message?.toLowerCase().includes('already exists') ||
      regError.response?.data?.message?.toLowerCase().includes('already registered')
    ) {
      throw new Error('Already used credentials. This phone number or email is already assigned to another profile.');
    }
    const errorMsg =
      regError.response?.data?.message ||
      (Array.isArray(regError.response?.data?.errors) && regError.response.data.errors[0]?.message) ||
      regError.message ||
      'Failed to register account in database.';
    throw new Error(errorMsg);
  }

  if (!userId) {
    throw new Error('Could not create user profile in database.');
  }

  // 4. Promote role to roleName (DOCTOR, RIDER, PHARMACY, RECEPTIONIST) using Super Admin's token
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

/**
 * Ensure image data URLs are compressed and lightweight before sending over HTTP
 * to prevent HTTP 413 (Content Too Large) errors from Render / Express.
 */
async function ensureOptimizedImageUrl(dataUrl, maxWidth = 480, maxHeight = 480, quality = 0.72) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;

  // Standard web links (http/https) are already short strings
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return dataUrl;
  }

  // If already under 35KB, it's safe to send
  if (dataUrl.startsWith('data:image') && dataUrl.length < 35 * 1024) {
    return dataUrl;
  }

  // Compress oversized base64 data URLs in browser
  if (dataUrl.startsWith('data:image') && typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      return await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          let compressed = canvas.toDataURL('image/jpeg', quality);
          if (compressed.length > 45 * 1024) {
            compressed = canvas.toDataURL('image/jpeg', 0.55);
          }
          resolve(compressed);
        };
        img.onerror = () => resolve(dataUrl.slice(0, 30000));
        img.src = dataUrl;
      });
    } catch {
      return dataUrl.slice(0, 30000);
    }
  }

  return dataUrl;
}

/**
 * Clean up image dictionaries so old uncompressed images (> 50KB) don't accumulate
 * and blow past the settings API request limit.
 */
function cleanImageMap(imgMap) {
  if (!imgMap || typeof imgMap !== 'object') return {};
  const cleaned = {};
  for (const [id, url] of Object.entries(imgMap)) {
    if (typeof url === 'string') {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        cleaned[id] = url;
      } else if (url.startsWith('data:image') && url.length < 50 * 1024) {
        cleaned[id] = url;
      }
    }
  }
  return cleaned;
}

// Clean up any bloated local storage entries from previous uncompressed uploads
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    ['oshud_facility_images', 'oshud_doctor_images'].forEach((storageKey) => {
      const raw = localStorage.getItem(storageKey);
      if (raw && raw.length > 80 * 1024) {
        try {
          const parsed = JSON.parse(raw);
          const cleaned = cleanImageMap(parsed);
          localStorage.setItem(storageKey, JSON.stringify(cleaned));
        } catch {}
      }
    });
  }
} catch {}

// In-memory cache for ultra-fast instant rendering
let cachedEntities = null;
let lastEntitiesFetch = 0;
const ENTITIES_CACHE_TTL = 15000; // 15 seconds

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));

const extractErrorMessage = (err, fallbackMessage = 'Operation failed') => {
  const data = err?.response?.data;
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    const errorDetails = data.errors
      .map((e) => (typeof e === 'string' ? e : e.message || (e.field ? `${e.field}: invalid` : '')))
      .filter(Boolean)
      .join(', ');
    if (errorDetails) return errorDetails;
  }
  if (data?.message) {
    return data.message;
  }
  return err?.message || fallbackMessage;
};

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

  // Validate whether phone or email is already assigned to ANY profile
  async validateCredentialsAvailable({
    phone,
    email,
    excludeId = null,
    excludeUserId = null,
    originalPhone = null,
    originalEmail = null,
  }) {
    const normalizePhone = (p) => {
      if (!p) return '';
      const digits = String(p).replace(/[^0-9]/g, '');
      return digits.length >= 10 ? digits.slice(-10) : digits;
    };

    const cleanPhone = normalizePhone(phone);
    const cleanEmail = email && typeof email === 'string' && email.includes('@') ? email.trim().toLowerCase() : '';
    let cleanOrigPhone = normalizePhone(originalPhone);
    let cleanOrigEmail = originalEmail && typeof originalEmail === 'string' && originalEmail.includes('@') ? originalEmail.trim().toLowerCase() : '';

    // If originalPhone / originalEmail was not passed, resolve from existing registered accounts
    if (excludeId || excludeUserId) {
      const getAcc = (accId) =>
        (accountRegistry.findAccountById && accountRegistry.findAccountById(accId)) ||
        (accountRegistry.findAccount && accountRegistry.findAccount(accId)) ||
        null;
      const localAcc = (excludeId && getAcc(excludeId)) || (excludeUserId && getAcc(excludeUserId));
      if (localAcc) {
        if (!cleanOrigPhone && localAcc.phone) cleanOrigPhone = normalizePhone(localAcc.phone);
        if (!cleanOrigEmail && localAcc.email) cleanOrigEmail = localAcc.email.trim().toLowerCase();
      }
    }

    // Determine if phone/email actually changed from existing values
    const shouldCheckPhone = Boolean(cleanPhone && cleanPhone.length === 10 && cleanPhone !== cleanOrigPhone);
    const shouldCheckEmail = Boolean(cleanEmail && cleanEmail !== cleanOrigEmail);

    // If neither phone nor email changed (e.g. updating name, fee, image, status), NO conflict check is needed!
    if (!shouldCheckPhone && !shouldCheckEmail) return true;

    // 1. Check in all loaded entities (doctors, pharmacies, clinics, riders, receptionists, users)
    const entities = await this.fetchAllEntities();
    const allProfiles = [
      ...(entities.doctors || []).map((d) => ({
        id: d.id,
        userId: d.userId,
        phone: d.phone || d.user?.phone,
        email: d.email || d.user?.email,
        name: d.fullName,
        role: 'Doctor',
      })),
      ...(entities.pharmacies || []).map((p) => ({
        id: p.id,
        userId: p.userId,
        phone: p.phone || p.owner?.phone,
        email: p.email || p.owner?.email,
        name: p.name,
        role: 'Pharmacy',
      })),
      ...(entities.clinics || []).map((c) => ({
        id: c.id,
        userId: c.userId,
        phone: c.phone || c.manager?.phone,
        email: c.email || c.manager?.email,
        name: c.name,
        role: 'Clinic',
      })),
      ...(entities.riders || []).map((r) => ({
        id: r.id,
        userId: r.userId,
        phone: r.phone || r.user?.phone,
        email: r.email || r.user?.email,
        name: r.fullName,
        role: 'Rider',
      })),
      ...(entities.receptionists || []).map((rc) => ({
        id: rc.id,
        userId: rc.userId,
        phone: rc.phone || rc.user?.phone,
        email: rc.email || rc.user?.email,
        name: rc.fullName,
        role: 'Receptionist',
      })),
      ...(entities.users || []).map((u) => ({
        id: u.id,
        userId: u.id,
        phone: u.phone,
        email: u.email,
        name: u.fullName,
        role: 'User',
      })),
    ];

    const isExcluded = (p) =>
      Boolean(
        (excludeId && (p.id === excludeId || p.userId === excludeId)) ||
        (excludeUserId && (p.id === excludeUserId || p.userId === excludeUserId)) ||
        (cleanOrigPhone && p.phone && normalizePhone(p.phone) === cleanOrigPhone) ||
        (cleanOrigEmail && p.email && p.email.trim().toLowerCase() === cleanOrigEmail) ||
        p.status === 'DEACTIVATED' ||
        p.status === 'CLOSED' ||
        accountRegistry.isEntityRemoved(p.id, p.userId)
      );

    if (shouldCheckPhone) {
      const phoneMatch = allProfiles.find(
        (p) =>
          !isExcluded(p) &&
          p.phone &&
          normalizePhone(p.phone) === cleanPhone
      );
      if (phoneMatch) {
        throw new Error(`Already used credentials. Mobile number is already assigned to another user.`);
      }
    }

    if (shouldCheckEmail) {
      const emailMatch = allProfiles.find(
        (p) =>
          !isExcluded(p) &&
          p.email &&
          p.email.trim().toLowerCase() === cleanEmail
      );
      if (emailMatch) {
        throw new Error(`Already used credentials. Email address is already assigned to another user.`);
      }
    }

    // 2. Double check directly with backend users list
    try {
      const usersRes = await apiClient.get('/admin/users', { params: { limit: 500 } });
      const backendUsers = usersRes.data?.data?.users || usersRes.data?.data || usersRes.data?.users || usersRes.data || [];
      if (Array.isArray(backendUsers)) {
        if (shouldCheckPhone) {
          const uPhoneMatch = backendUsers.find(
            (u) =>
              u.id !== excludeId &&
              u.id !== excludeUserId &&
              (!cleanOrigPhone || normalizePhone(u.phone) !== cleanOrigPhone) &&
              (!cleanOrigEmail || u.email?.trim().toLowerCase() !== cleanOrigEmail) &&
              u.status !== 'DEACTIVATED' &&
              !accountRegistry.isEntityRemoved(u.id) &&
              u.phone &&
              normalizePhone(u.phone) === cleanPhone
          );
          if (uPhoneMatch) {
            throw new Error(`Already used credentials. Mobile number is already assigned to another user.`);
          }
        }

        if (shouldCheckEmail) {
          const uEmailMatch = backendUsers.find(
            (u) =>
              u.id !== excludeId &&
              u.id !== excludeUserId &&
              (!cleanOrigPhone || normalizePhone(u.phone) !== cleanOrigPhone) &&
              (!cleanOrigEmail || u.email?.trim().toLowerCase() !== cleanOrigEmail) &&
              u.status !== 'DEACTIVATED' &&
              !accountRegistry.isEntityRemoved(u.id) &&
              u.email &&
              u.email.trim().toLowerCase() === cleanEmail
          );
          if (uEmailMatch) {
            throw new Error(`Already used credentials. Email address is already assigned to another user.`);
          }
        }
      }
    } catch (err) {
      if (err.message?.includes('Already used credentials')) {
        throw err;
      }
    }

    // 3. Double check with local accounts registry
    if (shouldCheckPhone) {
      const localPhoneMatch = accountRegistry.findAccountByPhone(cleanPhone);
      if (
        localPhoneMatch &&
        !accountRegistry.isEntityRemoved(localPhoneMatch.id, localPhoneMatch.userId) &&
        localPhoneMatch.status !== 'DEACTIVATED' &&
        localPhoneMatch.id !== excludeId &&
        localPhoneMatch.userId !== excludeUserId &&
        (!cleanOrigPhone || normalizePhone(localPhoneMatch.phone) !== cleanOrigPhone)
      ) {
        throw new Error(`Already used credentials. Mobile number is already assigned to another user.`);
      }
    }

    if (shouldCheckEmail) {
      const localEmailMatch = accountRegistry.findAccountByEmail(cleanEmail);
      if (
        localEmailMatch &&
        !accountRegistry.isEntityRemoved(localEmailMatch.id, localEmailMatch.userId) &&
        localEmailMatch.status !== 'DEACTIVATED' &&
        localEmailMatch.id !== excludeId &&
        localEmailMatch.userId !== excludeUserId &&
        (!cleanOrigEmail || localEmailMatch.email?.trim().toLowerCase() !== cleanOrigEmail)
      ) {
        throw new Error(`Already used credentials. Email address is already assigned to another user.`);
      }
    }

    return true;
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

    // Extract platform settings mappings
    const getSettingVal = (k) => {
      const s = Array.isArray(backendSettings) ? backendSettings.find((item) => item.key === k) : null;
      if (s?.value) return s.value;
      try {
        const raw = localStorage.getItem(`oshud_${k}`);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const featuredDocs = getSettingVal('featured_doctors') || [];
    const featuredClins = getSettingVal('featured_clinics') || [];
    const featuredPharms = getSettingVal('featured_pharmacies') || [];
    const doctorImages = getSettingVal('doctor_images') || {};
    const facilityImages = getSettingVal('facility_images') || {};

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

      const feePaise = bd.pharmacies?.[0]?.consultationFeePaise || bd.consultationFeePaise || localMatch?.consultationFeePaise || 50000;
      const specName = bd.specializations?.[0]?.specialization?.name || bd.specialization || 'General Physician';
      const userStatus = bd.user?.status || (bd.isVerified ? 'ACTIVE' : 'ACTIVE');

      const docImage =
        doctorImages[bd.id] ||
        (bd.userId && doctorImages[bd.userId]) ||
        bd.imageUrl ||
        bd.photoUrl ||
        localMatch?.imageUrl ||
        '';

      const isDocFeatured = Boolean(
        bd.isFeatured ||
        (Array.isArray(featuredDocs) && (featuredDocs.includes(bd.id) || (bd.userId && featuredDocs.includes(bd.userId)))) ||
        localMatch?.isFeatured
      );

      doctors.push({
        id: bd.id,
        userId: bd.userId || bd.user?.id || bd.id,
        fullName: bd.fullName || bd.name,
        email: bd.email || bd.user?.email || '',
        phone: bd.phone || bd.user?.phone || '',
        imageUrl: docImage,
        registrationNumber: bd.registrationNumber || 'WBMC-REG',
        qualifications: bd.qualifications || 'MBBS',
        experienceYears: bd.experienceYears || 5,
        specialization: specName,
        specializations: bd.specializations || [{ specialization: { name: specName } }],
        pharmacies: bd.pharmacies || [],
        consultationFeePaise: feePaise,
        status: userStatus,
        user: { id: bd.userId || bd.user?.id || bd.id, email: bd.email || bd.user?.email, phone: bd.phone || bd.user?.phone, status: userStatus },
        isFeatured: isDocFeatured,
      });

      seenDocIds.add(bd.id);
      if (bd.userId) seenDocIds.add(bd.userId);
      if (bd.user?.id) seenDocIds.add(bd.user.id);
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

      const docImage =
        doctorImages[u.id] ||
        u.imageUrl ||
        localMatch?.imageUrl ||
        '';

      const isDocFeatured = Boolean(
        (Array.isArray(featuredDocs) && featuredDocs.includes(u.id)) ||
        localMatch?.isFeatured
      );

      doctors.push({
        id: u.id,
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        imageUrl: docImage,
        registrationNumber: 'WBMC-REG',
        qualifications: 'MBBS',
        experienceYears: 5,
        specialization: 'General Physician',
        consultationFeePaise: localMatch?.consultationFeePaise || 50000,
        status: u.status || 'ACTIVE',
        user: { id: u.id, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' },
        isFeatured: isDocFeatured,
      });

      seenDocIds.add(u.id);
      if (cleanEmail) seenDocEmails.add(cleanEmail);
      if (cleanPhone) seenDocPhones.add(cleanPhone);
    });

    // 2. PHARMACIES (Backend first as source of truth - entities with medicine service)
    const pharmacies = [];
    const seenPharmIds = new Set();
    const seenPharmEmails = new Set();

    backendPharmacies.forEach((bp) => {
      if (isRemoved(bp.id, bp.ownerId)) return;
      // Single Entity rule: hasMedicineService !== false
      if (bp.hasMedicineService === false) return;

      const cleanEmail = bp.email ? bp.email.trim().toLowerCase() : '';
      const localMatch = local.pharmacies.find(
        (lp) => lp.id === bp.id || (cleanEmail && lp.email?.toLowerCase() === cleanEmail)
      );

      const ownerUser = bp.staff?.find((s) => s.staffRole === 'OWNER')?.user || {
        id: bp.id,
        fullName: bp.ownerName || bp.name,
        email: bp.email,
        phone: bp.phone,
        status: bp.status || 'ACTIVE',
      };

      const pharmImage =
        facilityImages[bp.id] ||
        bp.logoUrl ||
        bp.coverUrl ||
        bp.imageUrl ||
        localMatch?.imageUrl ||
        '';

      const isPharmFeatured = Boolean(
        bp.isFeatured ||
        (Array.isArray(featuredPharms) && featuredPharms.includes(bp.id)) ||
        localMatch?.isFeatured
      );

      pharmacies.push({
        id: bp.id,
        userId: bp.ownerId || ownerUser.id || bp.id,
        name: bp.name,
        email: bp.email || ownerUser.email || '',
        phone: bp.phone || ownerUser.phone || '',
        imageUrl: pharmImage,
        licenseNumber: bp.licenseNumber || 'WB-DL-REG',
        line1: bp.line1 || 'Main Road',
        city: bp.city || 'Kolkata',
        state: bp.state || 'West Bengal',
        pincode: bp.pincode || '700091',
        status: bp.status || 'ACTIVE',
        isPrimary: Boolean(bp.isPrimary),
        owner: ownerUser,
        staff: bp.staff || [{ staffRole: 'OWNER', user: ownerUser }],
        hasClinicService: Boolean(bp.hasClinicService),
        hasMedicineService: true,
        isFeatured: isPharmFeatured,
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

      const isPharmFeatured = Boolean(
        (Array.isArray(featuredPharms) && featuredPharms.includes(u.id)) ||
        localMatch?.isFeatured
      );

      pharmacies.push({
        id: u.id,
        userId: u.id,
        name: `${u.fullName} Pharmacy`,
        email: u.email,
        phone: u.phone,
        imageUrl: facilityImages[u.id] || localMatch?.imageUrl || '',
        licenseNumber: 'WB-DL-REG',
        line1: 'Sector V',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700091',
        status: u.status || 'ACTIVE',
        isPrimary: false,
        owner: { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone },
        staff: [{ staffRole: 'OWNER', user: { fullName: u.fullName, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' } }],
        hasClinicService: false,
        hasMedicineService: true,
        isFeatured: isPharmFeatured,
      });

      seenPharmIds.add(u.id);
      if (cleanEmail) seenPharmEmails.add(cleanEmail);
    });

    // 3. CLINICS (Registered clinics from backendPharmacies with clinic service or doctor chambers)
    // CRITICAL: There is NO separate Clinic entity in PostgreSQL. All clinics are Pharmacy rows with hasClinicService = true.
    // Delivery Locations (/locations) are geographic zones, NEVER clinics!
    const clinics = [];
    const seenClinicIds = new Set();
    const seenClinicEmails = new Set();

    backendPharmacies.forEach((bp) => {
      if (isRemoved(bp.id, bp.ownerId)) return;
      // Single Entity rule: hasClinicService = true OR has doctors assigned OR pure clinic facility
      const isClinicService = bp.hasClinicService || !bp.hasMedicineService || (bp.doctors && bp.doctors.length > 0);
      if (!isClinicService) return;
      
      const cleanEmail = bp.email ? bp.email.trim().toLowerCase() : '';
      const localMatch = local.clinics.find(
        (lc) => lc.id === bp.id || (cleanEmail && lc.email?.toLowerCase() === cleanEmail)
      );

      const receptionistStaff = bp.staff?.find((s) => s.staffRole === 'RECEPTIONIST')?.user;
      const managerUser = receptionistStaff || bp.staff?.find((s) => s.staffRole === 'OWNER')?.user || {
        id: bp.id,
        fullName: bp.ownerName || 'Front Desk',
        email: bp.email,
        phone: bp.phone,
        status: bp.status || 'ACTIVE',
      };

      const clinImage =
        facilityImages[bp.id] ||
        bp.logoUrl ||
        bp.coverUrl ||
        bp.imageUrl ||
        localMatch?.imageUrl ||
        '';

      const isClinFeatured = Boolean(
        bp.isFeatured ||
        (Array.isArray(featuredClins) && featuredClins.includes(bp.id)) ||
        localMatch?.isFeatured
      );

      clinics.push({
        id: bp.id,
        userId: managerUser.id || bp.ownerId || bp.id,
        name: bp.name,
        email: bp.email || managerUser.email || '',
        phone: bp.phone || managerUser.phone || '',
        imageUrl: clinImage,
        chamberCount: bp.settings?.chamberCount || localMatch?.chamberCount || '6 Chambers',
        line1: bp.line1 || 'Clinic Road',
        city: bp.city || 'Kolkata',
        state: bp.state || 'West Bengal',
        pincode: bp.pincode || '700064',
        status: bp.status || 'ACTIVE',
        isPrimary: Boolean(bp.isPrimary),
        manager: managerUser,
        receptionistName: receptionistStaff?.fullName || managerUser.fullName || 'Reception Desk',
        staff: bp.staff || [{ staffRole: 'RECEPTIONIST', user: managerUser }],
        doctors: bp.doctors || [],
        settings: { chamberCount: bp.settings?.chamberCount || '6 Chambers' },
        hasClinicService: true,
        hasMedicineService: Boolean(bp.hasMedicineService),
        isFeatured: isClinFeatured,
      });

      seenClinicIds.add(bp.id);
      if (cleanEmail) seenClinicEmails.add(cleanEmail);
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
        userId: br.userId || br.user?.id || br.id,
        fullName: br.user?.fullName || br.fullName || localMatch?.fullName || 'Rider',
        email: br.user?.email || br.email || localMatch?.email || '',
        phone: br.user?.phone || br.phone || localMatch?.phone || '',
        imageUrl: br.imageUrl || localMatch?.imageUrl || '',
        vehicleType: br.vehicleType || localMatch?.vehicleType || 'Motorcycle',
        vehicleNumber: br.vehicleNumber || localMatch?.vehicleNumber || 'WB-01-AB-1234',
        licenseNumber: br.licenseNumber || localMatch?.licenseNumber || 'DL-WB-Verified',
        user: { id: br.userId || br.user?.id || br.id, fullName: br.user?.fullName || br.fullName, email: br.user?.email || br.email, phone: br.user?.phone || br.phone, status: br.status || 'AVAILABLE' },
        status: br.status || 'AVAILABLE',
      });

      seenRiderIds.add(br.id);
      if (br.userId) seenRiderIds.add(br.userId);
      if (br.user?.id) seenRiderIds.add(br.user.id);
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
        imageUrl: u.imageUrl || localMatch?.imageUrl || '',
        vehicleType: localMatch?.vehicleType || 'Motorcycle',
        vehicleNumber: localMatch?.vehicleNumber || 'WB-01-AB-1234',
        licenseNumber: localMatch?.licenseNumber || 'DL-WB-Verified',
        user: { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' },
        status: u.status || 'AVAILABLE',
      });

      seenRiderIds.add(u.id);
      if (cleanPhone) seenRiderPhones.add(cleanPhone);
    });

    // 5. RECEPTIONISTS (Backend users & clinic staff)
    const receptionists = [];
    const seenRecIds = new Set();

    backendUsers.filter((u) => u.role?.name === 'RECEPTIONIST' || u.role === 'RECEPTIONIST').forEach((u) => {
      if (isRemoved(u.id)) return;
      const cleanPhone = u.phone ? String(u.phone).replace(/[^0-9]/g, '') : '';
      if (seenRecIds.has(u.id)) return;

      // Find which clinic they might belong to
      const linkedClinic = clinics.find((c) => c.manager?.id === u.id || (u.email && c.email === u.email));

      receptionists.push({
        id: u.id,
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        clinicName: linkedClinic?.name || 'Central Front Desk',
        clinicId: linkedClinic?.id || null,
        status: u.status || 'ACTIVE',
        user: { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, status: u.status || 'ACTIVE' },
      });

      seenRecIds.add(u.id);
    });

    // Also extract receptionists from pharmacy/clinic staff
    backendPharmacies.forEach((bp) => {
      (bp.staff || []).filter((s) => s.staffRole === 'RECEPTIONIST' && s.user).forEach((s) => {
        if (isRemoved(s.user.id) || seenRecIds.has(s.user.id)) return;
        receptionists.push({
          id: s.id || s.user.id,
          userId: s.user.id,
          fullName: s.user.fullName,
          email: s.user.email,
          phone: s.user.phone,
          clinicName: bp.name,
          clinicId: bp.id,
          status: s.isActive === false ? 'DEACTIVATED' : (s.user.status || 'ACTIVE'),
          user: s.user,
        });
        seenRecIds.add(s.user.id);
      });
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
      receptionists: receptionists.filter((rec) => !accountRegistry.isEntityRemoved(rec.id)).map(applyStatus),
      users: users.filter((u) => !accountRegistry.isEntityRemoved(u.id)).map(applyStatus),
      locations: backendLocations,
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

  // ================= LOCATIONS =================
  async getLocations(params = { page: 1, limit: 100 }) {
    try {
      const response = await apiClient.get('/locations', { params });
      const data = response.data?.data || response.data;
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      return { locations: items, total: data?.total || items.length };
    } catch (err) {
      console.warn('Backend getLocations notice:', err.message);
      const cached = this.getCachedEntities();
      return { locations: cached?.locations || [], total: (cached?.locations || []).length };
    }
  },

  async createLocation(data) {
    this.invalidateCache();
    const payload = {
      city: data.city ? data.city.trim() : 'Durgapur',
      area: data.area ? data.area.trim() : 'City Centre',
      state: data.state ? data.state.trim() : 'WB',
      pincode: data.pincode ? String(data.pincode).trim() : '713216',
    };

    let created = null;
    try {
      const res = await apiClient.post('/locations', payload);
      created = res.data?.data || res.data;
    } catch (err) {
      console.warn('POST /locations notice:', err.response?.data || err.message);
      created = {
        id: `loc_${Date.now()}`,
        ...payload,
        country: 'India',
        createdAt: new Date().toISOString(),
      };
    }

    return created;
  },

  async updateLocationStatus(id, isActive) {
    this.invalidateCache();
    try {
      const res = await apiClient.patch(`/locations/${id}/status`, { isActive });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('PATCH /locations/:id/status notice:', err.message);
      return { id, isActive };
    }
  },

  // ================= PROMOTIONS / HERO BANNERS =================
  async getPromotions(placement = 'HOME_TOP') {
    const normalizePromo = (p) => {
      if (!p) return p;
      let primaryText = p.buttonText || '';
      let primaryLink = p.buttonLink || '';
      let secondaryText = p.secondaryButtonText || '';
      let secondaryLink = p.secondaryButtonLink || '';

      if (!secondaryText && primaryLink && primaryLink.includes('||')) {
        const parts = primaryLink.split('||');
        primaryLink = parts[0] || '';
        secondaryText = parts[1] || '';
        secondaryLink = parts[2] || '';
      }

      return {
        ...p,
        buttonText: primaryText,
        buttonLink: primaryLink,
        secondaryButtonText: secondaryText,
        secondaryButtonLink: secondaryLink,
      };
    };

    try {
      const res = await apiClient.get('/promotions/admin');
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data.map(normalizePromo) : [];
    } catch (err) {
      console.warn('Backend getAdminPromotions notice:', err.message);
      try {
        const pubRes = await apiClient.get('/promotions', { params: placement ? { placement } : undefined });
        const pubData = pubRes.data?.data || pubRes.data || [];
        return Array.isArray(pubData) ? pubData.map(normalizePromo) : [];
      } catch {
        return [];
      }
    }
  },

  async createPromotion(data) {
    this.invalidateCache();
    const optimizedImage = await ensureOptimizedImageUrl(data.imageUrl || data.image);

    let buttonLink = data.buttonLink || data.ctaLink || null;
    const secondaryButtonText = data.secondaryButtonText || data.secondaryCtaText || null;
    const secondaryButtonLink = data.secondaryButtonLink || data.secondaryCtaLink || null;

    if (secondaryButtonText && buttonLink && !buttonLink.includes('||')) {
      buttonLink = `${buttonLink}||${secondaryButtonText}||${secondaryButtonLink || ''}`;
    }

    const payload = {
      heading: String(data.heading || data.headline || '').trim(),
      paragraph: data.paragraph !== undefined ? data.paragraph : (data.subtext ? String(data.subtext).trim() : null),
      imageUrl: optimizedImage || String(data.imageUrl || data.image || '').trim(),
      buttonText: data.buttonText || data.ctaText || null,
      buttonLink: buttonLink,
      secondaryButtonText: secondaryButtonText,
      secondaryButtonLink: secondaryButtonLink,
      couponCode: data.couponCode ? String(data.couponCode).trim().toUpperCase() : (data.badge ? String(data.badge).trim().toUpperCase() : null),
      placement: data.placement ? String(data.placement).trim() : 'HOME_TOP',
      sortOrder: Math.max(0, parseInt(data.sortOrder, 10) || 0),
      isActive: data.isActive !== false,
      validFrom: data.validFrom || null,
      validTo: data.validTo || null,
    };

    let created = null;
    try {
      const res = await apiClient.post('/promotions', payload);
      created = res.data?.data || res.data;
    } catch (err) {
      if (err.response?.status === 413) {
        payload.imageUrl = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=1200';
        const retryRes = await apiClient.post('/promotions', payload);
        created = retryRes.data?.data || retryRes.data;
      } else {
        const detail = extractErrorMessage(err, 'Failed to create promotion banner');
        throw new Error(detail);
      }
    }
    return created;
  },

  async updatePromotion(id, data) {
    this.invalidateCache();
    const payload = {};
    if (data.heading !== undefined || data.headline !== undefined) payload.heading = String(data.heading || data.headline || '').trim();
    if (data.paragraph !== undefined || data.subtext !== undefined) payload.paragraph = data.paragraph !== undefined ? data.paragraph : (data.subtext ? String(data.subtext).trim() : null);
    if (data.imageUrl !== undefined || data.image !== undefined) {
      payload.imageUrl = await ensureOptimizedImageUrl(data.imageUrl || data.image);
    }

    let buttonLink = data.buttonLink !== undefined ? data.buttonLink : (data.ctaLink || null);
    const secondaryButtonText = data.secondaryButtonText !== undefined ? data.secondaryButtonText : (data.secondaryCtaText || null);
    const secondaryButtonLink = data.secondaryButtonLink !== undefined ? data.secondaryButtonLink : (data.secondaryCtaLink || null);

    if (secondaryButtonText && buttonLink && !buttonLink.includes('||')) {
      buttonLink = `${buttonLink}||${secondaryButtonText}||${secondaryButtonLink || ''}`;
    }

    if (data.buttonText !== undefined || data.ctaText !== undefined) payload.buttonText = data.buttonText || data.ctaText || null;
    if (buttonLink !== undefined) payload.buttonLink = buttonLink;
    if (secondaryButtonText !== undefined) payload.secondaryButtonText = secondaryButtonText;
    if (secondaryButtonLink !== undefined) payload.secondaryButtonLink = secondaryButtonLink;
    if (data.couponCode !== undefined || data.badge !== undefined) {
      payload.couponCode = data.couponCode !== undefined ? (data.couponCode ? String(data.couponCode).trim().toUpperCase() : null) : (data.badge ? String(data.badge).trim().toUpperCase() : null);
    }
    if (data.placement !== undefined) payload.placement = String(data.placement).trim();
    if (data.sortOrder !== undefined) payload.sortOrder = Math.max(0, parseInt(data.sortOrder, 10) || 0);
    if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);
    if (data.validFrom !== undefined) payload.validFrom = data.validFrom;
    if (data.validTo !== undefined) payload.validTo = data.validTo;

    const res = await apiClient.put(`/promotions/${id}`, payload);
    return res.data?.data || res.data;
  },

  async deletePromotion(id) {
    this.invalidateCache();
    const res = await apiClient.delete(`/promotions/${id}`);
    return res.data?.data || res.data;
  },

  // ================= COUPONS & PROMO CODES =================
  async getCoupons() {
    try {
      const res = await apiClient.get('/coupons');
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn('Backend getCoupons notice:', err.message);
      return [];
    }
  },

  async createCoupon(data) {
    this.invalidateCache();
    const payload = {
      code: String(data.code || '').trim().toUpperCase(),
      description: data.description ? String(data.description).trim() : null,
      discountType: data.discountType || 'PERCENT',
      discountValue: parseInt(data.discountValue, 10),
      maxDiscountPaise: data.maxDiscountPaise ? parseInt(data.maxDiscountPaise, 10) : null,
      minOrderPaise: data.minOrderPaise ? parseInt(data.minOrderPaise, 10) : 0,
      validFrom: data.validFrom ? new Date(data.validFrom).toISOString() : new Date().toISOString(),
      validTo: data.validTo ? new Date(data.validTo).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
      usageLimitTotal: data.usageLimitTotal ? parseInt(data.usageLimitTotal, 10) : null,
      usageLimitPerUser: data.usageLimitPerUser ? parseInt(data.usageLimitPerUser, 10) : 1,
      isActive: data.isActive !== false,
    };

    const res = await apiClient.post('/coupons', payload);
    return res.data?.data || res.data;
  },

  async updateCoupon(id, data) {
    this.invalidateCache();
    const payload = {};
    if (data.description !== undefined) payload.description = data.description ? String(data.description).trim() : null;
    if (data.maxDiscountPaise !== undefined) payload.maxDiscountPaise = data.maxDiscountPaise ? parseInt(data.maxDiscountPaise, 10) : null;
    if (data.minOrderPaise !== undefined) payload.minOrderPaise = parseInt(data.minOrderPaise, 10) || 0;
    if (data.validTo !== undefined && data.validTo) payload.validTo = new Date(data.validTo).toISOString();
    if (data.usageLimitTotal !== undefined) payload.usageLimitTotal = data.usageLimitTotal ? parseInt(data.usageLimitTotal, 10) : null;
    if (data.usageLimitPerUser !== undefined) payload.usageLimitPerUser = parseInt(data.usageLimitPerUser, 10) || 1;
    if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive);

    const res = await apiClient.put(`/coupons/${id}`, payload);
    return res.data?.data || res.data;
  },

  async updateCouponStatus(id, isActive) {
    this.invalidateCache();
    try {
      const res = await apiClient.patch(`/coupons/${id}/status`, { isActive });
      return res.data?.data || res.data;
    } catch {
      const res = await apiClient.put(`/coupons/${id}`, { isActive });
      return res.data?.data || res.data;
    }
  },

  // ================= SPECIALIZATIONS =================
  async getSpecializations() {
    try {
      const response = await apiClient.get('/specializations');
      const data = response.data?.data || response.data;
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      return items;
    } catch (err) {
      console.warn('Backend getSpecializations notice:', err.message);
      return [];
    }
  },

  async createSpecialization(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return null;
    try {
      const res = await apiClient.post('/specializations', { name: trimmed });
      return res.data?.data || res.data;
    } catch (err) {
      console.warn('POST /specializations notice:', err.response?.data || err.message);
      return { id: `spec_${Date.now()}`, name: trimmed };
    }
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
    const cleanPhone = String(data.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('Valid 10-digit phone number is required');
    }
    const validEmail = (data.email && data.email.includes('@'))
      ? data.email.trim().toLowerCase()
      : `dr.${cleanPhone || Date.now()}@oshudwala.local`;

    if (data.password && data.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    const doctorPassword = (data.password && data.password.length >= 8) ? data.password : 'Doctor123';

    // 0. Strict check across all profiles and backend database
    await this.validateCredentialsAvailable({ phone: cleanPhone, email: validEmail });

    // Ensure image payload is optimized to prevent HTTP 413 Content Too Large
    const optimizedImage = await ensureOptimizedImageUrl(data.imageUrl);

    // 1. First register user credentials in database with role DOCTOR
    let registeredUser = null;
    try {
      registeredUser = await registerUserInDatabase({
        fullName: data.fullName,
        phone: cleanPhone,
        email: validEmail,
        password: doctorPassword,
        roleName: 'DOCTOR',
      });
    } catch (e) {
      if (e.message && e.message.includes('Already used credentials')) {
        throw e;
      }
      console.warn('Doctor user registration notice:', e.message);
    }

    // 2. Fetch or create Specialization in PostgreSQL
    let specializationId = data.specializationId || (Array.isArray(data.specializationIds) ? data.specializationIds[0] : null);
    if (!specializationId) {
      try {
        const specRes = await apiClient.get('/specializations');
        const specs = specRes.data?.data || specRes.data || [];
        const specName = (data.specialization || 'General Physician').toLowerCase();
        const match = Array.isArray(specs) ? specs.find((s) => s.name?.toLowerCase() === specName) : null;
        if (match?.id) {
          specializationId = match.id;
        } else if (Array.isArray(specs) && specs.length > 0) {
          specializationId = specs[0].id;
        } else {
          const createSpecRes = await apiClient.post('/specializations', { name: data.specialization || 'General Physician' });
          specializationId = createSpecRes.data?.data?.id || createSpecRes.data?.id;
        }
      } catch (specErr) {
        console.warn('Specialization lookup notice:', specErr.message);
      }
    }

    // 3. Create Doctor directory record in database via POST /doctors
    let createdDoctor = null;
    try {
      const doctorPayload = {
        fullName: data.fullName,
        phone: cleanPhone || undefined,
        email: validEmail || undefined,
        registrationNumber: data.registrationNumber || `WBMC-${Date.now().toString().slice(-6)}`,
        qualifications: data.qualifications || 'MBBS',
        experienceYears: Number(data.experienceYears) || 5,
        bio: data.bio || '',
        languages: data.languages || ['English', 'Bengali', 'Hindi'],
        specializationIds: specializationId ? [specializationId] : [],
        isVerified: true,
        ...(registeredUser?.userId ? { userId: registeredUser.userId } : {}),
      };

      const docRes = await apiClient.post('/doctors', doctorPayload);
      createdDoctor = docRes.data?.data || docRes.data;
    } catch (docErr) {
      console.warn('POST /doctors notice:', docErr.response?.data || docErr.message);
    }

    // 4. If clinicId specified, assign doctor to clinic
    if (data.clinicId && createdDoctor?.id) {
      try {
        await apiClient.post('/doctors/assign', {
          pharmacyId: data.clinicId,
          doctorId: createdDoctor.id,
          consultationFeePaise: Number(data.consultationFeePaise) || 50000,
        });
      } catch (assignErr) {
        console.warn('Auto-assign to clinic notice:', assignErr.message);
      }
    }

    const doctorId = createdDoctor?.id || registeredUser?.userId || `doc_${Date.now()}`;
    const userId = registeredUser?.userId || createdDoctor?.userId || doctorId;

    // Persist doctor custom image in platform settings if provided
    const finalDoctorImage = optimizedImage || data.imageUrl;
    if (finalDoctorImage) {
      try {
        const curSettings = await this.getSettings();
        const curImages = cleanImageMap(curSettings?.find?.((s) => s.key === 'doctor_images')?.value || {});
        const updatedImages = { ...curImages, [doctorId]: finalDoctorImage };
        if (userId) updatedImages[userId] = finalDoctorImage;
        await this.setSetting('doctor_images', updatedImages);
        localStorage.setItem('oshud_doctor_images', JSON.stringify(updatedImages));
      } catch (imgErr) {
        console.warn('Persist doctor image notice:', imgErr.message);
      }
    }

    // Persist isFeatured if flagged
    if (data.isFeatured) {
      try {
        const curSettings = await this.getSettings();
        const curFeatured = curSettings?.find?.((s) => s.key === 'featured_doctors')?.value || [];
        const updatedList = Array.isArray(curFeatured) ? [...curFeatured] : [];
        if (!updatedList.includes(doctorId)) updatedList.push(doctorId);
        await this.setSetting('featured_doctors', updatedList);
        localStorage.setItem('oshud_featured_doctors', JSON.stringify(updatedList));
      } catch {}
    }

    // 5. Register in accountRegistry for immediate offline access
    accountRegistry.registerAccount({
      id: doctorId,
      fullName: data.fullName,
      email: validEmail,
      phone: cleanPhone,
      password: data.password || 'Doctor123',
      role: 'DOCTOR',
      imageUrl: finalDoctorImage || '',
      isFeatured: Boolean(data.isFeatured),
      entityData: {
        registrationNumber: data.registrationNumber || 'WBMC-REG',
        qualifications: data.qualifications || 'MBBS',
        experienceYears: Number(data.experienceYears) || 5,
        specialization: data.specialization || 'General Physician',
        consultationFeePaise: Number(data.consultationFeePaise) || 50000,
        imageUrl: finalDoctorImage || '',
        isFeatured: Boolean(data.isFeatured),
      },
    });

    this.invalidateCache();
    return {
      ...(createdDoctor || {}),
      id: doctorId,
      userId: userId,
      fullName: data.fullName,
      email: validEmail,
      phone: cleanPhone,
      imageUrl: data.imageUrl || createdDoctor?.imageUrl || '',
      registrationNumber: data.registrationNumber || 'WBMC-REG',
      qualifications: data.qualifications || 'MBBS',
      experienceYears: data.experienceYears || 5,
      specialization: data.specialization || 'General Physician',
      consultationFeePaise: Number(data.consultationFeePaise) || 50000,
      user: { id: userId, email: validEmail, phone: cleanPhone, status: 'ACTIVE' },
      status: 'ACTIVE',
      isFeatured: Boolean(data.isFeatured),
      createdAt: new Date().toISOString(),
    };
  },

  async deleteDoctor(id, userId) {
    this.invalidateCache();
    const targetUserId = userId || id;
    try {
      await apiClient.delete(`/admin/users/${targetUserId}`);
    } catch (e) {
      console.warn('Backend delete doctor user notice:', e.message);
      try {
        await apiClient.put(`/admin/users/${targetUserId}/access`, {
          roleName: 'DOCTOR',
          status: 'DEACTIVATED',
        });
      } catch {}
    }

    accountRegistry.removeAccount(id);
    accountRegistry.removeAccount(targetUserId);
    accountRegistry.markEntityRemoved(id);
    accountRegistry.markEntityRemoved(targetUserId);

    try {
      const curSettings = await this.getSettings();
      const curImages = cleanImageMap(curSettings?.find?.((s) => s.key === 'doctor_images')?.value || {});
      if (curImages[id] || (targetUserId && curImages[targetUserId])) {
        delete curImages[id];
        if (targetUserId) delete curImages[targetUserId];
        await this.setSetting('doctor_images', curImages);
        localStorage.setItem('oshud_doctor_images', JSON.stringify(curImages));
      }
      const curFeatured = curSettings?.find?.((s) => s.key === 'featured_doctors')?.value || [];
      if (Array.isArray(curFeatured) && (curFeatured.includes(id) || curFeatured.includes(targetUserId))) {
        const updated = curFeatured.filter((fid) => fid !== id && fid !== targetUserId);
        await this.setSetting('featured_doctors', updated);
        localStorage.setItem('oshud_featured_doctors', JSON.stringify(updated));
      }
    } catch {}

    this.invalidateCache();
    return { success: true, id };
  },

  // ================= PHARMACIES =================
  async createPharmacy(data) {
    this.invalidateCache();
    const cleanPhone = String(data.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('Valid 10-digit phone number is required');
    }
    const validEmail = (data.email && data.email.includes('@'))
      ? data.email.trim().toLowerCase()
      : `pharmacy.${cleanPhone || Date.now()}@oshudwala.local`;

    if (data.password && data.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    const ownerPassword = (data.password && data.password.length >= 8) ? data.password : 'Pharmacy123';

    // 0. Strict check across all profiles and backend database
    await this.validateCredentialsAvailable({ phone: cleanPhone, email: validEmail });

    // Optimize image payload to prevent HTTP 413 Content Too Large
    const optimizedImage = await ensureOptimizedImageUrl(data.imageUrl);

    // 1. Get or find active Location ID from PostgreSQL
    let locationId = isUUID(data.locationId) ? data.locationId : null;
    if (!locationId) {
      try {
        const locRes = await apiClient.get('/locations');
        const locs = locRes.data?.data?.items || locRes.data?.data || locRes.data || [];
        if (Array.isArray(locs) && locs.length > 0) {
          const activeLocs = locs.filter((l) => l.isActive !== false);
          const pool = activeLocs.length > 0 ? activeLocs : locs;
          const match = pool.find((l) => (data.city && l.city?.toLowerCase() === data.city.toLowerCase()) || (data.pincode && l.pincode === data.pincode));
          locationId = match ? match.id : pool[0].id;
        }
      } catch (locErr) {
        console.warn('Locations lookup notice:', locErr.message);
      }
    }

    // Auto-create location if still not found
    if (!locationId) {
      try {
        const rawPin = String(data.pincode || '').replace(/[^0-9]/g, '');
        const validPin = rawPin.length === 6 ? rawPin : '713216';
        const createLocRes = await apiClient.post('/locations', {
          city: (data.city || 'Durgapur').trim().slice(0, 80),
          area: (data.line1 || data.address || 'City Centre').trim().slice(0, 80),
          state: (data.state || 'WB').trim().slice(0, 80),
          pincode: validPin,
        });
        const locData = createLocRes.data?.data || createLocRes.data;
        if (locData?.id && isUUID(locData.id)) {
          locationId = locData.id;
        }
      } catch (clErr) {
        console.warn('Create location notice:', clErr.message);
      }
    }

    if (!locationId) {
      try {
        const allLocRes = await apiClient.get('/locations');
        const allItems = allLocRes.data?.data?.items || allLocRes.data?.data || [];
        if (allItems[0]?.id) locationId = allItems[0].id;
      } catch {}
    }

    // 2. Call backend POST /pharmacies/admin-create
    let createdPharmacy = null;
    const hasClinicService = Boolean(data.hasClinicService);
    const hasMedicineService = data.hasMedicineService !== false;

    try {
      const resp = await apiClient.post('/pharmacies/admin-create', {
        name: String(data.name || '').trim(),
        ownerName: String(data.ownerName || data.fullName || data.name || 'Pharmacy Owner').trim(),
        ownerEmail: validEmail,
        ownerPassword: ownerPassword,
        phone: cleanPhone,
        locationId: locationId,
        line1: String(data.line1 || data.address || 'Main Road').trim(),
        line2: data.line2 ? String(data.line2).trim() : null,
        isPrimary: Boolean(data.isPrimary),
        hasClinicService,
        hasMedicineService,
        logoUrl: optimizedImage || null,
        isFeatured: Boolean(data.isFeatured),
      });
      createdPharmacy = resp.data?.data || resp.data;
    } catch (phErr) {
      // If 413 Payload Too Large occurred despite compression, auto-retry with logoUrl: null
      if (phErr.response?.status === 413 && optimizedImage) {
        try {
          const retryResp = await apiClient.post('/pharmacies/admin-create', {
            name: String(data.name || '').trim(),
            ownerName: String(data.ownerName || data.fullName || data.name || 'Pharmacy Owner').trim(),
            ownerEmail: validEmail,
            ownerPassword: ownerPassword,
            phone: cleanPhone,
            locationId: locationId,
            line1: String(data.line1 || data.address || 'Main Road').trim(),
            line2: data.line2 ? String(data.line2).trim() : null,
            isPrimary: Boolean(data.isPrimary),
            hasClinicService,
            hasMedicineService,
            logoUrl: null,
            isFeatured: Boolean(data.isFeatured),
          });
          createdPharmacy = retryResp.data?.data || retryResp.data;
        } catch (retryErr) {
          phErr = retryErr;
        }
      }

      if (!createdPharmacy) {
        if (
          phErr.response?.status === 409 ||
          phErr.response?.data?.message?.toLowerCase().includes('already')
        ) {
          throw new Error('Already used credentials. This phone number or email is already assigned to another profile.');
        }
        if (phErr.response?.status === 400) {
          const detail = extractErrorMessage(phErr, 'Validation error creating pharmacy profile.');
          throw new Error(detail);
        }
        const errMsg = extractErrorMessage(phErr, 'Failed to create pharmacy profile in database.');
        throw new Error(errMsg);
      }
    }

    const pharmacyId = createdPharmacy?.id || `pharm_${Date.now()}`;
    const ownerId = createdPharmacy?.owner?.id || createdPharmacy?.ownerId || pharmacyId;
    const finalPharmacyImage = optimizedImage || data.imageUrl;

    // 3. Ensure service flags and media are synced on backend
    if (createdPharmacy?.id) {
      try {
        await apiClient.put(`/pharmacies/${createdPharmacy.id}/services`, {
          hasClinicService,
          hasMedicineService,
        });
      } catch (svcErr) {
        console.warn('Sync pharmacy services notice:', svcErr.message);
      }

      if (finalPharmacyImage) {
        try {
          await apiClient.put(`/pharmacies/${createdPharmacy.id}/media`, {
            logoUrl: finalPharmacyImage,
          });
        } catch (mErr) {
          console.warn('Sync pharmacy media notice:', mErr.message);
        }
      }
    }

    // 4. Persist facility image and isFeatured in settings
    if (finalPharmacyImage) {
      try {
        const curSettings = await this.getSettings();
        const curImages = cleanImageMap(curSettings?.find?.((s) => s.key === 'facility_images')?.value || {});
        const updatedImages = { ...curImages, [pharmacyId]: finalPharmacyImage };
        await this.setSetting('facility_images', updatedImages);
        localStorage.setItem('oshud_facility_images', JSON.stringify(updatedImages));
      } catch {}
    }

    if (data.isFeatured) {
      try {
        const curSettings = await this.getSettings();
        const curFeatured = curSettings?.find?.((s) => s.key === 'featured_pharmacies')?.value || [];
        const updatedList = Array.isArray(curFeatured) ? [...curFeatured] : [];
        if (!updatedList.includes(pharmacyId)) updatedList.push(pharmacyId);
        await this.setSetting('featured_pharmacies', updatedList);
        localStorage.setItem('oshud_featured_pharmacies', JSON.stringify(updatedList));
      } catch {}
    }

    // 5. Register in accountRegistry
    accountRegistry.registerAccount({
      id: pharmacyId,
      userId: ownerId,
      fullName: data.ownerName || data.name,
      email: validEmail,
      phone: cleanPhone,
      password: ownerPassword,
      role: 'PHARMACY',
      imageUrl: finalPharmacyImage || '',
      isFeatured: Boolean(data.isFeatured),
      hasClinicService,
      hasMedicineService,
      entityData: {
        name: data.name,
        licenseNumber: data.licenseNumber || 'WB-DL-REG',
        line1: data.line1 || data.address,
        city: data.city || 'Kolkata',
        state: data.state || 'West Bengal',
        pincode: data.pincode || '700091',
        imageUrl: data.imageUrl || '',
        isFeatured: Boolean(data.isFeatured),
        hasClinicService,
        hasMedicineService,
      },
    });

    this.invalidateCache();
    return {
      ...(createdPharmacy || {}),
      id: pharmacyId,
      userId: ownerId,
      name: data.name,
      email: validEmail,
      phone: cleanPhone,
      imageUrl: data.imageUrl || createdPharmacy?.logoUrl || '',
      licenseNumber: data.licenseNumber || 'WB-DL-REG',
      line1: data.line1 || data.address,
      city: data.city || 'Kolkata',
      state: data.state || 'West Bengal',
      pincode: data.pincode || '700091',
      status: 'ACTIVE',
      isPrimary: Boolean(data.isPrimary),
      isFeatured: Boolean(data.isFeatured),
      hasClinicService,
      hasMedicineService,
      owner: { id: ownerId, fullName: data.ownerName || data.name, email: validEmail, phone: cleanPhone },
      staff: [{ staffRole: 'OWNER', user: { fullName: data.ownerName || data.name, email: validEmail, phone: cleanPhone, status: 'ACTIVE' } }],
      createdAt: new Date().toISOString(),
    };
  },

  async deletePharmacy(id, userId) {
    this.invalidateCache();
    const targetUserId = userId || id;

    // 1. Delete from pharmacies table & cascade staff user delete
    try {
      await apiClient.delete(`/pharmacies/${id}`);
    } catch (phErr) {
      console.warn('Backend delete pharmacy notice:', phErr.response?.data || phErr.message);
      try {
        await apiClient.put(`/pharmacies/admin-update/${id}`, { status: 'CLOSED' });
      } catch {}
    }

    // 2. Also ensure target user is removed from database users table
    if (targetUserId && targetUserId !== id) {
      try {
        await apiClient.delete(`/admin/users/${targetUserId}`);
      } catch (e) {
        console.warn('Backend delete pharmacy user notice:', e.message);
      }
    }

    // 3. Purge from local registry
    accountRegistry.removeAccount(id);
    accountRegistry.removeAccount(targetUserId);
    accountRegistry.markEntityRemoved(id);
    accountRegistry.markEntityRemoved(targetUserId);

    // 4. Remove from settings image map and featured list
    try {
      const curSettings = await this.getSettings();
      const curImages = cleanImageMap(curSettings?.find?.((s) => s.key === 'facility_images')?.value || {});
      if (curImages[id]) {
        delete curImages[id];
        await this.setSetting('facility_images', curImages);
        localStorage.setItem('oshud_facility_images', JSON.stringify(curImages));
      }
      const curFeatured = curSettings?.find?.((s) => s.key === 'featured_pharmacies')?.value || [];
      if (Array.isArray(curFeatured) && curFeatured.includes(id)) {
        const updated = curFeatured.filter((fid) => fid !== id);
        await this.setSetting('featured_pharmacies', updated);
        localStorage.setItem('oshud_featured_pharmacies', JSON.stringify(updated));
      }
    } catch {}

    this.invalidateCache();
    return { success: true, id };
  },

  // ================= CLINICS =================
  async createClinic(data) {
    this.invalidateCache();
    const cleanPhone = String(data.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('Valid 10-digit phone number is required');
    }
    const validEmail = (data.email && data.email.includes('@'))
      ? data.email.trim().toLowerCase()
      : `clinic.${cleanPhone || Date.now()}@oshudwala.local`;

    if (data.password && data.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    const ownerPassword = (data.password && data.password.length >= 8) ? data.password : 'Clinic123';

    // 0. Strict check across all profiles and backend database
    await this.validateCredentialsAvailable({ phone: cleanPhone, email: validEmail });

    // Optimize image payload to prevent HTTP 413 Content Too Large
    const optimizedImage = await ensureOptimizedImageUrl(data.imageUrl);

    // 1. Get or find active Location ID from PostgreSQL
    let locationId = isUUID(data.locationId) ? data.locationId : null;
    if (!locationId) {
      try {
        const locRes = await apiClient.get('/locations');
        const locs = locRes.data?.data?.items || locRes.data?.data || locRes.data || [];
        if (Array.isArray(locs) && locs.length > 0) {
          const activeLocs = locs.filter((l) => l.isActive !== false);
          const pool = activeLocs.length > 0 ? activeLocs : locs;
          const match = pool.find((l) => (data.city && l.city?.toLowerCase() === data.city.toLowerCase()) || (data.pincode && l.pincode === data.pincode));
          locationId = match ? match.id : pool[0].id;
        }
      } catch (locErr) {
        console.warn('Locations lookup notice:', locErr.message);
      }
    }

    // Auto-create location if still not found
    if (!locationId) {
      try {
        const rawPin = String(data.pincode || '').replace(/[^0-9]/g, '');
        const validPin = rawPin.length === 6 ? rawPin : '713216';
        const createLocRes = await apiClient.post('/locations', {
          city: (data.city || 'Durgapur').trim().slice(0, 80),
          area: (data.line1 || data.address || 'City Centre').trim().slice(0, 80),
          state: (data.state || 'WB').trim().slice(0, 80),
          pincode: validPin,
        });
        const locData = createLocRes.data?.data || createLocRes.data;
        if (locData?.id && isUUID(locData.id)) {
          locationId = locData.id;
        }
      } catch (clErr) {
        console.warn('Create location notice:', clErr.message);
      }
    }

    if (!locationId) {
      try {
        const allLocRes = await apiClient.get('/locations');
        const allItems = allLocRes.data?.data?.items || allLocRes.data?.data || [];
        if (allItems[0]?.id) locationId = allItems[0].id;
      } catch {}
    }

    // 2. Call backend POST /pharmacies/admin-create
    let createdClinic = null;
    const hasClinicService = true;
    const hasMedicineService = Boolean(data.hasMedicineService);

    try {
      const resp = await apiClient.post('/pharmacies/admin-create', {
        name: String(data.name || '').trim(),
        ownerName: String(data.managerName || data.fullName || data.name || 'Clinic Admin').trim(),
        ownerEmail: validEmail,
        ownerPassword: ownerPassword,
        phone: cleanPhone,
        locationId: locationId,
        line1: String(data.line1 || data.address || 'Clinic Road').trim(),
        line2: data.line2 ? String(data.line2).trim() : null,
        isPrimary: false,
        hasClinicService: true,
        hasMedicineService,
        logoUrl: optimizedImage || null,
        isFeatured: Boolean(data.isFeatured),
      });
      createdClinic = resp.data?.data || resp.data;
    } catch (err) {
      // If 413 Payload Too Large occurred despite compression, auto-retry with logoUrl: null
      if (err.response?.status === 413 && optimizedImage) {
        try {
          const retryResp = await apiClient.post('/pharmacies/admin-create', {
            name: String(data.name || '').trim(),
            ownerName: String(data.managerName || data.fullName || data.name || 'Clinic Admin').trim(),
            ownerEmail: validEmail,
            ownerPassword: ownerPassword,
            phone: cleanPhone,
            locationId: locationId,
            line1: String(data.line1 || data.address || 'Clinic Road').trim(),
            line2: data.line2 ? String(data.line2).trim() : null,
            isPrimary: false,
            hasClinicService: true,
            hasMedicineService,
            logoUrl: null,
            isFeatured: Boolean(data.isFeatured),
          });
          createdClinic = retryResp.data?.data || retryResp.data;
        } catch (retryErr) {
          err = retryErr;
        }
      }

      if (!createdClinic) {
        if (
          err.response?.status === 409 ||
          err.response?.data?.message?.toLowerCase().includes('already')
        ) {
          throw new Error('Already used credentials. This phone number or email is already assigned to another profile.');
        }
        if (err.response?.status === 400) {
          const detail = extractErrorMessage(err, 'Validation error creating clinic profile.');
          throw new Error(detail);
        }
        const errMsg = extractErrorMessage(err, 'Failed to create clinic profile in database.');
        throw new Error(errMsg);
      }
    }

    const clinicId = createdClinic?.id || `clinic_${Date.now()}`;
    const managerId = createdClinic?.owner?.id || createdClinic?.ownerId || clinicId;
    const finalClinicImage = optimizedImage || data.imageUrl;

    // 3. Ensure service flags and media are synced on backend
    if (createdClinic?.id) {
      try {
        await apiClient.put(`/pharmacies/${createdClinic.id}/services`, {
          hasClinicService: true,
          hasMedicineService,
        });
      } catch (svcErr) {
        console.warn('Enable clinic service notice:', svcErr.message);
      }

      if (finalClinicImage) {
        try {
          await apiClient.put(`/pharmacies/${createdClinic.id}/media`, {
            logoUrl: finalClinicImage,
          });
        } catch (mErr) {
          console.warn('Sync clinic media notice:', mErr.message);
        }
      }

      // Update owner's database role to RECEPTIONIST so clinic desk endpoints are directly accessible
      if (createdClinic?.owner?.id) {
        try {
          await apiClient.put(`/admin/users/${createdClinic.owner.id}/access`, {
            roleName: 'RECEPTIONIST',
          });
        } catch (accErr) {
          console.warn('Sync clinic owner access notice:', accErr.message);
        }
      }
    }

    // Persist facility image and isFeatured in settings
    if (finalClinicImage) {
      try {
        const curSettings = await this.getSettings();
        const curImages = cleanImageMap(curSettings?.find?.((s) => s.key === 'facility_images')?.value || {});
        const updatedImages = { ...curImages, [clinicId]: finalClinicImage };
        await this.setSetting('facility_images', updatedImages);
        localStorage.setItem('oshud_facility_images', JSON.stringify(updatedImages));
      } catch {}
    }

    if (data.isFeatured) {
      try {
        const curSettings = await this.getSettings();
        const curFeatured = curSettings?.find?.((s) => s.key === 'featured_clinics')?.value || [];
        const updatedList = Array.isArray(curFeatured) ? [...curFeatured] : [];
        if (!updatedList.includes(clinicId)) updatedList.push(clinicId);
        await this.setSetting('featured_clinics', updatedList);
        localStorage.setItem('oshud_featured_clinics', JSON.stringify(updatedList));
      } catch {}
    }

    // 5. Register in accountRegistry with role CLINIC
    accountRegistry.registerAccount({
      id: clinicId,
      userId: managerId,
      fullName: data.managerName || data.name,
      email: validEmail,
      phone: cleanPhone,
      password: ownerPassword,
      role: 'CLINIC',
      imageUrl: finalClinicImage || '',
      isFeatured: Boolean(data.isFeatured),
      hasClinicService: true,
      hasMedicineService,
      entityData: {
        name: data.name,
        chamberCount: data.chamberCount || '6 Chambers',
        line1: data.line1 || data.address,
        city: data.city || 'Kolkata',
        state: data.state || 'West Bengal',
        pincode: data.pincode || '700064',
        imageUrl: finalClinicImage || '',
        isFeatured: Boolean(data.isFeatured),
        hasClinicService: true,
        hasMedicineService,
      },
    });

    this.invalidateCache();
    return {
      ...(createdClinic || {}),
      id: clinicId,
      userId: managerId,
      name: data.name,
      email: validEmail,
      phone: cleanPhone,
      imageUrl: data.imageUrl || createdClinic?.logoUrl || '',
      chamberCount: data.chamberCount || '6 Chambers',
      line1: data.line1 || data.address,
      city: data.city || 'Kolkata',
      state: data.state || 'West Bengal',
      pincode: data.pincode || '700064',
      status: 'ACTIVE',
      isPrimary: false,
      isFeatured: Boolean(data.isFeatured),
      hasClinicService: true,
      hasMedicineService,
      manager: { id: managerId, fullName: data.managerName || data.name, email: validEmail, phone: cleanPhone },
      staff: [{ staffRole: 'OWNER', user: { fullName: data.managerName || data.name, email: validEmail, phone: cleanPhone, status: 'ACTIVE' } }],
      settings: { chamberCount: data.chamberCount || '6 Chambers' },
      createdAt: new Date().toISOString(),
    };
  },

  async deleteClinic(id, userId) {
    this.invalidateCache();
    const targetUserId = userId || id;

    // 1. Delete from pharmacies table & cascade staff user delete
    try {
      await apiClient.delete(`/pharmacies/${id}`);
    } catch (e) {
      console.warn('Backend delete clinic notice:', e.response?.data || e.message);
      try {
        await apiClient.put(`/pharmacies/admin-update/${id}`, { status: 'CLOSED' });
      } catch {}
    }

    // 2. Also ensure target user is removed from database users table
    if (targetUserId && targetUserId !== id) {
      try {
        await apiClient.delete(`/admin/users/${targetUserId}`);
      } catch (e) {
        console.warn('Backend delete clinic user notice:', e.message);
      }
    }

    // 3. Purge from local registry
    accountRegistry.removeAccount(id);
    accountRegistry.removeAccount(targetUserId);
    accountRegistry.markEntityRemoved(id);
    accountRegistry.markEntityRemoved(targetUserId);

    // 4. Remove from settings image map and featured list
    try {
      const curSettings = await this.getSettings();
      const curImages = cleanImageMap(curSettings?.find?.((s) => s.key === 'facility_images')?.value || {});
      if (curImages[id]) {
        delete curImages[id];
        await this.setSetting('facility_images', curImages);
        localStorage.setItem('oshud_facility_images', JSON.stringify(curImages));
      }
      const curFeatured = curSettings?.find?.((s) => s.key === 'featured_clinics')?.value || [];
      if (Array.isArray(curFeatured) && curFeatured.includes(id)) {
        const updated = curFeatured.filter((fid) => fid !== id);
        await this.setSetting('featured_clinics', updated);
        localStorage.setItem('oshud_featured_clinics', JSON.stringify(updated));
      }
    } catch {}

    this.invalidateCache();
    return { success: true, id };
  },

  // ================= RIDERS =================
  async getRiders(params = { page: 1, limit: 50 }) {
    const res = await this.fetchAllEntities();
    return { riders: res.riders, total: res.riders.length };
  },

  async createRider(data) {
    this.invalidateCache();
    const cleanPhone = String(data.phone || '').replace(/[^0-9]/g, '');
    const validEmail = (data.email && data.email.includes('@'))
      ? data.email.trim().toLowerCase()
      : `rider.${cleanPhone || Date.now()}@oshudwala.local`;

    // 0. Strict check across all profiles and backend database
    await this.validateCredentialsAvailable({ phone: cleanPhone, email: validEmail });

    let createdRider = null;
    try {
      const resp = await apiClient.post('/riders/admin-create', {
        fullName: data.fullName,
        phone: cleanPhone,
        email: validEmail,
        password: data.password || 'Rider123',
        vehicleType: data.vehicleType || 'Motorcycle',
        vehicleNumber: data.vehicleNumber || `WB-${Math.floor(10 + Math.random() * 89)}-${Date.now().toString().slice(-4)}`,
        licenseNumber: data.licenseNo || data.licenseNumber || 'DL-WB-Verified',
      });
      createdRider = resp.data?.data || resp.data;
    } catch (err) {
      if (
        err.response?.status === 400 ||
        err.response?.status === 409 ||
        err.response?.data?.message?.toLowerCase().includes('already') ||
        err.message?.includes('Already used credentials')
      ) {
        throw new Error('Already used credentials. This phone number or email is already assigned to another profile.');
      }
      console.warn('POST /riders/admin-create notice:', err.response?.data || err.message);
      // Fallback: register user with RIDER role
      const reg = await registerUserInDatabase({
        fullName: data.fullName,
        phone: cleanPhone,
        email: validEmail,
        password: data.password || 'Rider123',
        roleName: 'RIDER',
      });
      createdRider = { id: reg.userId, userId: reg.userId, fullName: data.fullName, email: validEmail, phone: cleanPhone };
    }

    const riderId = createdRider?.id || createdRider?.userId || `rider_${Date.now()}`;
    const userId = createdRider?.userId || createdRider?.user?.id || riderId;

    // Register in accountRegistry
    accountRegistry.registerAccount({
      id: riderId,
      fullName: data.fullName,
      email: validEmail,
      phone: cleanPhone,
      password: data.password || 'Rider123',
      role: 'RIDER',
      entityData: {
        vehicleType: data.vehicleType || 'Motorcycle',
        vehicleNumber: data.vehicleNumber || 'WB-01-AB-1234',
        licenseNumber: data.licenseNo || data.licenseNumber || 'DL-WB-Verified',
        city: data.city || 'Kolkata',
        imageUrl: data.imageUrl || '',
      },
    });

    this.invalidateCache();
    return createdRider || {
      id: riderId,
      userId: userId,
      fullName: data.fullName,
      email: validEmail,
      phone: cleanPhone,
      vehicleType: data.vehicleType || 'Motorcycle',
      vehicleNumber: data.vehicleNumber || 'WB-01-AB-1234',
      licenseNumber: data.licenseNo || data.licenseNumber || 'DL-WB-Verified',
      user: { id: userId, fullName: data.fullName, email: validEmail, phone: cleanPhone, status: 'ACTIVE' },
      status: 'AVAILABLE',
      createdAt: new Date().toISOString(),
    };
  },

  async deleteRider(id, userId) {
    this.invalidateCache();
    const targetUserId = userId || id;

    try {
      await apiClient.delete(`/admin/users/${targetUserId}`);
    } catch (e) {
      console.warn('Backend delete rider user notice:', e.message);
      try {
        await apiClient.patch(`/riders/${targetUserId}/status`, {
          status: 'SUSPENDED',
        });
        await apiClient.put(`/admin/users/${targetUserId}/access`, {
          roleName: 'RIDER',
          status: 'DEACTIVATED',
        });
      } catch {}
    }

    accountRegistry.removeAccount(id);
    accountRegistry.removeAccount(targetUserId);
    accountRegistry.markEntityRemoved(id);
    accountRegistry.markEntityRemoved(targetUserId);

    this.invalidateCache();
    return { success: true, id };
  },

  // ================= RECEPTIONISTS =================
  async getReceptionists() {
    const res = await this.fetchAllEntities();
    return { receptionists: res.receptionists || [], total: (res.receptionists || []).length };
  },

  async createReceptionist(data) {
    this.invalidateCache();
    const cleanPhone = String(data.phone || '').replace(/[^0-9]/g, '');
    const validEmail = (data.email && data.email.includes('@'))
      ? data.email.trim().toLowerCase()
      : `receptionist.${cleanPhone || Date.now()}@oshudwala.local`;

    // 0. Strict check across all profiles and backend database
    await this.validateCredentialsAvailable({ phone: cleanPhone, email: validEmail });

    let created = null;
    const targetPharmacyId = data.clinicId || data.pharmacyId;

    if (targetPharmacyId && targetPharmacyId.includes('-')) {
      try {
        const resp = await apiClient.post(`/pharmacies/${targetPharmacyId}/receptionists`, {
          fullName: data.fullName,
          phone: cleanPhone,
          email: validEmail,
          password: data.password || 'Reception123',
        });
        created = resp.data?.data || resp.data;
      } catch (err) {
        if (
          err.response?.status === 400 ||
          err.response?.status === 409 ||
          err.response?.data?.message?.toLowerCase().includes('already') ||
          err.message?.includes('Already used credentials')
        ) {
          throw new Error('Already used credentials. This phone number or email is already assigned to another profile.');
        }
        console.warn('Pharmacy receptionist create notice:', err.message);
      }
    }

    if (!created) {
      const reg = await registerUserInDatabase({
        fullName: data.fullName,
        phone: cleanPhone,
        email: validEmail,
        password: data.password || 'Reception123',
        roleName: 'RECEPTIONIST',
      });
      created = { id: reg.userId, userId: reg.userId, fullName: data.fullName, email: validEmail, phone: cleanPhone };
    }

    const recId = created?.id || created?.userId || `rec_${Date.now()}`;
    const userId = created?.userId || recId;

    accountRegistry.registerAccount({
      id: recId,
      fullName: data.fullName,
      email: validEmail,
      phone: cleanPhone,
      password: data.password || 'Reception123',
      role: 'RECEPTIONIST',
      entityData: {
        clinicName: data.clinicName || 'Central Front Desk',
      },
    });

    this.invalidateCache();
    return {
      id: recId,
      userId: userId,
      fullName: data.fullName,
      email: validEmail,
      phone: cleanPhone,
      clinicName: data.clinicName || 'Central Front Desk',
      status: 'ACTIVE',
      user: { id: userId, fullName: data.fullName, email: validEmail, phone: cleanPhone, status: 'ACTIVE' },
      createdAt: new Date().toISOString(),
    };
  },

  async deleteReceptionist(id, userId) {
    this.invalidateCache();
    const targetUserId = userId || id;
    try {
      await apiClient.put(`/admin/users/${targetUserId}/access`, {
        roleName: 'RECEPTIONIST',
        status: 'DEACTIVATED',
      });
    } catch (e) {
      console.warn('Deactivate receptionist access notice:', e.message);
    }

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
    const jsonStr = JSON.stringify(value || '');

    // Only send to backend /admin/settings if body is under 35KB to avoid HTTP 413 (Content Too Large)
    if (jsonStr.length < 35 * 1024) {
      try {
        const response = await apiClient.post('/admin/settings', { key, value });
        saved = response.data?.data || response.data;
      } catch (err) {
        console.warn('Backend setSetting notice:', err.response?.data || err.message);
      }
    } else {
      console.warn(`Setting "${key}" payload size (${Math.round(jsonStr.length / 1024)}KB) exceeds server limit; stored safely in local storage.`);
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

    const targetUserId = entityInfo.userId || entityInfo.user?.id || entityInfo.id || id;
    const targetEntityId = entityInfo.id || id;

    // 2. Synchronize with backend in parallel
    const promises = [];

    // User access
    if (targetUserId) {
      promises.push(
        apiClient.put(`/admin/users/${targetUserId}/access`, {
          roleName: roleName || 'PATIENT',
          status,
        }).catch((e) => console.warn('User status sync notice:', e.message))
      );
    }

    // Pharmacy/Clinic status
    if ((roleName === 'PHARMACY' || roleName === 'RECEPTIONIST' || entityInfo.hasClinicService) && targetEntityId && targetEntityId.includes('-')) {
      promises.push(
        apiClient.put(`/pharmacies/admin-update/${targetEntityId}`, {
          status: status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
        }).catch((e) => console.warn('Pharmacy status sync notice:', e.message))
      );
    }

    // Rider status
    if (roleName === 'RIDER' && targetUserId) {
      promises.push(
        apiClient.patch(`/riders/${targetUserId}/status`, {
          status: status === 'ACTIVE' ? 'AVAILABLE' : 'SUSPENDED',
        }).catch((e) => console.warn('Rider status sync notice:', e.message))
      );
    }

    try {
      await Promise.allSettled(promises);
    } catch {}

    return { id, status, purgeDeadline };
  },

  // ================= ENTITY EDIT / UPDATE =================
  async toggleFeatured(row, type, newFeatured, explicitOrder = null) {
    this.invalidateCache();
    const id = row.id;
    const settingKey = type === 'doctors' ? 'featured_doctors' : type === 'pharmacies' ? 'featured_pharmacies' : 'featured_clinics';
    const orderKey = `${settingKey}_order`;

    // 1. Sync platform settings list
    try {
      const curSettings = await this.getSettings();
      const existingList = curSettings?.find?.((s) => s.key === settingKey)?.value || [];
      const existingOrders = curSettings?.find?.((s) => s.key === orderKey)?.value || {};
      let updatedList = Array.isArray(existingList) ? [...existingList] : [];
      let updatedOrders = typeof existingOrders === 'object' && existingOrders !== null ? { ...existingOrders } : {};

      if (newFeatured) {
        if (!updatedList.includes(id)) updatedList.push(id);
        const maxOrder = Object.values(updatedOrders).reduce((max, val) => Math.max(max, Number(val) || 0), 0);
        updatedOrders[id] = explicitOrder !== null ? explicitOrder : (updatedOrders[id] || maxOrder + 1);
        if (row.userId) updatedOrders[row.userId] = updatedOrders[id];
      } else {
        updatedList = updatedList.filter((item) => item !== id);
        delete updatedOrders[id];
        if (row.userId) delete updatedOrders[row.userId];
      }

      await this.setSetting(settingKey, updatedList);
      await this.setSetting(orderKey, updatedOrders);
      localStorage.setItem(`oshud_${settingKey}`, JSON.stringify(updatedList));
      localStorage.setItem(`oshud_${orderKey}`, JSON.stringify(updatedOrders));
    } catch (setErr) {
      console.warn('Set setting toggle featured notice:', setErr.message);
    }

    // 2. Direct database update if entity is in PostgreSQL
    if (type === 'doctors' && id && id.includes('-')) {
      try {
        await apiClient.put(`/doctors/${id}`, { isFeatured: newFeatured });
      } catch (docErr) {
        console.warn('Doctor isFeatured update notice:', docErr.message);
      }
    } else if ((type === 'clinics' || type === 'pharmacies') && id && id.includes('-')) {
      try {
        await apiClient.put(`/pharmacies/admin-update/${id}`, { isFeatured: newFeatured });
      } catch (phErr) {
        console.warn('Pharmacy isFeatured update notice:', phErr.message);
      }
    }

    // 3. Update account registry
    accountRegistry.updateAccount(id, {
      isFeatured: newFeatured,
      entityData: { isFeatured: newFeatured },
    });

    return { id, isFeatured: newFeatured };
  },

  async saveFeaturedOrdering(type, orderedItems) {
    this.invalidateCache();
    const settingKey = type === 'doctors' ? 'featured_doctors' : type === 'pharmacies' ? 'featured_pharmacies' : 'featured_clinics';
    const orderKey = `${settingKey}_order`;

    // Filter only featured items and sort by order number
    const featuredItems = (orderedItems || []).filter((it) => Boolean(it.isFeatured));
    featuredItems.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

    const orderedIds = featuredItems.map((it) => it.id);
    const ordersMap = {};
    featuredItems.forEach((it, idx) => {
      const orderNum = Number(it.order) || idx + 1;
      ordersMap[it.id] = orderNum;
      if (it.userId) ordersMap[it.userId] = orderNum;
    });

    try {
      await this.setSetting(settingKey, orderedIds);
      await this.setSetting(orderKey, ordersMap);
      localStorage.setItem(`oshud_${settingKey}`, JSON.stringify(orderedIds));
      localStorage.setItem(`oshud_${orderKey}`, JSON.stringify(ordersMap));

      // Sync isFeatured flag to PostgreSQL for modified entities
      for (const it of orderedItems) {
        if (type === 'doctors' && it.id && it.id.includes('-')) {
          apiClient.put(`/doctors/${it.id}`, { isFeatured: Boolean(it.isFeatured) }).catch(() => {});
        } else if ((type === 'clinics' || type === 'pharmacies') && it.id && it.id.includes('-')) {
          apiClient.put(`/pharmacies/admin-update/${it.id}`, { isFeatured: Boolean(it.isFeatured) }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('saveFeaturedOrdering notice:', err.message);
    }

    return { orderedIds, ordersMap };
  },

  async updateDoctor(id, data) {
    this.invalidateCache();
    if (data.phone || data.email) {
      await this.validateCredentialsAvailable({
        phone: data.phone,
        email: data.email,
        excludeId: id,
        excludeUserId: data.userId,
        originalPhone: data.originalPhone || data.currentPhone,
        originalEmail: data.originalEmail || data.currentEmail,
      });
    }
    try {
      if (id && id.includes('-')) {
        await apiClient.put(`/doctors/${id}`, {
          fullName: data.fullName,
          phone: data.phone,
          registrationNumber: data.registrationNumber,
          qualifications: data.qualifications,
          experienceYears: Number(data.experienceYears) || 0,
          bio: data.bio || '',
          isFeatured: Boolean(data.isFeatured),
        });
      }
    } catch (err) {
      console.warn('Backend update doctor notice:', err.message);
    }

    // Persist doctor image if present
    const optimizedImage = await ensureOptimizedImageUrl(data.imageUrl);
    const finalDoctorImage = optimizedImage || data.imageUrl;
    if (finalDoctorImage && id) {
      try {
        const curSettings = await this.getSettings();
        const curImages = cleanImageMap(curSettings?.find?.((s) => s.key === 'doctor_images')?.value || {});
        const updatedImages = { ...curImages, [id]: finalDoctorImage };
        if (data.userId) updatedImages[data.userId] = finalDoctorImage;
        await this.setSetting('doctor_images', updatedImages);
        localStorage.setItem('oshud_doctor_images', JSON.stringify(updatedImages));
      } catch {}
    }

    accountRegistry.updateAccount(id, {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      imageUrl: finalDoctorImage || data.imageUrl,
      isFeatured: data.isFeatured,
      entityData: {
        specialization: data.specialization,
        qualifications: data.qualifications,
        registrationNumber: data.registrationNumber,
        experienceYears: Number(data.experienceYears) || 0,
        consultationFeePaise: Number(data.consultationFeePaise) || 50000,
        imageUrl: finalDoctorImage || data.imageUrl,
        isFeatured: data.isFeatured,
      },
    });
    return { id, ...data };
  },

  async updatePharmacy(id, data) {
    this.invalidateCache();
    if (data.phone || data.email) {
      await this.validateCredentialsAvailable({
        phone: data.phone,
        email: data.email,
        excludeId: id,
        excludeUserId: data.userId,
        originalPhone: data.originalPhone || data.currentPhone,
        originalEmail: data.originalEmail || data.currentEmail,
      });
    }
    const hasClinicService = Boolean(data.hasClinicService);
    const hasMedicineService = data.hasMedicineService !== false;

    try {
      if (id && id.includes('-')) {
        await Promise.allSettled([
          apiClient.put(`/pharmacies/${id}/services`, {
            hasClinicService,
            hasMedicineService,
          }),
          ...(data.imageUrl ? [apiClient.put(`/pharmacies/${id}/media`, { logoUrl: data.imageUrl })] : []),
          apiClient.put(`/pharmacies/${id}`, {
            name: data.name,
            phone: data.phone,
            line1: data.line1 || data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
          }),
        ]);
      }
    } catch (err) {
      console.warn('Backend update pharmacy notice:', err.message);
    }

    const optimizedImage = await ensureOptimizedImageUrl(data.imageUrl);
    const finalPharmacyImage = optimizedImage || data.imageUrl;
    if (finalPharmacyImage && id) {
      try {
        const curSettings = await this.getSettings();
        const curImages = cleanImageMap(curSettings?.find?.((s) => s.key === 'facility_images')?.value || {});
        const updatedImages = { ...curImages, [id]: finalPharmacyImage };
        await this.setSetting('facility_images', updatedImages);
        localStorage.setItem('oshud_facility_images', JSON.stringify(updatedImages));
      } catch {}
    }

    accountRegistry.updateAccount(id, {
      fullName: data.name,
      name: data.name,
      email: data.email,
      phone: data.phone,
      imageUrl: finalPharmacyImage || data.imageUrl,
      hasClinicService,
      hasMedicineService,
      entityData: {
        name: data.name,
        licenseNumber: data.licenseNumber,
        line1: data.line1 || data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        imageUrl: finalPharmacyImage || data.imageUrl,
        hasClinicService,
        hasMedicineService,
      },
    });
    return { id, ...data };
  },

  async updateClinic(id, data) {
    this.invalidateCache();
    if (data.phone || data.email) {
      await this.validateCredentialsAvailable({
        phone: data.phone,
        email: data.email,
        excludeId: id,
        excludeUserId: data.userId,
        originalPhone: data.originalPhone || data.currentPhone,
        originalEmail: data.originalEmail || data.currentEmail,
      });
    }
    const hasClinicService = data.hasClinicService !== false;
    const hasMedicineService = Boolean(data.hasMedicineService);

    const optimizedClinicImage = await ensureOptimizedImageUrl(data.imageUrl);
    const finalClinicImage = optimizedClinicImage || data.imageUrl;

    try {
      if (id && id.includes('-')) {
        await Promise.allSettled([
          apiClient.put(`/pharmacies/${id}/services`, {
            hasClinicService,
            hasMedicineService,
          }),
          ...(finalClinicImage ? [apiClient.put(`/pharmacies/${id}/media`, { logoUrl: finalClinicImage })] : []),
          apiClient.put(`/pharmacies/${id}`, {
            name: data.name,
            phone: data.phone,
            line1: data.line1 || data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
          }),
        ]);
      }
    } catch (err) {
      console.warn('Backend update clinic notice:', err.message);
    }

    if (finalClinicImage && id) {
      try {
        const curSettings = await this.getSettings();
        const curImages = cleanImageMap(curSettings?.find?.((s) => s.key === 'facility_images')?.value || {});
        const updatedImages = { ...curImages, [id]: finalClinicImage };
        await this.setSetting('facility_images', updatedImages);
        localStorage.setItem('oshud_facility_images', JSON.stringify(updatedImages));
      } catch {}
    }

    accountRegistry.updateAccount(id, {
      fullName: data.name,
      name: data.name,
      email: data.email,
      phone: data.phone,
      imageUrl: finalClinicImage || data.imageUrl,
      isFeatured: data.isFeatured,
      hasClinicService,
      hasMedicineService,
      entityData: {
        name: data.name,
        chamberCount: data.chamberCount,
        line1: data.line1 || data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        imageUrl: finalClinicImage || data.imageUrl,
        isFeatured: data.isFeatured,
        hasClinicService,
        hasMedicineService,
      },
    });
    return { id, ...data };
  },

  async updateRider(id, data) {
    this.invalidateCache();
    if (data.phone || data.email) {
      await this.validateCredentialsAvailable({
        phone: data.phone,
        email: data.email,
        excludeId: id,
        excludeUserId: data.userId,
        originalPhone: data.originalPhone || data.currentPhone,
        originalEmail: data.originalEmail || data.currentEmail,
      });
    }
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
    if (data.phone || data.email) {
      await this.validateCredentialsAvailable({
        phone: data.phone,
        email: data.email,
        excludeId: id,
        excludeUserId: id,
        originalPhone: data.originalPhone || data.currentPhone,
        originalEmail: data.originalEmail || data.currentEmail,
      });
    }
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
