import { authApi } from './api/auth.api';

export const authService = {
  login: ({ email, identifier, password, role }) => authApi.login({ identifier: identifier || email, password }),
  register: ({ fullName, name, email, phone, password }) => authApi.register({ fullName: fullName || name, email, phone, password }),
  getCurrentUser: () => authApi.getCurrentUser(),
  logout: () => authApi.logout(),
};

export default authService;
