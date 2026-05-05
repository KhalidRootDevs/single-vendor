import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/database';
import { User } from '@/models/User';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: new Date() }
    }).select('+passwordResetToken +passwordResetExpiry');

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { passwordResetToken: '', passwordResetExpiry: '' }
      }
    );

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('reset-password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
