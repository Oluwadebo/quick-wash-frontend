import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/backend/services/database';
import VendorPriceList from '@/backend/models/VendorPriceList';

export async function GET(req: NextRequest, { params }: { params: Promise<{ vendorUid: string }> }) {
  try {
    const { vendorUid } = await params;
    await connectDB();
    const priceList = await VendorPriceList.findOne({ vendorUid: vendorUid });
    return NextResponse.json(priceList?.items || []);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ vendorUid: string }> }) {
  try {
    const { vendorUid } = await params;
    await connectDB();
    const { items } = await req.json();
    
    const updated = await VendorPriceList.findOneAndUpdate(
      { vendorUid: vendorUid },
      { items },
      { upsert: true, new: true }
    );
    
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
