'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { API_URLS } from '@/lib/api';

export type UserRole = 'customer' | 'vendor' | 'rider' | 'admin' | 'super-sub-admin';

interface UserData {
  uid: string;
  fullName?: string;
  phoneNumber: string;
  email: string; // Made email mandatory
  password?: string;
  landmark?: string;
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
  trustScore?: number; // 0-100
  walletBalance?: number;
  pendingBalance?: number;
  badges?: string[];
  status?: 'active' | 'restricted' | 'suspended';
  shopImage?: string; // New field
  ninImage?: string;  // New field
  transferReference?: string; // New field
}

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('qw_user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Initial load check
    Promise.resolve().then(() => setLoading(false));
  }, []);

  const signup = async (data: Omit<UserData, 'uid'>) => {
    setIsProcessing(true);
    setError(null);

    // Validation
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
      const response = await fetch(API_URLS.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Signup failed');
      }

      const { user: newUser, token } = result;

      if (token) localStorage.setItem('qw_token', token);

      if (!newUser.isApproved) {
        router.push(`/auth?login=true&message=pending&role=${data.role}`);
      } else {
        localStorage.setItem('qw_user', JSON.stringify(newUser));
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
      const response = await fetch(API_URLS.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      const { user: foundUser, token } = result;

      if (token) localStorage.setItem('qw_token', token);

      if (!foundUser.isApproved) {
        setError('Your account is pending approval. Please contact admin.');
        setIsProcessing(false);
        return;
      }

      localStorage.setItem('qw_user', JSON.stringify(foundUser));
      setUser(foundUser);

      // Role-based redirection
      if (foundUser.role === 'admin' || foundUser.role === 'super-sub-admin') router.push('/admin');
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
    localStorage.removeItem('qw_user');
    localStorage.removeItem('qw_token');
    localStorage.removeItem('qw_current_order_id');
    setUser(null);
    router.push('/auth?login=true');
  }, [router]);

  // Sync auth state across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'qw_user') {
        const newUser = e.newValue ? JSON.parse(e.newValue) : null;
        setUser(newUser);
        if (!newUser) router.push('/auth?login=true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [router]);

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

  const approveUser = (phoneNumber: string) => {
    const users = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    const updatedUsers = users.map((u: any) =>
      u.phoneNumber === phoneNumber ? { ...u, isApproved: true } : u
    );
    localStorage.setItem('qw_all_users', JSON.stringify(updatedUsers));
    return updatedUsers;
  };

  return { user, loading, isProcessing, error, login, signup, logout, approveUser };
}
