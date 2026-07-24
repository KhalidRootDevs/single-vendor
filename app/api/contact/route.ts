import connectDB from '@/lib/database';
import { Contact } from '@/models/Contact';
import { isMongooseValidationError } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { contactLimiter, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (contactLimiter) {
      const ip = getClientIp(request);
      const { success } = await contactLimiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: 'Too many submissions. Please wait a few minutes.' },
          { status: 429 }
        );
      }
    }

    await connectDB();

    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const contact = await Contact.create({ name, email, subject, message });

    return NextResponse.json(
      { message: 'Message sent successfully', contact },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit contact form error:', error);
    if (isMongooseValidationError(error)) {
      const errors = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
