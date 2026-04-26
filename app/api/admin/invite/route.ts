import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminInvite from '@/lib/models/AdminInvite';
import { verifyToken } from '@/lib/auth-utils';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    // Only super admin or existing super-sub-admin can invite
    const isSuper = decoded?.email === 'ogunweoluwadebo1@gmail.com' || decoded?.email === 'ogunwedebo21@gmail.com' || decoded?.phoneNumber === '07048865686' || decoded?.role === 'super-sub-admin';
    
    if (!isSuper) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { fullName, email, role } = await req.json();
    if (!fullName || !email) return NextResponse.json({ message: 'Full name and email required' }, { status: 400 });

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const invite = await AdminInvite.create({
      token: inviteToken,
      fullName,
      email,
      role: role || 'admin',
      expiresAt,
    });

    // The link will point to an admin setup page
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/admin-finish?token=${inviteToken}`;

    return NextResponse.json({ inviteLink, expiresAt });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
