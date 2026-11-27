import apiClient from './client';

export const smsApi = {
  /**
   * Super Admin: Fetch live APITxT SMS balance
   * GET /api/v1/sms/balance
   */
  async getBalance() {
    const res = await apiClient.get('/sms/balance');
    return res?.data?.data ?? res?.data;
  },
};

export default smsApi;