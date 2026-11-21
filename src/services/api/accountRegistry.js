// Centralized Persistent Account & Credentials Registry
// Ensures that accounts created in SuperAdmin Management (Doctor, Pharmacy, Clinic, Rider)
// are stored permanently and can immediately log in on the Login Page.

const ACCOUNTS_STORAGE_KEY = 'oshud_registered_accounts';
const ENTITIES_STORAGE_KEY = 'oshud_admin_entities';
const REMOVED_STORAGE_KEY = 'oshud_removed_entities';

// No hardcoded dummy accounts - show only real registered data
const DEFAULT_ACCOUNTS = [];

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
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out old legacy dummy demo seeds (e.g. usr_doctor_01, usr_pharmacy_01, etc.)
          const realAccounts = parsed.filter(
            (a) =>
              a.id !== 'usr_doctor_01' &&
              a.id !== 'usr_pharmacy_01' &&
              a.id !== 'usr_receptionist_01' &&
              a.id !== 'usr_rider_01' &&
              a.id !== 'usr_superadmin_01'
          );
          return realAccounts;
        }
      }
    } catch (e) {
      console.warn('Error reading account registry:', e);
    }
    return [];
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

    const user = accounts.find((a) => {
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
        specialization: a.entityData?.specialization || 'General Physician',
        qualifications: a.entityData?.qualifications || 'MBBS',
        registrationNumber: a.entityData?.registrationNumber || 'WBMC-Verified',
        experienceYears: a.entityData?.experienceYears || 5,
        consultationFeePaise: a.entityData?.consultationFeePaise || 50000,
        specializations: [{ specialization: { name: a.entityData?.specialization || 'General Physician' } }],
        pharmacies: [{ pharmacy: { name: a.entityData?.clinicName || 'Apollo Clinic' } }],
        user: { id: a.id, email: a.email, phone: a.phone, status: a.status },
        status: a.status,
      }));

    const pharmacies = accounts
      .filter((a) => a.role === 'PHARMACY')
      .map((a) => ({
        id: a.id,
        name: a.entityData?.name || a.fullName + ' Pharmacy',
        email: a.email,
        phone: a.phone,
        licenseNumber: a.entityData?.licenseNumber || 'WB-DL-Verified',
        line1: a.entityData?.line1 || 'Sector V, Salt Lake',
        city: a.entityData?.city || 'Kolkata',
        state: a.entityData?.state || 'West Bengal',
        pincode: a.entityData?.pincode || '700091',
        owner: { id: a.id, fullName: a.fullName, email: a.email, phone: a.phone },
        staff: [{ staffRole: 'OWNER', user: { fullName: a.fullName, email: a.email, phone: a.phone, status: a.status } }],
        status: a.status,
      }));

    const clinics = accounts
      .filter((a) => a.role === 'RECEPTIONIST')
      .map((a) => ({
        id: a.id,
        name: a.entityData?.name || a.fullName + ' Polyclinic',
        email: a.email,
        phone: a.phone,
        chamberCount: a.entityData?.chamberCount || '8 Chambers',
        line1: a.entityData?.line1 || 'Block BD, Sector 1, Salt Lake',
        city: a.entityData?.city || 'Kolkata',
        state: a.entityData?.state || 'West Bengal',
        pincode: a.entityData?.pincode || '700064',
        manager: { id: a.id, fullName: a.fullName, email: a.email, phone: a.phone },
        staff: [{ staffRole: 'RECEPTIONIST', user: { fullName: a.fullName, email: a.email, phone: a.phone, status: a.status } }],
        settings: { chamberCount: a.entityData?.chamberCount || '8 Chambers' },
        status: a.status,
      }));

    const riders = accounts
      .filter((a) => a.role === 'RIDER')
      .map((a) => ({
        id: a.id,
        fullName: a.fullName,
        email: a.email,
        phone: a.phone,
        vehicleType: a.entityData?.vehicleType || 'Motorcycle',
        vehicleNumber: a.entityData?.vehicleNumber || 'WB-01-AB-1234',
        licenseNumber: a.entityData?.licenseNumber || 'DL-WB-Verified',
        user: { id: a.id, fullName: a.fullName, email: a.email, phone: a.phone, status: a.status },
        status: a.status || 'AVAILABLE',
      }));

    const users = accounts
      .filter((a) => a.role === 'PATIENT')
      .map((a) => ({
        id: a.id,
        fullName: a.fullName,
        email: a.email,
        phone: a.phone,
        createdAt: a.createdAt,
        role: { name: 'PATIENT' },
        status: a.status,
      }));

    return { doctors, pharmacies, clinics, riders, users };
  },
};

export default accountRegistry;
