import apiClient from './client';

const extractList = (res) => {
  const payload = res?.data?.data ?? res?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.announcements)) return payload.announcements;
  return [];
};

export const announcementApi = {
  /**
   * Public / All portals: fetch active, non-expired announcements
   * GET /api/v1/announcements?role=PATIENT
   */
  async getActiveAnnouncements(role = '') {
    const params = {};
    if (role && role !== 'ALL') {
      params.role = String(role).toUpperCase();
    }
    const res = await apiClient.get('/announcements', { params });
    return extractList(res);
  },

  /**
   * Super Admin: list all announcements (including inactive & expired)
   * GET /api/v1/announcements/admin
   */
  async getAdminAnnouncements() {
    const res = await apiClient.get('/announcements/admin');
    return extractList(res);
  },

  /**
   * Super Admin: create & broadcast a new announcement
   * POST /api/v1/announcements
   */
  async createAnnouncement(payload) {
    const res = await apiClient.post('/announcements', payload);
    window.dispatchEvent(new Event('oshud_announcements_updated'));
    return res?.data?.data ?? res?.data;
  },

  /**
   * Super Admin: update or pause/resume an announcement
   * PATCH /api/v1/announcements/:id
   */
  async updateAnnouncement(id, payload) {
    const res = await apiClient.patch(`/announcements/${id}`, payload);
    window.dispatchEvent(new Event('oshud_announcements_updated'));
    return res?.data?.data ?? res?.data;
  },

  /**
   * Super Admin: delete an announcement
   * DELETE /api/v1/announcements/:id
   */
  async deleteAnnouncement(id) {
    const res = await apiClient.delete(`/announcements/${id}`);
    window.dispatchEvent(new Event('oshud_announcements_updated'));
    return res?.data?.data ?? res?.data;
  },
};

export default announcementApi;