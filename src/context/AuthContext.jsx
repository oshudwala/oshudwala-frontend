import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [token, setToken] = useState(() => localStorage.getItem('oshud_token'));
  const [isLoading, setIsLoading] = useState(false);

  const login = async ({ email, password, role = 'patient' }) => {
    setIsLoading(true);
    try {
      const result = await authService.login({ email, password, role });
      setUser(result.user);
      setToken(result.token);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const result = await authService.register(userData);
      setUser(result.user);
      setToken(result.token);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const updateUserProfile = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('oshud_user', JSON.stringify(updated));
      return updated;
    });
  };

  const switchRole = (newRole) => {
    if (!user) return;
    const updated = {
      ...user,
      role: newRole,
      name: newRole === 'doctor' ? 'Dr. Priya Sharma' : newRole === 'pharmacist' ? 'MedPlus Pharmacist' : 'Ayon Paul',
      avatar: newRole === 'doctor'
        ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'
        : newRole === 'pharmacist'
        ? 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&q=80&w=200'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    };
    setUser(updated);
    localStorage.setItem('oshud_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updateUserProfile,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
