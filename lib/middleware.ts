import { NextResponse } from 'next/server';
import { verifyToken } from './auth-utils';

export function checkRole(token: string | null, allowedRoles: string[]) {
  if (!token) return { error: 'Unauthorized', status: 401 };

  const decoded = verifyToken(token);
  if (!decoded) return { error: 'Invalid token', status: 401 };

  // Super Admin override for ogunwedebo21@gmail.com
  // We need the email in the token for this to work perfectly, 
  // or just check the UID if it's constant for the super admin.
  // For now, let's assume allowedRoles check is standard, and we handle super admin in specific routes or by adding email to token.

  if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
    return { error: 'Forbidden', status: 403 };
  }

  return { decoded };
}

// Super Admin check utility
export function isSuperAdmin(user: any) {
    return user?.phoneNumber === '09012345678' || user?.email === 'ogunwedebo21@gmail.com';
}
