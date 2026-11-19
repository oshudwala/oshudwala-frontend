import axios from 'axios';

// Resolve API base URL from Vite environment variable
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://oshudwalla-backend-1.onrender.com';
export const API_BASE_URL = rawBaseUrl.endsWith('/api/v1') 
  ? rawBaseUrl 
  : `${rawBaseUrl.replace(/\/+$/, '')}/api/v1`;

// Token & Session Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'oshud_access_token',
  REFRESH_TOKEN: 'oshud_refresh_token',
  SESSION_ID: 'oshud_session_id',
  USER: 'oshud_user',
};

// Safe storage accessors
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem('oshud_token'),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  getSessionId: () => localStorage.getItem(STORAGE_KEYS.SESSION_ID),
  getUser: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setSession: ({ accessToken, refreshToken, sessionId, user }) => {
    if (accessToken) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem('oshud_token', accessToken); // backwards compatibility
    }
    if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    if (sessionId) localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem('oshud_token');
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
};

// Centralized Axios Instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Event listener for auth session expiry
const authEventTarget = new EventTarget();
export const onSessionExpired = (callback) => {
  const handler = () => callback();
  authEventTarget.addEventListener('session_expired', handler);
  return () => authEventTarget.removeEventListener('session_expired', handler);
};

// Request Interceptor: Attach Bearer JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency queue for handling multiple requests during token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle Refresh Token Rotation & Error Normalization
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Normalize error message
    const normalizedError = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        (Array.isArray(error.response?.data?.errors) && error.response.data.errors[0]?.message) ||
        error.message ||
        'An unexpected network error occurred.',
      data: error.response?.data,
      isNetworkError: !error.response,
    };

    // If not a 401, or already retried, or request was to auth/refresh or auth/login, reject immediately
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(normalizedError);
    }

    const refreshToken = tokenStorage.getRefreshToken();
    const sessionId = tokenStorage.getSessionId();

    // If no refresh credentials exist, clear session and reject
    if (!refreshToken || !sessionId) {
      tokenStorage.clearSession();
      authEventTarget.dispatchEvent(new Event('session_expired'));
      return Promise.reject(normalizedError);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Direct call without interceptors to avoid circular refresh loops
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken, sessionId },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const refreshData = refreshResponse.data?.data || refreshResponse.data;
      const newAccessToken = refreshData?.accessToken;
      const newRefreshToken = refreshData?.refreshToken || refreshToken;
      const newSessionId = refreshData?.sessionId || sessionId;

      if (!newAccessToken) {
        throw new Error('Invalid token refresh response from server');
      }

      tokenStorage.setSession({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        sessionId: newSessionId,
      });

      apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      tokenStorage.clearSession();
      authEventTarget.dispatchEvent(new Event('session_expired'));
      return Promise.reject({
        status: 401,
        message: 'Your session has expired. Please sign in again.',
        isExpired: true,
      });
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
