import { type NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const { newEmail, password } = await request.json();

    // Validate required fields
    if (!newEmail || !password) {
      return NextResponse.json(
        { error: 'New email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Find user with password field
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 401 }
      );
    }

    // Check if new email is already taken
    const existingUser = await User.findOne({
      email: newEmail.toLowerCase(),
      _id: { $ne: userId }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already taken' },
        { status: 409 }
      );
    }

    // Update email
    user.email = newEmail.toLowerCase();
    user.emailVerified = false; // Reset email verification
    await user.save();

    return NextResponse.json({
      message: 'Email updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Change email error:', error);

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
