'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/DatabaseService';

export type UserRole = 'customer' | 'vendor' | 'rider' | 'admin';

interface UserData {
  uid: string;
  fullName?: string;
  phoneNumber: string;
  email: string;
  password?: string;
  landmark?: string;
  role: UserRole;
  shopName?: string;
  shopAddress?: string;
  vehicleType?: string;
  isApproved: boolean;
  nin?: string;
  address?: string;
  whatsappNumber?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  turnaroundTime?: string;
  capacity?: number;
  trustPoints: number;
  trustScore: number;
  walletBalance: number;
  pendingBalance: number;
  badges?: string[];
  status: 'active' | 'restricted' | 'suspended';
  restrictionExpires?: string;
  isRaining?: boolean;
  shopImage?: string;
  ninImage?: string;
  transferReference?: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load user data from server if token exists
  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('qw_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      // We'll use getUsers and filter for self or a dedicated profile endpoint
      const userData = await db.fetchAPI('/api/users/profile');
      if (userData) {
        setUser(userData);
      } else {
        localStorage.removeItem('qw_token');
      }
    } catch (err) {
      localStorage.removeItem('qw_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signup = async (data: Omit<UserData, 'uid' | 'isApproved' | 'walletBalance' | 'pendingBalance' | 'trustPoints' | 'trustScore' | 'status'>) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await db.signup(data);
      const { user: newUser, token } = result;
      
      if (token) localStorage.setItem('qw_token', token);

      // Handle the case where result.user might not match the expected type
      // but db.signup should return a full UserData on success
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

  const login = async (phoneOrEmail: string, password?: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await db.login(phoneOrEmail, password);
      const { user: foundUser, token } = result;
      
      if (token) localStorage.setItem('qw_token', token);

      if (!foundUser.isApproved) {
        setError('Your account is pending approval. Please contact admin.');
        setIsProcessing(false);
        return;
      }

      setUser(foundUser);
      
      // Role-based redirection
      if (foundUser.role === 'admin') router.push('/admin');
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
    localStorage.clear(); // Clear everything
    setUser(null);
    router.push('/auth');
  }, [router]);

  const approveUser = async (uid: string, isApproved: boolean = true) => {
    setIsProcessing(true);
    setError(null);
    try {
      await db.approveUser(uid, isApproved);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Sync auth state across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'qw_token') {
        if (!e.newValue) {
          setUser(null);
          router.push('/');
        } else {
          refreshUser();
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [router, refreshUser]);

  // Inactivity Logout (30 minutes)
  useEffect(() => {
    if (!user) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        alert('You have been logged out due to inactivity.');
      }, 30 * 60 * 1000); // 30 minutes
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

  return { user, loading, isProcessing, error, login, signup, logout, approveUser };
}
