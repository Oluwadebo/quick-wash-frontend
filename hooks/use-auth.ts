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
    // Initialize super-admin if not exists
    const users = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    const superAdminPhone = '09012345678'; // Secret Super Admin Phone
    if (!users.find((u: any) => u.phoneNumber === superAdminPhone)) {
      users.push({
        uid: 'admin_001',
        fullName: 'Super Admin',
        phoneNumber: superAdminPhone,
        password: 'admin_password_123',
        role: 'admin',
        isApproved: true,
        trustPoints: 100,
        trustScore: 100,
        walletBalance: 0,
        pendingBalance: 0,
        status: 'active',
        badges: ['👑 Super Admin']
      });
      localStorage.setItem('qw_all_users', JSON.stringify(users));
    }

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

    if (data.role === 'rider') {
      if (!data.nin || !/^\d{11}$/.test(data.nin)) {
        setError('NIN must be exactly 11 digits!');
        setIsProcessing(false);
        return;
      }
    }
    if (data.role === 'vendor' || data.role === 'rider') {
      if (data.bankAccountNumber && !/^\d+$/.test(data.bankAccountNumber)) {
        setError('Bank Account Number must be numbers only!');
        setIsProcessing(false);
        return;
      }
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const users = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    if (users.find((u: any) => u.phoneNumber === data.phoneNumber)) {
      setError('This phone number is already registered!');
      setIsProcessing(false);
      return;
    }
    
    // Vendors, Riders, and Moderator Admins need approval
    const needsApproval = data.role !== 'customer';
    const newUser: UserData = { 
      ...data, 
      uid: `u_${Math.random().toString(36).substr(2, 9)}`,
      isApproved: !needsApproval,
      trustPoints: data.role === 'customer' ? 50 : 0,
      trustScore: 100,
      walletBalance: 0,
      pendingBalance: 0,
      status: 'active',
      badges: data.role === 'customer' ? ['🌱 Newcomer'] : []
    };

    users.push(newUser);
    localStorage.setItem('qw_all_users', JSON.stringify(users));
    
    if (needsApproval) {
      router.push(`/auth?login=true&message=pending&role=${data.role}`);
    } else {
      localStorage.setItem('qw_user', JSON.stringify(newUser));
      setUser(newUser);
      router.push('/customer');
    }
    setIsProcessing(false);
  };

  const login = async (phoneNumber: string, password?: string) => {
    setIsProcessing(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const users = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    const foundUser = users.find((u: any) => u.phoneNumber === phoneNumber && u.password === password);
    
    if (foundUser) {
      if (!foundUser.isApproved) {
        setError('Your account is pending approval. Please contact admin.');
        setIsProcessing(false);
        return;
      }
      localStorage.setItem('qw_user', JSON.stringify(foundUser));
      setUser(foundUser);
      
      // Role-based redirection
      if (foundUser.role === 'admin') router.push('/admin');
      else if (foundUser.role === 'vendor') router.push('/vendor');
      else if (foundUser.role === 'rider') router.push('/rider');
      else router.push('/customer');
    } else {
      setError('Invalid phone number or password. Please try again.');
    }
    setIsProcessing(false);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('qw_user');
    localStorage.removeItem('qw_current_order_id');
    setUser(null);
    router.push('/');
  }, [router]);

  // Sync auth state across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'qw_user') {
        const newUser = e.newValue ? JSON.parse(e.newValue) : null;
        setUser(newUser);
        if (!newUser) router.push('/');
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
