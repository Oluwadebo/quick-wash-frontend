import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET() {
  try {
    await connectDB();
    const vendors = await User.find({ role: 'vendor', isApproved: true });
    
    // Transform to simple objects for the frontend
    const vendorData = vendors.map(v => ({
      uid: v.uid,
      shopName: v.shopName || v.fullName || 'Anonymous Vendor',
      fullName: v.fullName,
      phoneNumber: v.phoneNumber,
      shopAddress: v.shopAddress || v.address,
      landmark: v.landmark,
      turnaroundTime: v.turnaroundTime || '24h Standard',
      trustPoints: v.trustPoints,
      isApproved: v.isApproved,
      shopImage: v.shopImage || `https://picsum.photos/seed/laundry-${v.phoneNumber}/800/600`
    }));

    return NextResponse.json(vendorData);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
