import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SiteSetting from '@/lib/models/SiteSetting';
import { verifyToken } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    let settings = await SiteSetting.findOne({ id: 'global' });
    if (!settings) {
      settings = await SiteSetting.create({ id: 'global' });
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super-sub-admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    let settings = await SiteSetting.findOne({ id: 'global' });
    if (!settings) {
      settings = new SiteSetting({ id: 'global' });
    }

    Object.assign(settings, data);
    await settings.save();

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
