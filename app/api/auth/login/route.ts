import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { generateToken } from '@/lib/auth';
import connectDB from '@/lib/database';
import { authLimiter, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    if (authLimiter) {
      const ip = getClientIp(request);
      const { success } = await authLimiter.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Fetch lockout fields alongside password
    const user = await User.findOne({ email }).select(
      '+password +failedLoginAttempts +lockoutUntil'
    );
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Account lockout check
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        {
          error: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`
        },
        { status: 429 }
      );
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      const attempts = (user.failedLoginAttempts ?? 0) + 1;
      const updateData: Record<string, unknown> = {
        failedLoginAttempts: attempts
      };
      if (attempts >= LOCKOUT_ATTEMPTS) {
        updateData.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }
      await user.updateOne(updateData);

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Successful login — clear lockout state
    await user.updateOne({
      lastLogin: new Date(),
      failedLoginAttempts: 0,
      $unset: { lockoutUntil: '' }
    });

    const token = generateToken(user);

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth
        }
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
