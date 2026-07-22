'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  requestOTP as requestOTPAction,
  verifyOTP as verifyOTPAction,
  verifyOTPForOnboarding as verifyOTPForOnboardingAction,
  registerUser as registerUserAction,
  logout as logoutAction,
  getCurrentUser,
} from '@/app/actions/auth';

interface User {
  id: string;
  phoneNumber: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  requestOTP: (phoneNumber: string, email?: string, isRegister?: boolean) => Promise<{ success: boolean; error?: string; email?: string; mailError?: string | null; fallbackOtp?: string | null; otp?: string }>;
  verifyOTP: (phoneNumber: string, otp: string, name?: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTPForOnboarding: (phoneNumber: string, otp: string, email?: string) => Promise<{ success: boolean; error?: string; needsOnboarding?: boolean; email?: string; phoneNumber?: string; user?: User }>;
  registerUser: (phoneNumber: string, email: string, name: string, onboarding: { isFreelancer: boolean; isSkillExchanger: boolean; isFoodVendor: boolean }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const res = await getCurrentUser();
      if (res.success && res.user) {
        setUser(res.user as User);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Error refreshing user:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const requestOTP = async (phoneNumber: string, email?: string, isRegister?: boolean) => {
    return await requestOTPAction(phoneNumber, email || '', isRegister);
  };

  const verifyOTP = async (phoneNumber: string, otp: string, name?: string, email?: string) => {
    const res = await verifyOTPAction(phoneNumber, otp, name, email);
    if (res.success && res.user) {
      setUser(res.user as User);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const verifyOTPForOnboarding = async (phoneNumber: string, otp: string, email?: string) => {
    const res = await verifyOTPForOnboardingAction(phoneNumber, otp, email);
    if (res.success && !res.needsOnboarding && res.user) {
      setUser(res.user as User);
    }
    return res as { success: boolean; error?: string; needsOnboarding?: boolean; email?: string; phoneNumber?: string; user?: User };
  };

  const registerUser = async (
    phoneNumber: string,
    email: string,
    name: string,
    onboarding: { isFreelancer: boolean; isSkillExchanger: boolean; isFoodVendor: boolean }
  ) => {
    const res = await registerUserAction(phoneNumber, email, name, onboarding);
    if (res.success && res.user) {
      setUser(res.user as User);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = async () => {
    try {
      await logoutAction();
    } catch (e) {
      console.warn('Logout action error:', e);
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}
      window.location.href = '/login';
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, requestOTP, verifyOTP, verifyOTPForOnboarding, registerUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
