import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ContactSubmission from '@/lib/models/ContactSubmission';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const submission = await ContactSubmission.create({
      name,
      email,
      message
    });

    console.log('New Contact Submission:', submission);

    return NextResponse.json({ 
      success: true, 
      message: 'Message received! We will get back to you shortly.',
      id: submission._id 
    });
  } catch (error: any) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
