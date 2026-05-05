import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/database';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let payload: { userId: string };
    try {
      payload = verifyToken(token) as { userId: string };
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(payload.userId).select(
      '+emailVerificationToken +emailVerificationExpiry'
    );
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Rate-limit resend: cooldown of 60 seconds
    if (
      user.emailVerificationExpiry &&
      user.emailVerificationExpiry.getTime() - 24 * 60 * 60 * 1000 >
        Date.now() - 60 * 1000
    ) {
      return NextResponse.json(
        { error: 'Please wait 60 seconds before requesting another email' },
        { status: 429 }
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationToken: hashedToken,
          emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      }
    );

    if (process.env.NODE_ENV !== 'production') {
      const verifUrl = `${
        process.env.APP_URL || 'http://localhost:3000'
      }/verify-email?token=${rawToken}`;
      console.log(
        `[DEV] Email verification URL for ${user.email}: ${verifUrl}`
      );
    }

    await sendVerificationEmail(user.email, user.name, rawToken);

    return NextResponse.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('send-verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
