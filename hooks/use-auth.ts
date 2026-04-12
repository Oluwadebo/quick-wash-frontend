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
        isApproved: true
      });
      localStorage.setItem('qw_all_users', JSON.stringify(users));
    }

    Promise.resolve().then(() => setLoading(false));
  }, []);

  const signup = async (data: UserData) => {
    setIsProcessing(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const users = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    if (users.find((u: any) => u.phoneNumber === data.phoneNumber)) {
      alert('This phone number is already registered!');
      setIsProcessing(false);
      return;
    }
    
    // Vendors, Riders, and Admins need approval
    const needsApproval = data.role !== 'customer';
    const newUser = { ...data, isApproved: !needsApproval };

    users.push(newUser);
    localStorage.setItem('qw_all_users', JSON.stringify(users));
    
    if (needsApproval) {
      alert(`${data.role.charAt(0).toUpperCase() + data.role.slice(1)} registration submitted. Please wait for admin approval.`);
      router.push('/auth?login=true');
    } else {
      localStorage.setItem('qw_user', JSON.stringify(newUser));
      setUser(newUser);
      router.push('/customer');
    }
    setIsProcessing(false);
  };

  const login = async (phoneNumber: string, password?: string) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const users = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    const foundUser = users.find((u: any) => u.phoneNumber === phoneNumber && u.password === password);
    
    if (foundUser) {
      if (!foundUser.isApproved) {
        alert('Your account is pending approval. Please contact admin.');
        setIsProcessing(false);
        return;
      }
      localStorage.setItem('qw_user', JSON.stringify(foundUser));
      setUser(foundUser);
      router.push(`/${foundUser.role === 'customer' ? 'customer' : foundUser.role}`);
    } else {
      alert('Invalid credentials. Please check your number and password.');
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

  return { user, loading, isProcessing, login, signup, logout, approveUser };
}
