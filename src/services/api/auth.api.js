import apiClient, { tokenStorage } from './client';

export const authApi = {
  /**
   * Register a new patient account
   * POST /api/v1/auth/register
   * Body: { fullName, phone, password, email? }
   */
  async register({ fullName, phone, password, email }) {
    const payload = {
      fullName: fullName.trim(),
      phone: phone.trim().replace(/[^0-9]/g, ''),
      password,
    };
    if (email && email.trim()) {
      payload.email = email.trim().toLowerCase();
    }
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
  },

  /**
   * Login with identifier (phone or email) and password
   * POST /api/v1/auth/login
   * Body: { identifier, password }
   */
  async login({ identifier, password }) {
    const payload = {
      identifier: identifier.trim(),
      password,
    };
    const response = await apiClient.post('/auth/login', payload);
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
  },

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   * Body: { refreshToken, sessionId }
   */
  async refresh({ refreshToken, sessionId }) {
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
    } finally {
      tokenStorage.clearSession();
    }
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
