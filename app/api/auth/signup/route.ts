import { NextResponse } from 'next/server';
import connectDB from '@/backend/services/database';
import User from '@/backend/models/User';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth-utils';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { 
      fullName, phoneNumber, email, password, role, 
      shopName, shopAddress, vehicleType, nin,
      shopImage, ninImage 
    } = body;

    // Check if user already exists (phone or email)
    const existingUser = await User.findOne({ $or: [{ phoneNumber }, { email }] });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this phone or email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Initial fields
    const uid = Math.random().toString(36).substring(2, 15);
    
    let uploadedShopImage = '';
    let uploadedNinImage = '';

    // Handle Cloudinary uploads if base64 images are provided
    if (shopImage) {
      uploadedShopImage = (await uploadToCloudinary(shopImage, 'vendors')) || '';
    }
    if (ninImage) {
      uploadedNinImage = (await uploadToCloudinary(ninImage, 'riders')) || '';
    }

    // Create unique transfer reference
    const transferReference = `QW-${Math.floor(100000 + Math.random() * 900000)}`;

    const newUser = new User({
      uid,
      fullName,
      phoneNumber,
      email,
      password: hashedPassword,
      role,
      shopName,
      shopAddress,
      vehicleType,
      nin,
      shopImage: uploadedShopImage,
      ninImage: uploadedNinImage,
      transferReference,
      isApproved: role === 'customer', // Auto-approve customers
      status: 'active',
      walletBalance: 0,
      pendingBalance: 0,
      trustPoints: 100,
      trustScore: 100
    });

    await newUser.save();

    const userData = newUser.toObject();
    delete userData.password;

    const token = signToken({ uid: newUser.uid, role: newUser.role, email: newUser.email });

    return NextResponse.json({ user: userData, token }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
