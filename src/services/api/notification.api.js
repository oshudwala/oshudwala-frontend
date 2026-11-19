import apiClient from './client';

export const notificationApi = {
  /**
   * Register or update a device FCM token
   * POST /api/v1/notifications/device-token
   * Body: { fcmToken, deviceType, deviceId? }
   */
  async registerDeviceToken({ fcmToken, deviceType = 'WEB', deviceId }) {
    const payload = { fcmToken, deviceType };
    if (deviceId) payload.deviceId = deviceId;
    const response = await apiClient.post('/notifications/device-token', payload);
    return response.data?.data || response.data;
  },

  /**
   * Remove a device FCM token upon logout
   * POST /api/v1/notifications/device-token/remove
   * Body: { fcmToken }
   */
  async removeDeviceToken(fcmToken) {
    if (!fcmToken) return null;
    const response = await apiClient.post('/notifications/device-token/remove', { fcmToken });
    return response.data?.data || response.data;
  },

  /**
   * Get user's notification preferences
   * GET /api/v1/notifications/preferences
   */
  async getPreferences() {
    const response = await apiClient.get('/notifications/preferences');
    return response.data?.data || response.data;
  },

  /**
   * Update notification preferences
   * PUT /api/v1/notifications/preferences
   * Body: { globalSettings?, categories? }
   */
  async updatePreferences(preferencesData) {
    const response = await apiClient.put('/notifications/preferences', preferencesData);
    return response.data?.data || response.data;
  },

  /**
   * Send a test push notification
   * POST /api/v1/notifications/test-push
   * Body: { title, body }
   */
  async testPushNotification({ title, body }) {
    const response = await apiClient.post('/notifications/test-push', { title, body });
    return response.data?.data || response.data;
  },
};

export default notificationApi;
