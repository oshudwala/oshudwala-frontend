// Centralized Persistent Account & Credentials Registry
// Ensures that accounts created in SuperAdmin Management (Doctor, Pharmacy, Clinic, Rider)
// are stored permanently and can immediately log in on the Login Page.

const ACCOUNTS_STORAGE_KEY = 'oshud_registered_accounts';
const ENTITIES_STORAGE_KEY = 'oshud_admin_entities';
const REMOVED_STORAGE_KEY = 'oshud_removed_entities';

// Master Super Admin account for platform management
const MASTER_ADMIN_ACCOUNTS = [
  {
    id: 'usr_superadmin_master',
    fullName: 'Super Admin',
    email: 'admin@oshudwala.com',
    phone: '9000000000',
    passwords: ['12345678', 'SuperSecretPassword123', 'admin123', 'admin', 'Admin@123', 'Password123'],
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_superadmin_in',
    fullName: 'Super Admin',
    email: 'admin@oshudwala.in',
    phone: '9000000000',
    passwords: ['12345678', 'SuperSecretPassword123', 'admin123', 'admin', 'Admin@123', 'Password123'],
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const accountRegistry = {
  // Read all permanently removed entity IDs
  getRemovedIds() {
    try {
      const raw = localStorage.getItem(REMOVED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // Mark an entity / user ID as permanently deleted
  markEntityRemoved(id) {
    if (!id) return;
    try {
      const removed = this.getRemovedIds();
      const strId = String(id);
      if (!removed.includes(strId)) {
        removed.push(strId);
        localStorage.setItem(REMOVED_STORAGE_KEY, JSON.stringify(removed));
      }
    } catch (e) {
      console.warn('Error saving removed entity ID:', e);
    }
  },

  // Check if an entity or user ID was deleted
  isEntityRemoved(id, userId) {
    const removed = this.getRemovedIds();
    if (id && removed.includes(String(id))) return true;
    if (userId && removed.includes(String(userId))) return true;
    return false;
  },

  // Read all accounts from storage, filtering out legacy hardcoded dummy accounts
  getAccounts() {
    let saved = [];
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out old legacy dummy demo seeds (e.g. usr_doctor_01, usr_pharmacy_01, etc.)
          saved = parsed.filter(
            (a) =>
              a.id !== 'usr_doctor_01' &&
              a.id !== 'usr_pharmacy_01' &&
              a.id !== 'usr_receptionist_01' &&
              a.id !== 'usr_rider_01' &&
              a.id !== 'usr_superadmin_01'
          );
        }
      }
    } catch (e) {
      console.warn('Error reading account registry:', e);
    }

    // Always ensure Master Super Admin accounts are present
    const combined = [...saved];
    MASTER_ADMIN_ACCOUNTS.forEach((adminAcc) => {
      const existingIdx = combined.findIndex((a) => a.email === adminAcc.email || a.id === adminAcc.id);
      if (existingIdx >= 0) {
        combined[existingIdx] = {
          ...combined[existingIdx],
          ...adminAcc,
          passwords: Array.from(new Set([...(adminAcc.passwords || []), ...(combined[existingIdx].passwords || [])])),
        };
      } else {
        combined.push(adminAcc);
      }
    });

    return combined;
  },

  saveAccounts(accounts) {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Error writing account registry:', e);
    }
  },

  // Find account without throwing error
  findAccount(identifier) {
    if (!identifier) return null;
    const accounts = this.getAccounts();
    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPhone = cleanId.replace(/[^0-9]/g, '');

    // Direct admin alias matching
    if (cleanId === 'admin' || cleanId === 'superadmin') {
      return accounts.find((a) => a.role === 'SUPER_ADMIN') || MASTER_ADMIN_ACCOUNTS[0];
    }

    return accounts.find((a) => {
      const matchId = a.id && String(a.id).toLowerCase() === cleanId;
      const matchEmail = a.email && a.email.toLowerCase() === cleanId;
      const matchPhone =
        cleanPhone.length >= 10 &&
        a.phone &&
        a.phone.replace(/[^0-9]/g, '').slice(-10) === cleanPhone.slice(-10);
      return matchId || matchEmail || matchPhone;
    });
  },

  // Register a new staff or user account created from Management tab or Register page
  registerAccount({ id, fullName, email, phone, password, role, entityData }) {
    const accounts = this.getAccounts();
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanPhone = phone ? phone.trim().replace(/[^0-9]/g, '') : null;
    const cleanId = id || `usr_${role.toLowerCase()}_${Date.now()}`;

    // Check if account with same email or phone exists
    const existingIndex = accounts.findIndex(
      (a) =>
        (cleanEmail && a.email && a.email.toLowerCase() === cleanEmail) ||
        (cleanPhone && a.phone && a.phone.replace(/[^0-9]/g, '') === cleanPhone)
    );

    const newAccount = {
      id: cleanId,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      passwords: [password],
      role: String(role).toUpperCase(),
      status: 'ACTIVE',
      entityData: entityData || {},
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Update existing account credentials and role
      accounts[existingIndex] = {
        ...accounts[existingIndex],
        ...newAccount,
        passwords: [password, ...(accounts[existingIndex].passwords || [])],
      };
    } else {
      accounts.unshift(newAccount);
    }

    this.saveAccounts(accounts);
    try {
      const removed = this.getRemovedIds().filter((r) => r !== cleanId);
      localStorage.setItem(REMOVED_STORAGE_KEY, JSON.stringify(removed));
    } catch {}

    return newAccount;
  },

  // Remove an account (used when deleting an entity in Management tab)
  removeAccount(idOrEmailOrPhone) {
    if (!idOrEmailOrPhone) return;
    const accounts = this.getAccounts();
    const target = String(idOrEmailOrPhone).trim().toLowerCase();
    const targetDigits = target.replace(/[^0-9]/g, '');

    const filtered = accounts.filter((a) => {
      if (a.id === idOrEmailOrPhone) return false;
      if (a.email && a.email.toLowerCase() === target) return false;
      if (targetDigits && a.phone && a.phone.replace(/[^0-9]/g, '') === targetDigits) return false;
      return true;
    });

    this.saveAccounts(filtered);
    this.markEntityRemoved(idOrEmailOrPhone);
  },

  // Authenticate user by identifier (email or phone) and password
  authenticate(identifier, password) {
    if (!identifier || !password) return null;

    const accounts = this.getAccounts();
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = cleanId.replace(/[^0-9]/g, '');

    const user =
      cleanId === 'admin' || cleanId === 'superadmin'
        ? (accounts.find((a) => a.role === 'SUPER_ADMIN') || MASTER_ADMIN_ACCOUNTS[0])
        : accounts.find((a) => {
            const matchEmail = a.email && a.email.toLowerCase() === cleanId;
            const matchPhone = cleanPhone.length >= 10 && a.phone && a.phone.replace(/[^0-9]/g, '') === cleanPhone;
            return matchEmail || matchPhone;
          });

    if (!user) return null;

    // Check password
    const validPasswords = Array.isArray(user.passwords) ? user.passwords : [user.password];
    const isPasswordValid = validPasswords.some((p) => p && p.trim() === password.trim());

    if (!isPasswordValid) {
      throw {
        status: 401,
        message: 'Invalid password. Please check your credentials and try again.',
      };
    }

    if (user.status === 'DEACTIVATED' || user.status === 'SUSPENDED') {
      throw {
        status: 403,
        message: 'Your account has been deactivated or suspended. Please contact platform support.',
      };
    }

    return user;
  },

  // Update account details (Edit Entity)
  updateAccount(id, updates) {
    if (!id || !updates) return null;
    const accounts = this.getAccounts();
    const strId = String(id);
    const index = accounts.findIndex((a) => String(a.id) === strId || String(a.userId) === strId);
    if (index >= 0) {
      accounts[index] = {
        ...accounts[index],
        ...updates,
        fullName: updates.fullName || updates.name || accounts[index].fullName,
        email: updates.email !== undefined ? updates.email : accounts[index].email,
        phone: updates.phone !== undefined ? updates.phone : accounts[index].phone,
        status: updates.status || accounts[index].status,
        deactivatedAt: updates.deactivatedAt !== undefined ? updates.deactivatedAt : accounts[index].deactivatedAt,
        purgeDeadline: updates.purgeDeadline !== undefined ? updates.purgeDeadline : accounts[index].purgeDeadline,
        entityData: {
          ...(accounts[index].entityData || {}),
          ...(updates.entityData || {}),
          imageUrl: updates.imageUrl || updates.entityData?.imageUrl || accounts[index].entityData?.imageUrl,
          isFeatured: updates.isFeatured !== undefined ? updates.isFeatured : accounts[index].entityData?.isFeatured,
        },
      };
      this.saveAccounts(accounts);
      return accounts[index];
    }
    return null;
  },

  // Read all explicit entity statuses
  getEntityStatuses() {
    try {
      const raw = localStorage.getItem('oshud_deactivated_entity_statuses');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  saveEntityStatuses(statuses) {
    try {
      localStorage.setItem('oshud_deactivated_entity_statuses', JSON.stringify(statuses));
    } catch {}
  },

  // Set account status (Active or Deactivated with 30-day deadline)
  setAccountStatus(id, status, purgeDeadline = null, entityInfo = {}) {
    if (!id && !entityInfo?.id) return null;
    const accounts = this.getAccounts();
    const strId = id ? String(id) : '';
    const altId = entityInfo?.id ? String(entityInfo.id) : '';
    const altUserId = entityInfo?.userId ? String(entityInfo.userId) : '';
    const cleanEmail = entityInfo?.email ? entityInfo.email.trim().toLowerCase() : '';
    const cleanPhone = entityInfo?.phone ? String(entityInfo.phone).replace(/[^0-9]/g, '') : '';

    // 1. Record in explicit entity status registry
    const statusStore = this.getEntityStatuses();
    const record = {
      status,
      deactivatedAt: status === 'DEACTIVATED' ? new Date().toISOString() : null,
      purgeDeadline: status === 'DEACTIVATED' ? (purgeDeadline || Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
    };
    if (strId) statusStore[strId] = record;
    if (altId) statusStore[altId] = record;
    if (altUserId) statusStore[altUserId] = record;
    if (cleanEmail) statusStore[cleanEmail] = record;
    if (cleanPhone) statusStore[cleanPhone] = record;
    this.saveEntityStatuses(statusStore);

    // 2. Locate and update in accounts list
    let matchedIndex = accounts.findIndex((a) => {
      if (strId && (String(a.id) === strId || String(a.userId) === strId)) return true;
      if (altId && (String(a.id) === altId || String(a.userId) === altId)) return true;
      if (altUserId && (String(a.id) === altUserId || String(a.userId) === altUserId)) return true;
      if (cleanEmail && a.email && a.email.toLowerCase() === cleanEmail) return true;
      if (cleanPhone && a.phone && String(a.phone).replace(/[^0-9]/g, '') === cleanPhone) return true;
      return false;
    });

    if (matchedIndex >= 0) {
      accounts[matchedIndex].status = status;
      if (status === 'DEACTIVATED') {
        accounts[matchedIndex].deactivatedAt = record.deactivatedAt;
        accounts[matchedIndex].purgeDeadline = record.purgeDeadline;
      } else {
        delete accounts[matchedIndex].deactivatedAt;
        delete accounts[matchedIndex].purgeDeadline;
      }
    } else {
      // Dynamically add to registry so it persists
      accounts.push({
        id: altUserId || strId || altId || `usr_${Date.now()}`,
        userId: altUserId || strId,
        fullName: entityInfo.fullName || entityInfo.name || 'Account',
        email: cleanEmail,
        phone: cleanPhone,
        role: entityInfo.role || 'PATIENT',
        status,
        deactivatedAt: record.deactivatedAt,
        purgeDeadline: record.purgeDeadline,
        entityData: entityInfo.entityData || {},
        createdAt: new Date().toISOString(),
      });
    }

    this.saveAccounts(accounts);
    return record;
  },

  // Get all entities formatted for Management tab tables
  getEntities() {
    const accounts = this.getAccounts().filter((a) => !this.isEntityRemoved(a.id));
    
    // Group accounts by role
    const doctors = accounts
      .filter((a) => a.role === 'DOCTOR')
      .map((a) => ({
        id: a.id,
        fullName: a.fullName,
        email: a.email,
        phone: a.phone,
        imageUrl: a.entityData?.imageUrl || a.imageUrl || '',
        specialization: a.entityData?.specialization || 'General Physician',
        qualifications: a.entityData?.qualifications || 'MBBS',
        registrationNumber: a.entityData?.registrationNumber || 'WBMC-Verified',
        experienceYears: a.entityData?.experienceYears || 5,
        consultationFeePaise: a.entityData?.consultationFeePaise || 50000,
        specializations: [{ specialization: { name: a.entityData?.specialization || 'General Physician' } }],
        pharmacies: [{ pharmacy: { name: a.entityData?.clinicName || 'Apollo Clinic' } }],
        user: { id: a.id, email: a.email, phone: a.phone, status: a.status },
        status: a.status,
        deactivatedAt: a.deactivatedAt,
        purgeDeadline: a.purgeDeadline,
        isFeatured: a.entityData?.isFeatured || false,
      }));

    const pharmacies = accounts
      .filter((a) => a.role === 'PHARMACY')
      .map((a) => ({
        id: a.id,
        name: a.entityData?.name || a.fullName + ' Pharmacy',
        email: a.email,
        phone: a.phone,
        imageUrl: a.entityData?.imageUrl || a.imageUrl || '',
        licenseNumber: a.entityData?.licenseNumber || 'WB-DL-Verified',
        line1: a.entityData?.line1 || 'Sector V, Salt Lake',
        city: a.entityData?.city || 'Kolkata',
        state: a.entityData?.state || 'West Bengal',
        pincode: a.entityData?.pincode || '700091',
        owner: { id: a.id, fullName: a.fullName, email: a.email, phone: a.phone },
        staff: [{ staffRole: 'OWNER', user: { fullName: a.fullName, email: a.email, phone: a.phone, status: a.status } }],
        status: a.status,
        deactivatedAt: a.deactivatedAt,
        purgeDeadline: a.purgeDeadline,
      }));

    const clinics = accounts
      .filter((a) => a.role === 'RECEPTIONIST' && (a.entityData?.clinicName || a.entityData?.name))
      .map((a) => ({
        id: a.entityData?.clinicId || a.id,
        name: a.entityData?.clinicName || a.entityData?.name,
        email: a.email,
        phone: a.phone,
        imageUrl: a.entityData?.imageUrl || a.imageUrl || '',
        chamberCount: a.entityData?.chamberCount || '6 Chambers',
        line1: a.entityData?.line1 || 'City Centre',
        city: a.entityData?.city || 'Durgapur',
        state: a.entityData?.state || 'West Bengal',
        pincode: a.entityData?.pincode || '713216',
        manager: { id: a.id, fullName: a.fullName, email: a.email, phone: a.phone },
        staff: [{ staffRole: 'RECEPTIONIST', user: { fullName: a.fullName, email: a.email, phone: a.phone, status: a.status } }],
        settings: { chamberCount: a.entityData?.chamberCount || '6 Chambers' },
        status: a.status,
        deactivatedAt: a.deactivatedAt,
        purgeDeadline: a.purgeDeadline,
        isFeatured: a.entityData?.isFeatured || false,
      }));

    const riders = accounts
      .filter((a) => a.role === 'RIDER')
      .map((a) => ({
        id: a.id,
        fullName: a.fullName,
        email: a.email,
        phone: a.phone,
        imageUrl: a.entityData?.imageUrl || a.imageUrl || '',
        vehicleType: a.entityData?.vehicleType || 'Motorcycle',
        vehicleNumber: a.entityData?.vehicleNumber || 'WB-01-AB-1234',
        licenseNumber: a.entityData?.licenseNumber || 'DL-WB-Verified',
        user: { id: a.id, fullName: a.fullName, email: a.email, phone: a.phone, status: a.status },
        status: a.status || 'AVAILABLE',
        deactivatedAt: a.deactivatedAt,
        purgeDeadline: a.purgeDeadline,
      }));

    const users = accounts
      .filter((a) => a.role === 'PATIENT')
      .map((a) => ({
        id: a.id,
        fullName: a.fullName,
        email: a.email,
        phone: a.phone,
        imageUrl: a.entityData?.imageUrl || a.imageUrl || '',
        createdAt: a.createdAt,
        role: { name: 'PATIENT' },
        status: a.status,
        deactivatedAt: a.deactivatedAt,
        purgeDeadline: a.purgeDeadline,
      }));

    return { doctors, pharmacies, clinics, riders, users };
  },
};

export default accountRegistry;
