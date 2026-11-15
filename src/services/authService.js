import apiClient from './api';

export const authService = {
  async login({ email, password, role = 'patient' }) {
    try {
      const response = await apiClient.post('/auth/login', { email, password, role });
      return response.data;
    } catch (err) {
      console.info('Backend auth unavailable, utilizing development authentication session.', err?.message);
      // Realistic development mock user
      const mockUser = {
        id: "usr-" + Date.now(),
        name: email.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()) || "Ayon Paul",
        email: email,
        phone: "+880 1712-345678",
        role: role,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        address: "House 24, Road 7, Dhanmondi, Dhaka",
        walletBalance: 250,
        referralCode: "OSHUD-CARE-99",
      };
      const token = "mock-jwt-token-" + Date.now();
      localStorage.setItem('oshud_token', token);
      localStorage.setItem('oshud_user', JSON.stringify(mockUser));
      return { user: mockUser, token, isMock: true };
    }
  },

  async register({ name, email, phone, password }) {
    try {
      const response = await apiClient.post('/auth/register', { name, email, phone, password });
      return response.data;
    } catch (err) {
      console.info('Backend registration unavailable, using development session.', err?.message);
      const mockUser = {
        id: "usr-" + Date.now(),
        name,
        email,
        phone,
        role: 'patient',
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        walletBalance: 50,
        referralCode: "OSHUD-" + Math.floor(1000 + Math.random() * 9000),
      };
      const token = "mock-jwt-token-" + Date.now();
      localStorage.setItem('oshud_token', token);
      localStorage.setItem('oshud_user', JSON.stringify(mockUser));
      return { user: mockUser, token, isMock: true };
    }
  },

  getCurrentUser() {
    const saved = localStorage.getItem('oshud_user');
    return saved ? JSON.parse(saved) : null;
  },

  logout() {
    localStorage.removeItem('oshud_token');
    localStorage.removeItem('oshud_user');
  }
};
