'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'customer' | 'vendor' | 'rider' | 'admin';

interface UserData {
  fullName?: string;
  phoneNumber: string;
  landmark?: string;
  role: UserRole;
}

export function useAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('qw_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (phoneNumber: string, role: UserRole) => {
    const userData = { phoneNumber, role };
    localStorage.setItem('qw_user', JSON.stringify(userData));
    setUser(userData);
    router.push(`/${role === 'customer' ? 'customer' : role}`);
  };

  const signup = (data: UserData) => {
    localStorage.setItem('qw_user', JSON.stringify(data));
    setUser(data);
    router.push(`/${data.role === 'customer' ? 'customer' : data.role}`);
  };

  const logout = () => {
    localStorage.removeItem('qw_user');
    setUser(null);
    router.push('/');
  };

  return { user, loading, login, signup, logout };
}
