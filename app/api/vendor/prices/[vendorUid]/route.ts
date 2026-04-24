import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VendorPriceList from '@/lib/models/VendorPriceList';

export async function GET(req: NextRequest, { params }: { params: { vendorUid: string } }) {
  try {
    await connectDB();
    const { vendorUid } = params;
    
    // Check both vendorId and vendorUid because of inconsistency in models
    const priceList = await VendorPriceList.findOne({ 
      $or: [{ vendorId: vendorUid }, { vendorUid: vendorUid }] 
    });
    
    if (!priceList) {
      return NextResponse.json([]);
    }

    // Return services or items depending on which is populated
    return NextResponse.json(priceList.services || priceList.items || []);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
