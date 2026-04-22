import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/services/database';
import SiteSettings from '@/backend/models/SiteSettings';
import { verifyToken } from '@/lib/auth-utils';

export async function GET() {
  try {
    await connectDB();
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
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
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = new SiteSettings(data);
    } else {
      Object.assign(settings, data);
    }
    await settings.save();
    
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
