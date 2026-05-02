'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/ApiService';
import { API_URLS } from '@/lib/api-config';

export type UserRole = 'customer' | 'vendor' | 'rider' | 'admin' | 'super-admin' | 'super-sub-admin';

interface UserData {
  uid: string;
  fullName?: string;
  phoneNumber: string;
  email: string;
  role: UserRole;
  shopName?: string;
  shopAddress?: string;
  vehicleType?: string;
  isApproved?: boolean;
  nin?: string;
  address?: string;
  whatsappNumber?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  turnaroundTime?: string;
  capacity?: number;
  trustPoints?: number;
  trustScore?: number;
  walletBalance?: number;
  pendingBalance?: number;
  badges?: string[];
  status?: 'active' | 'restricted' | 'suspended';
  landmark?: string;
  shopImage?: string;
  ninImage?: string;
  transferReference?: string;
  currentOrderId?: string;
  yorubaAudioEnabled?: boolean;
  alerts?: any[];
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  isProcessing: boolean;
  error: string | null;
  login: (identifier: string, password?: string) => Promise<void>;
  signup: (data: Omit<UserData, 'uid'>) => Promise<void>;
  logout: () => void;
  approveUser: (uid: string) => Promise<UserData>;
  updateUser: (updatedData: Partial<UserData>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchMe = useCallback(async () => {
    try {
      const data = await api.getMe();
      if (data) {
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('qw_token');
      if (token) {
        fetchMe();
      } else {
        setLoading(false);
      }
    }
  }, [fetchMe]);

  const signup = async (data: Omit<UserData, 'uid'>) => {
    setIsProcessing(true);
    setError(null);
    
    if (!data.phoneNumber || !/^\d{11}$/.test(data.phoneNumber)) {
      setError('Phone number must be exactly 11 digits!');
      setIsProcessing(false);
      return;
    }

    if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
      setError('Please provide a valid email address.');
      setIsProcessing(false);
      return;
    }

    if (data.role === 'rider') {
      if (!data.nin || !/^\d{11}$/.test(data.nin)) {
        setError('NIN must be exactly 11 digits!');
        setIsProcessing(false);
        return;
      }
    }

    try {
      const response = await fetch(`${API_URLS.base}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Signup failed');

      const { user: newUser, token } = result;
      if (token) localStorage.setItem('qw_token', token);

      if (!newUser.isApproved) {
        router.push(`/auth?login=true&message=pending&role=${data.role}`);
      } else {
        setUser(newUser);
        router.push('/customer');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const login = async (identifier: string, password?: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URLS.base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Login failed');

      const { user: foundUser, token } = result;
      if (token) localStorage.setItem('qw_token', token);

      if (!foundUser.isApproved) {
        setError('Your account is pending approval. Please contact admin.');
        setIsProcessing(false);
        return;
      }

      setUser(foundUser);
      if (foundUser.role === 'admin' || foundUser.role === 'super-admin' || foundUser.role === 'super-sub-admin') router.push('/admin');
      else if (foundUser.role === 'vendor') router.push('/vendor');
      else if (foundUser.role === 'rider') router.push('/rider');
      else router.push('/customer');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('qw_token');
    localStorage.removeItem('qw_current_order_id');
    setUser(null);
    router.push('/auth?login=true');
  }, [router]);

  const updateUser = useCallback((updatedData: Partial<UserData>) => {
    setUser(prev => prev ? { ...prev, ...updatedData } : null);
  }, []);

  const approveUser = async (uid: string) => {
    return await api.approveUser(uid);
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'qw_token') {
        if (!e.newValue) {
          setUser(null);
          router.push('/auth?login=true');
        } else {
          fetchMe();
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [router, fetchMe]);

  useEffect(() => {
    if (!user) return;
    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => logout(), 60 * 60 * 1000);
    };
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();
    events.forEach(event => document.addEventListener(event, handleActivity));
    resetTimer();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, handleActivity));
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, loading, isProcessing, error, login, signup, logout, approveUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a fallback or throw error. 
    // To support existing direct calls without AuthProvider, we might want to return context check, 
    // but better to enforce AuthProvider in layout.
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
