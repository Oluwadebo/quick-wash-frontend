'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'customer' | 'vendor' | 'rider' | 'admin';

interface UserData {
  fullName?: string;
  phoneNumber: string;
  password?: string;
  landmark?: string;
  role: UserRole;
  shopName?: string;
  vehicleType?: string;
  isApproved?: boolean;
  nin?: string;
  whatsappNumber?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  turnaroundTime?: string;
  capacity?: number;
  trustPoints?: number;
  walletBalance?: number;
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
    const superAdminPhone = '123456789';
    if (!users.find((u: any) => u.phoneNumber === superAdminPhone)) {
      users.push({
        fullName: 'Super Admin',
        phoneNumber: superAdminPhone,
        password: '123456789',
        role: 'admin',
        isApproved: true,
        trustPoints: 100,
        walletBalance: 0
      });
      localStorage.setItem('qw_all_users', JSON.stringify(users));
    }

    Promise.resolve().then(() => setLoading(false));
  }, []);

  const signup = async (data: UserData) => {
    setIsProcessing(true);
    setError(null);
    
    // Validation
    if (data.role === 'rider') {
      if (!data.nin || !/^\d+$/.test(data.nin)) {
        setError('NIN must be numbers only!');
        setIsProcessing(false);
        return;
      }
    }
    if (data.role === 'vendor') {
      if (!data.bankAccountNumber || !/^\d+$/.test(data.bankAccountNumber)) {
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
    
    // Vendors, Riders, and Admins need approval
    const needsApproval = data.role !== 'customer';
    const newUser = { 
      ...data, 
      isApproved: !needsApproval,
      trustPoints: 50, // New users start at 50
      walletBalance: 0
    };

    users.push(newUser);
    localStorage.setItem('qw_all_users', JSON.stringify(users));
    
    if (needsApproval) {
      // Redirect to login with a message
      router.push(`/auth?login=true&role=${data.role}&message=pending`);
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
      router.push(`/${foundUser.role === 'customer' ? 'customer' : foundUser.role}`);
    } else {
      setError('Invalid phone number or password. Please try again.');
    }
    setIsProcessing(false);
  };

  const logout = () => {
    localStorage.removeItem('qw_user');
    setUser(null);
    router.push('/');
  };

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
