'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'customer' | 'vendor' | 'rider' | 'admin';

interface UserData {
  uid: string;
  fullName?: string;
  phoneNumber: string;
  email?: string;
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
  restrictionExpires?: string;
  lastPenaltyAt?: string;
  lastRecoveryAt?: string;
  isRaining?: boolean;
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const request = async (path: string, options: RequestInit = {}) => {
    if (!API_URL) throw new Error('API URL not configured');
    const token = typeof window !== 'undefined' ? localStorage.getItem('qw_token') : null;
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers 
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  useEffect(() => {
    // Check session validity on mount if needed
    setLoading(false);
  }, []);

  const signup = async (data: Omit<UserData, 'uid'>) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      if (!data.phoneNumber || !/^\d{11}$/.test(data.phoneNumber)) throw new Error('Phone number must be exactly 11 digits!');
      if (data.role === 'rider' && (!data.nin || !/^\d{11}$/.test(data.nin))) throw new Error('NIN must be 11 digits!');

      const response = await request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      const { user: newUser, token } = response;
      
      const needsApproval = data.role !== 'customer';
      if (needsApproval) {
        router.push(`/auth?login=true&message=pending&role=${data.role}`);
      } else {
        localStorage.setItem('qw_user', JSON.stringify(newUser));
        localStorage.setItem('qw_token', token);
        setUser(newUser);
        router.push('/customer');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const login = async (phoneNumber: string, password?: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, password })
      });
      
      const { user: foundUser, token } = response;
      
      if (!foundUser.isApproved) throw new Error('Account pending approval');
      
      localStorage.setItem('qw_user', JSON.stringify(foundUser));
      localStorage.setItem('qw_token', token);
      setUser(foundUser);
      
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
    localStorage.removeItem('qw_user');
    localStorage.removeItem('qw_token');
    localStorage.removeItem('qw_current_order_id');
    setUser(null);
    router.push('/auth');
  }, [router]);

  const approveUser = async (phoneNumber: string) => {
    try {
      return await request(`/admin/approve/${phoneNumber}`, { method: 'POST' });
    } catch (err: any) {
      console.error(err);
      return [];
    }
  };

  return { user, loading, isProcessing, error, login, signup, logout, approveUser };
}
