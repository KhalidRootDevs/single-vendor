import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/database';
import { User } from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    // Always return 200 to avoid email enumeration
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).select('+passwordResetToken +passwordResetExpiry');

    if (user) {
      // Rate-limit: 60 second cooldown
      if (
        user.passwordResetExpiry &&
        user.passwordResetExpiry.getTime() - 60 * 60 * 1000 >
          Date.now() - 60 * 1000
      ) {
        // Still return 200 — don't reveal rate limit to potential attacker
        return NextResponse.json({
          message: 'If that email exists, a reset link has been sent.'
        });
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
            passwordResetToken: hashedToken,
            passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000)
          }
        }
      );

      if (process.env.NODE_ENV !== 'production') {
        const resetUrl = `${
          process.env.APP_URL || 'http://localhost:3000'
        }/reset-password?token=${rawToken}`;
        console.log(`[DEV] Password reset URL for ${user.email}: ${resetUrl}`);
      }

      await sendPasswordResetEmail(user.email, user.name, rawToken);
    }

    return NextResponse.json({
      message: 'If that email exists, a reset link has been sent.'
    });
  } catch (error) {
    console.error('forgot-password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
