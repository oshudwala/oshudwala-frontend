import apiClient from './api';

export const authService = {
  async login({ email, password, role = 'patient' }) {
    try {
      const response = await apiClient.post('/auth/login', { email, password, role });
      return response.data;
    } catch (err) {
      console.info('Backend auth unavailable, utilizing development authentication session.', err?.message);
      
      let name = "Ayon Paul";
      let avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";

      if (role === 'doctor') {
        name = "Dr. Priya Sharma";
        avatar = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200";
      } else if (role === 'pharmacist') {
        name = "MedPlus Pharmacist (Kolkata)";
        avatar = "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=200";
      }

      const mockUser = {
        id: "usr-" + Date.now(),
        name,
        email,
        phone: "+91 98301 23456",
        role: role, // 'patient' | 'doctor' | 'pharmacist'
        avatar,
        address: "Flat 4B, Greenwood Park, Salt Lake Sector 1, Kolkata-700064, West Bengal",
        walletBalance: 250,
        referralCode: "OSHUD-CARE-99",
        licenseNumber: role === 'doctor' ? 'WBMC-74192 (West Bengal Medical Council)' : role === 'pharmacist' ? 'WBSPC-A-1982 (WB Pharmacy Council)' : undefined
      };
      const token = "mock-jwt-token-" + Date.now();
      localStorage.setItem('oshud_token', token);
      localStorage.setItem('oshud_user', JSON.stringify(mockUser));
      return { user: mockUser, token, isMock: true };
    }
  },

  async register({ name, email, phone, password, role = 'patient' }) {
    try {
      const response = await apiClient.post('/auth/register', { name, email, phone, password, role });
      return response.data;
    } catch (err) {
      console.info('Backend registration unavailable, using development session.', err?.message);
      const mockUser = {
        id: "usr-" + Date.now(),
        name,
        email,
        phone: phone || "+91 98301 23456",
        role: role,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        address: "Salt Lake, Kolkata, West Bengal",
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
