import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/database';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    await connectDB();

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: new Date() }
    }).select('+emailVerificationToken +emailVerificationExpiry');

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { emailVerified: true },
        $unset: { emailVerificationToken: '', emailVerificationExpiry: '' }
      }
    );

    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('verify-email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
