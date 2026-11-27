import apiClient from './client';

const NOTIF_STORAGE_PREFIX = 'oshud_user_real_notifs_';

const getStorageKey = (userId) => {
  const targetId = userId || 'current_user';
  return `${NOTIF_STORAGE_PREFIX}${targetId}`;
};

export const notificationApi = {
  /**
   * Fetch authenticated user's original notifications from backend
   * GET /api/v1/notifications
   * (Strictly original data only — NO demo/dummy templates)
   */
  async getNotifications({ page = 1, limit = 20, unreadOnly = false, category = '' } = {}, currentUser = null) {
    const userId = currentUser?.id || currentUser?.userId;

    try {
      const params = {};
      if (page) params.page = page;
      if (limit) params.limit = limit;
      if (unreadOnly) params.unreadOnly = true;
      if (category) params.category = category;

      const res = await apiClient.get('/notifications', { params });
      const data = res.data?.data || res.data;

      if (data && Array.isArray(data.items)) {
        // Cache original items locally for instant offline display
        const mapped = data.items.map((item) => {
          let link = item.data?.link;
          if (!link) {
            const cat = String(item.category || '').toUpperCase();
            const userRole = String(currentUser?.role?.name || currentUser?.role || '').toUpperCase();
            if (userRole.includes('PHARMAC')) {
              if (cat === 'PRESCRIPTION') link = '/pharmacy/prescriptions';
              else if (cat === 'ORDER') link = '/pharmacy/orders';
              else if (cat === 'DELIVERY') link = '/pharmacy/pickup';
              else link = '/pharmacy';
            } else if (userRole.includes('RIDER')) {
              link = '/rider/deliveries';
            } else if (userRole.includes('ADMIN')) {
              link = '/admin/orders';
            } else {
              link = cat === 'ORDER' || cat === 'DELIVERY' ? '/orders' : '/profile';
            }
          }

          return {
            id: item.id,
            title: item.title,
            desc: item.body,
            body: item.body,
            category: item.category,
            priority: item.priority || 'NORMAL',
            link,
            readAt: item.readAt,
            isRead: Boolean(item.readAt),
            createdAt: item.createdAt,
          };
        });

        try {
          localStorage.setItem(getStorageKey(userId), JSON.stringify(mapped));
        } catch (e) {}

        return {
          items: mapped,
          total: data.total ?? mapped.length,
          unreadCount: data.unreadCount ?? mapped.filter((i) => !i.readAt).length,
        };
      }
    } catch (err) {
      console.warn('Backend notification fetch note (using local cache if available):', err);
    }

    // Fallback to local cache of real user notifications only
    let cached = [];
    try {
      const raw = localStorage.getItem(getStorageKey(userId));
      if (raw) {
        cached = JSON.parse(raw);
      }
    } catch (e) {}

    let filtered = [...cached];
    if (unreadOnly) {
      filtered = filtered.filter((n) => !n.isRead && !n.readAt);
    }
    if (category) {
      filtered = filtered.filter((n) => n.category === category);
    }

    const unreadCount = cached.filter((n) => !n.isRead && !n.readAt).length;

    return {
      items: filtered,
      total: cached.length,
      unreadCount,
    };
  },

  /**
   * Get unread notification count
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(currentUser = null) {
    try {
      const res = await apiClient.get('/notifications/unread-count');
      const data = res.data?.data || res.data;
      if (data && typeof data.unreadCount === 'number') {
        return data.unreadCount;
      }
    } catch (e) {}

    const result = await this.getNotifications({}, currentUser);
    return result.unreadCount || 0;
  },

  /**
   * Mark a specific notification as read
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(notificationId, currentUser = null) {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    } catch (e) {}

    const userId = currentUser?.id || currentUser?.userId;
    const storageKey = getStorageKey(userId);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const list = JSON.parse(raw);
        const next = list.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        );
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
    } catch (e) {}

    return { success: true, id: notificationId };
  },

  /**
   * Mark all notifications as read for current user
   * PATCH /api/v1/notifications/read-all
   */
  async markAllAsRead(currentUser = null) {
    try {
      await apiClient.patch('/notifications/read-all');
    } catch (e) {}

    const userId = currentUser?.id || currentUser?.userId;
    const storageKey = getStorageKey(userId);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const list = JSON.parse(raw);
        const next = list.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }));
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
    } catch (e) {}

    return { success: true };
  },

  /**
   * Delete a notification for current user
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(notificationId, currentUser = null) {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
    } catch (e) {}

    const userId = currentUser?.id || currentUser?.userId;
    const storageKey = getStorageKey(userId);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const list = JSON.parse(raw);
        const next = list.filter((n) => n.id !== notificationId);
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
    } catch (e) {}

    return { success: true, id: notificationId };
  },

  /**
   * Clear all read notifications for current user
   * DELETE /api/v1/notifications
   */
  async clearReadNotifications(currentUser = null) {
    try {
      await apiClient.delete('/notifications');
    } catch (e) {}

    const userId = currentUser?.id || currentUser?.userId;
    const storageKey = getStorageKey(userId);
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const list = JSON.parse(raw);
        const next = list.filter((n) => !n.isRead && !n.readAt);
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
    } catch (e) {}

    return { success: true };
  },

  /**
   * Create an in-app notification in backend for user action
   * POST /api/v1/notifications
   */
  async createNotification(notificationData, currentUser = null) {
    let created = null;
    try {
      const res = await apiClient.post('/notifications', notificationData);
      created = res.data?.data || res.data;
    } catch (e) {
      created = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: notificationData.title,
        body: notificationData.body,
        category: notificationData.category || 'SYSTEM',
        data: notificationData.data || {},
        createdAt: new Date().toISOString(),
        readAt: null,
      };
    }

    // Save to local cache
    const userId = notificationData.userId || currentUser?.id || currentUser?.userId;
    if (userId && created) {
      const storageKey = getStorageKey(userId);
      try {
        const raw = localStorage.getItem(storageKey);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift({
          id: created.id,
          title: created.title,
          desc: created.body,
          body: created.body,
          category: created.category,
          priority: created.priority || 'NORMAL',
          link: created.data?.link || '/profile',
          readAt: null,
          isRead: false,
          createdAt: created.createdAt || new Date().toISOString(),
        });
        localStorage.setItem(storageKey, JSON.stringify(list));
      } catch (e) {}
    }

    return created;
  },

  /**
   * Register or update a device FCM token
   * POST /api/v1/notifications/device-token
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
   */
  async updatePreferences(preferencesData) {
    const response = await apiClient.put('/notifications/preferences', preferencesData);
    return response.data?.data || response.data;
  },

  /**
   * Send a test push notification
   * POST /api/v1/notifications/test-push
   */
  async testPushNotification({ title, body }) {
    const response = await apiClient.post('/notifications/test-push', { title, body });
    return response.data?.data || response.data;
  },
};

export default notificationApi;
