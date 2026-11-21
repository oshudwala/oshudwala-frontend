import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api/auth.api';
import { userApi } from '../services/api/user.api';
import { tokenStorage, onSessionExpired } from '../services/api/client';
import accountRegistry from '../services/api/accountRegistry';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authApi.getCurrentUser());
  const [token, setToken] = useState(() => tokenStorage.getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  // Helper to normalize user role
  const normalizeRole = (role) => {
    if (!role) return 'PATIENT';
    return String(role).toUpperCase();
  };

  // Synchronize profile with backend
  const refreshUserProfile = useCallback(async () => {
    const cachedUser = tokenStorage.getUser();
    if (!tokenStorage.getAccessToken()) {
      setIsLoading(false);
      return null;
    }
    try {
      const profile = await userApi.getProfile();
      const registeredAccount = accountRegistry.findAccount(profile.phone || profile.email || profile.id);
      const effectiveRole = (registeredAccount && registeredAccount.role !== 'PATIENT')
        ? registeredAccount.role
        : (cachedUser?.role && cachedUser.role !== 'PATIENT' ? cachedUser.role : normalizeRole(profile.role?.name || profile.role));

      const normalizedUser = {
        id: profile.id,
        name: profile.fullName,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        role: effectiveRole,
        bloodGroup: profile.patientProfile?.bloodGroup || 'O+',
        allergies: profile.patientProfile?.allergies,
        medicalNotes: profile.patientProfile?.medicalNotes,
        patientProfile: profile.patientProfile,
        avatar:
          profile.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      };
      setUser(normalizedUser);
      setToken(tokenStorage.getAccessToken());
      return normalizedUser;
    } catch (err) {
      console.warn('Failed to hydrate backend profile:', err.message);
      // If we have an active session cached (e.g. newly created Doctor/Rider/Pharmacy/Admin), preserve it!
      if (cachedUser) {
        setUser(cachedUser);
        setToken(tokenStorage.getAccessToken());
        return cachedUser;
      }
      if (err.status === 401 || err.isExpired) {
        setUser(null);
        setToken(null);
        tokenStorage.clearSession();
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hydrate session on app start
  useEffect(() => {
    refreshUserProfile();
  }, [refreshUserProfile]);

  // Subscribe to automatic session expiry events from Axios interceptor
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setUser(null);
      setToken(null);
    });
    return unsubscribe;
  }, []);

  const login = async ({ identifier, email, phone, password }) => {
    setIsLoading(true);
    try {
      const loginId = identifier || phone || email;
      const res = await authApi.login({ identifier: loginId, password });
      setToken(res.accessToken);

      const registeredAccount = accountRegistry.findAccount(loginId || res.user?.phone || res.user?.email || res.user?.id);
      const staffRole = (registeredAccount && registeredAccount.role !== 'PATIENT')
        ? registeredAccount.role
        : (res.user?.role && res.user.role !== 'PATIENT' ? res.user.role : null);

      // Hydrate full user profile from backend
      try {
        const fullProfile = await userApi.getProfile();
        const effectiveRole = staffRole || normalizeRole(fullProfile.role?.name || fullProfile.role || res.user?.role);
        const userObj = {
          id: fullProfile.id,
          name: fullProfile.fullName,
          fullName: fullProfile.fullName,
          email: fullProfile.email,
          phone: fullProfile.phone,
          role: effectiveRole,
          bloodGroup: fullProfile.patientProfile?.bloodGroup || 'O+',
          patientProfile: fullProfile.patientProfile,
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        };
        setUser(userObj);
        return { user: userObj, token: res.accessToken };
      } catch {
        const effectiveRole = staffRole || normalizeRole(res.user?.role);
        const fallbackUser = {
          ...res.user,
          name: res.user?.fullName,
          role: effectiveRole,
        };
        setUser(fallbackUser);
        return { user: fallbackUser, token: res.accessToken };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ fullName, name, email, phone, password }) => {
    setIsLoading(true);
    try {
      const res = await authApi.register({
        fullName: fullName || name,
        email,
        phone,
        password,
      });
      setToken(res.accessToken);

      try {
        const fullProfile = await userApi.getProfile();
        const userObj = {
          id: fullProfile.id,
          name: fullProfile.fullName,
          fullName: fullProfile.fullName,
          email: fullProfile.email,
          phone: fullProfile.phone,
          role: normalizeRole(fullProfile.role?.name || fullProfile.role || res.user?.role),
          bloodGroup: fullProfile.patientProfile?.bloodGroup || 'O+',
          patientProfile: fullProfile.patientProfile,
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        };
        setUser(userObj);
        return { user: userObj, token: res.accessToken };
      } catch {
        const fallbackUser = {
          ...res.user,
          name: res.user?.fullName,
          role: normalizeRole(res.user?.role),
        };
        setUser(fallbackUser);
        return { user: fallbackUser, token: res.accessToken };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (phone) => {
    return await authApi.sendOtp(phone);
  };

  const verifyOtp = async ({ phone, otp, fullName }) => {
    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp({ phone, otp, fullName });
      setToken(res.accessToken);

      try {
        const fullProfile = await userApi.getProfile();
        const userObj = {
          id: fullProfile.id,
          name: fullProfile.fullName,
          fullName: fullProfile.fullName,
          email: fullProfile.email,
          phone: fullProfile.phone,
          role: normalizeRole(fullProfile.role?.name || fullProfile.role || res.user?.role),
          bloodGroup: fullProfile.patientProfile?.bloodGroup || 'O+',
          patientProfile: fullProfile.patientProfile,
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        };
        setUser(userObj);
        return { user: userObj, token: res.accessToken };
      } catch {
        const fallbackUser = {
          ...res.user,
          name: res.user?.fullName || res.user?.name,
          role: normalizeRole(res.user?.role),
        };
        setUser(fallbackUser);
        return { user: fallbackUser, token: res.accessToken };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Backend logout error:', err.message);
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  // Demo / quick switch login helper for workspace testing & verification
  const demoLogin = (targetRole) => {
    const roleUpper = normalizeRole(targetRole);
    const demoProfiles = {
      SUPER_ADMIN: {
        id: 'usr-admin-01',
        name: 'Rajiv Sen',
        fullName: 'Rajiv Sen',
        email: 'rajiv.sen@oshudwala.in',
        phone: '+91 98301 22334',
        role: 'SUPER_ADMIN',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      },
      DOCTOR: {
        id: 'usr-doc-01',
        name: 'Dr. Priya Sharma',
        fullName: 'Dr. Priya Sharma',
        email: 'dr.priya@oshudwala.in',
        phone: '+91 98302 33445',
        role: 'DOCTOR',
        specialization: 'MBBS, MD (General Medicine)',
        clinic: 'Apollo Clinic, Salt Lake Kolkata',
        room: 'Room 204',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
      },
      PHARMACY: {
        id: 'usr-pharm-01',
        name: 'Subhash Bose',
        fullName: 'Subhash Bose (Chief Pharmacist)',
        email: 'medplus.sector5@oshudwala.in',
        phone: '+91 98303 44556',
        role: 'PHARMACY',
        pharmacyName: 'MedPlus Pharmacy - Sector V',
        license: 'WB-BIO-2023-9942',
        avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=200',
      },
      RIDER: {
        id: 'usr-rider-01',
        name: 'Rahul Das',
        fullName: 'Rahul Das',
        email: 'rahul.rider@oshudwala.in',
        phone: '+91 98304 55667',
        role: 'RIDER',
        gender: 'male',
        vehicle: 'Hero Electric (WB-02-AZ-4921)',
        zone: 'Kolkata South & Salt Lake',
        avatar: '/avatars/male-rider.svg',
      },
      RECEPTIONIST: {
        id: 'usr-recep-01',
        name: 'Ananya Roy',
        fullName: 'Ananya Roy',
        email: 'ananya.desk@apollo.oshudwala.in',
        phone: '+91 98305 66778',
        role: 'RECEPTIONIST',
        clinic: 'Apollo Clinic, Salt Lake Kolkata',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      },
      PATIENT: {
        id: 'usr-patient-01',
        name: 'Ayon Paul',
        fullName: 'Ayon Paul',
        email: 'ayon.paul@example.com',
        phone: '+91 98300 11223',
        role: 'PATIENT',
        bloodGroup: 'B+',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      },
    };

    const targetUser = demoProfiles[roleUpper] || demoProfiles.PATIENT;
    const fakeToken = `demo_jwt_token_${roleUpper.toLowerCase()}_${Date.now()}`;
    tokenStorage.setSession({
      accessToken: fakeToken,
      refreshToken: fakeToken,
      sessionId: `demo_session_${roleUpper}`,
      user: targetUser,
    });
    setUser(targetUser);
    setToken(fakeToken);
    return targetUser;
  };

  const updateUserProfile = async (updatedFields) => {
    setIsLoading(true);
    try {
      const updated = await userApi.updateProfile({
        fullName: updatedFields.name || updatedFields.fullName,
        email: updatedFields.email,
        bloodGroup: updatedFields.bloodGroup,
        allergies: updatedFields.allergies,
        medicalNotes: updatedFields.medicalNotes,
      });

      setUser((prev) => ({
        ...prev,
        name: updated.fullName || prev.name,
        fullName: updated.fullName || prev.fullName,
        email: updated.email || prev.email,
        bloodGroup: updated.patientProfile?.bloodGroup || prev.bloodGroup,
        allergies: updated.patientProfile?.allergies || prev.allergies,
        medicalNotes: updated.patientProfile?.medicalNotes || prev.medicalNotes,
      }));

      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to resolve navigation target based on role
  const getRoleDefaultPath = (roleToCheck) => {
    const role = normalizeRole(roleToCheck || user?.role);
    switch (role) {
      case 'SUPER_ADMIN':
        return '/admin';
      case 'DOCTOR':
        return '/doctor';
      case 'PHARMACY':
      case 'PHARMACIST':
        return '/pharmacy';
      case 'RIDER':
        return '/rider';
      case 'RECEPTIONIST':
        return '/receptionist';
      case 'PATIENT':
      default:
        return '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        sendOtp,
        verifyOtp,
        logout,
        demoLogin,
        updateUserProfile,
        refreshUserProfile,
        getRoleDefaultPath,
        isSuperAdmin: normalizeRole(user?.role) === 'SUPER_ADMIN',
        isDoctor: normalizeRole(user?.role) === 'DOCTOR',
        isPharmacy: ['PHARMACY', 'PHARMACIST'].includes(normalizeRole(user?.role)),
        isRider: normalizeRole(user?.role) === 'RIDER',
        isReceptionist: normalizeRole(user?.role) === 'RECEPTIONIST',
        isPatient: normalizeRole(user?.role) === 'PATIENT',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
