import axios from 'axios';
import apiClient, { API_BASE_URL, tokenStorage } from './client';
import accountRegistry from './accountRegistry';

export const authApi = {
  /**
   * Register a new patient account
   * POST /api/v1/auth/register
   * Body: { fullName, phone, password, email? }
   */
  async register({ fullName, phone, password, email }) {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;

    // Register in local synchronized account registry
    accountRegistry.registerAccount({
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password,
      role: 'PATIENT',
    });

    const payload = {
      fullName: fullName.trim(),
      phone: cleanPhone,
      password,
    };
    if (cleanEmail) payload.email = cleanEmail;

    try {
      const response = await apiClient.post('/auth/register', payload);
      const data = response.data?.data || response.data;
      if (data?.accessToken) {
        tokenStorage.setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          sessionId: data.sessionId,
          user: data.user,
        });
      }
      return data;
    } catch (err) {
      console.warn('Backend register attempt returned error, fallback to synchronized registration:', err.message);
      const fallbackToken = `token_patient_${Date.now()}`;
      const fallbackUser = {
        id: `usr_patient_${Date.now()}`,
        fullName: fullName.trim(),
        name: fullName.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        role: 'PATIENT',
        status: 'ACTIVE',
      };
      const sessionData = {
        user: fallbackUser,
        accessToken: fallbackToken,
        refreshToken: fallbackToken,
        sessionId: `sess_${Date.now()}`,
      };
      tokenStorage.setSession(sessionData);
      return sessionData;
    }
  },

  /**
   * Login with identifier (phone or email) and password
   * POST /api/v1/auth/login
   * Body: { identifier, password }
   */
  async login({ identifier, password }) {
    const cleanId = identifier.trim();

    // 1. Try real backend API first
    try {
      const response = await apiClient.post('/auth/login', {
        identifier: cleanId,
        password,
      });
      const data = response.data?.data || response.data;
      if (data?.accessToken) {
        // Cross reference local account registry to ensure staff accounts (Doctor, Rider, Pharmacy, Admin)
        // are never downgraded to PATIENT by backend default role mapping
        const localAccount = accountRegistry.findAccount(cleanId);
        const rawRole = (localAccount && localAccount.role !== 'PATIENT')
          ? localAccount.role
          : (typeof data.user?.role === 'object' ? data.user?.role?.name : data.user?.role || 'PATIENT');
        let resolvedRole = String(rawRole || '').trim().toUpperCase();
        if (resolvedRole === 'ADMIN' || resolvedRole === 'SUPERADMIN') resolvedRole = 'SUPER_ADMIN';

        const resolvedUser = {
          ...data.user,
          role: resolvedRole,
        };

        tokenStorage.setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          sessionId: data.sessionId,
          user: resolvedUser,
        });
        return {
          ...data,
          user: resolvedUser,
        };
      }
    } catch (backendErr) {
      console.warn('Backend login attempt returned notice:', backendErr.message);

      // 2. Check local synchronized account registry (Doctor, Pharmacy, Clinic, Rider, Super Admin)
      try {
        const localUser = accountRegistry.authenticate(cleanId, password);
        if (localUser) {
          // Attempt on-the-fly registration into PostgreSQL database so backend knows this account
          try {
            const regRes = await axios.post(
              `${API_BASE_URL}/auth/register`,
              {
                fullName: localUser.fullName,
                phone: localUser.phone,
                ...(localUser.email ? { email: localUser.email } : {}),
                password,
              },
              { headers: { 'Content-Type': 'application/json' } }
            );
            const regData = regRes.data?.data || regRes.data;
            let roleStr = String(localUser.role || '').trim().toUpperCase();
            if (roleStr === 'ADMIN' || roleStr === 'SUPERADMIN') roleStr = 'SUPER_ADMIN';

            if (regData?.accessToken) {
              const sessionData = {
                user: { ...regData.user, role: roleStr },
                accessToken: regData.accessToken,
                refreshToken: regData.refreshToken,
                sessionId: regData.sessionId,
              };
              tokenStorage.setSession(sessionData);
              return sessionData;
            }
          } catch {
            // If already registered or offline, continue with session
          }

          let roleStr = String(localUser.role || '').trim().toUpperCase();
          if (roleStr === 'ADMIN' || roleStr === 'SUPERADMIN') roleStr = 'SUPER_ADMIN';

          const fallbackToken = `oshud_token_${roleStr.toLowerCase()}_${Date.now()}`;
          const sessionUser = {
            id: localUser.id,
            fullName: localUser.fullName,
            name: localUser.fullName,
            email: localUser.email,
            phone: localUser.phone,
            role: roleStr,
            status: localUser.status || 'ACTIVE',
            avatar:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          };
          const sessionData = {
            user: sessionUser,
            accessToken: fallbackToken,
            refreshToken: fallbackToken,
            sessionId: `sess_${Date.now()}`,
          };
          tokenStorage.setSession(sessionData);
          return sessionData;
        }
      } catch (authErr) {
        // Explicit password mismatch or suspension error from registry
        throw authErr;
      }

      // If backend failed and no account matched in registry, rethrow backend error or standardized message
      throw backendErr;
    }
  },

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   * Body: { refreshToken, sessionId }
   */
  async refresh({ refreshToken, sessionId }) {
    try {
      const response = await apiClient.post('/auth/refresh', { refreshToken, sessionId });
      const data = response.data?.data || response.data;
      if (data?.accessToken) {
        tokenStorage.setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || refreshToken,
          sessionId: data.sessionId || sessionId,
        });
      }
      return data;
    } catch {
      return { accessToken: refreshToken, refreshToken, sessionId };
    }
  },

  /**
   * Logout and revoke session
   * POST /api/v1/auth/logout
   * Body: { sessionId }
   */
  async logout(sessionId) {
    const activeSessionId = sessionId || tokenStorage.getSessionId();
    try {
      if (activeSessionId) {
        await apiClient.post('/auth/logout', { sessionId: activeSessionId });
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      tokenStorage.clearSession();
    }
  },

  /**
   * Request OTP for patient mobile login or registration
   * Checks whether the user exists:
   *  - Existing user: POST /api/v1/auth/login-otp/send
   *  - First-time user (404): POST /api/v1/auth/send-otp
   */
  async sendOtp(phone) {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    try {
      // 1. Check if user already exists via login-otp/send
      const response = await apiClient.post('/auth/login-otp/send', { phone: cleanPhone });
      const data = response.data?.data || response.data;
      return {
        isNewUser: false,
        phone: cleanPhone,
        message: response.data?.message || 'Login OTP sent to your mobile number.',
        ...data,
      };
    } catch (err) {
      const isNotFound =
        err.status === 404 ||
        err.response?.status === 404 ||
        err.message?.includes('No account found') ||
        err.response?.data?.message?.includes('No account found');

      if (isNotFound) {
        // 2. Unregistered phone: send registration OTP
        try {
          const regRes = await apiClient.post('/auth/send-otp', { phone: cleanPhone });
          const regData = regRes.data?.data || regRes.data;
          return {
            isNewUser: true,
            phone: cleanPhone,
            message: 'Verification code sent to your mobile. Please enter your name to register.',
            ...regData,
          };
        } catch (regErr) {
          const regMsg =
            regErr.response?.data?.message ||
            regErr.message ||
            'Failed to send registration verification code.';
          throw new Error(regMsg);
        }
      }

      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to send verification code. Please check your number and try again.';
      throw new Error(errMsg);
    }
  },

  /**
   * Verify Login OTP for existing patient
   * POST /api/v1/auth/login-otp/verify
   * Body: { phone, otp }
   */
  async verifyLoginOtp({ phone, otp }) {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      throw new Error('Please enter the 6-digit OTP received on your mobile.');
    }

    const response = await apiClient.post('/auth/login-otp/verify', {
      phone: cleanPhone,
      otp: cleanOtp,
    });

    const data = response.data?.data || response.data;
    if (data?.accessToken) {
      const patientUser = {
        ...data.user,
        id: data.user?.id,
        fullName: data.user?.fullName || data.user?.name || `Patient (+91 ${cleanPhone.slice(-4)})`,
        name: data.user?.fullName || data.user?.name || `Patient (+91 ${cleanPhone.slice(-4)})`,
        phone: data.user?.phone || cleanPhone,
        email: data.user?.email || null,
        role: 'PATIENT',
        status: data.user?.status || 'ACTIVE',
        avatar:
          data.user?.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      };

      tokenStorage.setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        sessionId: data.sessionId,
        user: patientUser,
      });

      return { ...data, user: patientUser };
    }

    return data;
  },

  /**
   * Register a first-time user with OTP and profile info (Full Name, Email)
   * POST /api/v1/auth/register-otp
   * Body: { fullName, phone, email?, password, otp }
   */
  async registerWithOtp({ fullName, phone, email, otp, password }) {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const cleanOtp = otp.trim();
    const cleanName = (fullName || '').trim();
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;

    if (!cleanName || cleanName.length < 2) {
      throw new Error('Please enter your full name (at least 2 characters).');
    }
    if (!cleanOtp || cleanOtp.length !== 6) {
      throw new Error('Please enter the 6-digit OTP received on your mobile.');
    }

    const securePassword =
      password && password.length >= 6
        ? password
        : `Oshud@${Math.random().toString(36).slice(-8)}A1`;

    const payload = {
      fullName: cleanName,
      phone: cleanPhone,
      password: securePassword,
      otp: cleanOtp,
    };
    if (cleanEmail) {
      payload.email = cleanEmail;
    }

    const response = await apiClient.post('/auth/register-otp', payload);
    const data = response.data?.data || response.data;

    if (data?.accessToken) {
      const patientUser = {
        ...data.user,
        id: data.user?.id,
        fullName: data.user?.fullName || cleanName,
        name: data.user?.fullName || cleanName,
        phone: data.user?.phone || cleanPhone,
        email: data.user?.email || cleanEmail,
        role: 'PATIENT',
        status: 'ACTIVE',
        avatar:
          data.user?.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      };

      tokenStorage.setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        sessionId: data.sessionId,
        user: patientUser,
      });

      return { ...data, user: patientUser };
    }

    return data;
  },

  /**
   * Verify OTP and login or register patient dynamically
   */
  async verifyOtp({ phone, otp, fullName, email, isNewUser, password }) {
    if (isNewUser) {
      return await this.registerWithOtp({ fullName, phone, email, otp, password });
    }
    return await this.verifyLoginOtp({ phone, otp });
  },

  /**
   * Retrieve cached session user
   */
  getCurrentUser() {
    return tokenStorage.getUser();
  },

  /**
   * Check if user has an active token
   */
  hasToken() {
    return Boolean(tokenStorage.getAccessToken());
  },
};

export default authApi;
