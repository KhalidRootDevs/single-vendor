import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { User } from '@/models/User';
import { generateToken } from '@/lib/auth';
import connectDB from '@/lib/database';
import { sendVerificationEmail } from '@/lib/email';
import { isMongooseValidationError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create user
    const rawVerifToken = crypto.randomBytes(32).toString('hex');
    const hashedVerifToken = crypto
      .createHash('sha256')
      .update(rawVerifToken)
      .digest('hex');

    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: hashedVerifToken,
      emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    if (process.env.NODE_ENV !== 'production') {
      const verifUrl = `${
        process.env.APP_URL || 'http://localhost:3000'
      }/verify-email?token=${rawVerifToken}`;
      console.log(
        `[DEV] Email verification URL for ${user.email}: ${verifUrl}`
      );
    }
    // Send verification email (non-blocking)
    sendVerificationEmail(user.email, user.name, rawVerifToken).catch(() => {});

    // Generate token
    const token = generateToken(user);

    // Create response
    const response = NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error: unknown) {
    console.error('Registration error:', error);

    if (isMongooseValidationError(error)) {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
