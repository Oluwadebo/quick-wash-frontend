import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SiteSetting from '@/lib/models/SiteSetting';
import { verifyToken } from '@/lib/auth-utils';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Safety Check: If Mongo isn't ready, return 503 instead of a generic 500
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json({ message: "Database connection initializing..." }, { status: 503 });
    }

    let settings = await SiteSetting.findOne({ id: 'global' });

    if (!settings) {
      // Create defaults so your 80/20 split logic has a starting point
      settings = await SiteSetting.create({
        id: 'global',
        name: 'Quick-Wash',
        commissionRate: 20
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("GET Settings Error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token) as any;
    // Check for both admin roles per your requirements
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super-sub-admin')) {
      return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const data = await req.json();

    // Use findOneAndUpdate with upsert for a much "cleaner" update
    const updatedSettings = await SiteSetting.findOneAndUpdate(
      { id: 'global' },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    console.error("PATCH Settings Error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}