import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [token, setToken] = useState(() => localStorage.getItem('oshud_token'));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If no user exists initially, provide a patient profile for seamless exploration
    if (!user) {
      const defaultPatient = {
        id: "usr-ayon-101",
        name: "Ayon Paul",
        email: "ayon@oshudwala.com",
        phone: "+880 1712-345678",
        role: "patient",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        address: "House 24, Road 7, Dhanmondi, Dhaka",
        walletBalance: 250,
        referralCode: "OSHUD-CARE-99",
        bloodGroup: "O+",
        emergencyContact: "+880 1799-887766"
      };
      localStorage.setItem('oshud_user', JSON.stringify(defaultPatient));
      localStorage.setItem('oshud_token', 'mock-demo-session-token');
      setUser(defaultPatient);
      setToken('mock-demo-session-token');
    }
  }, [user]);

  const login = async ({ email, password, role }) => {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        updateUserProfile
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
