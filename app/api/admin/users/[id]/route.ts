import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';
import { isMongooseValidationError, isMongooseDuplicateKey } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    const user = await User.findById(params.id)
      .populate('addresses')
      .populate('notes.createdBy', 'name email')
      // .populate("orders.orderId")
      .select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add note to user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await user.addNote(content, new mongoose.Types.ObjectId(decoded.userId));

    const updatedUser = await User.findById(params.id)
      .populate('notes.createdBy', 'name email')
      .select('-password');

    return NextResponse.json({
      message: 'Note added successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Add note error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('addresses')
      .populate('notes.createdBy', 'name email')
      .select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User status updated successfully',
      user
    });
  } catch (error: unknown) {
    console.error('Update user status error:', error);

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    const { name, email, phone, role } = await request.json();

    const user = await User.findByIdAndUpdate(
      params.id,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(role && { role })
      },
      { new: true, runValidators: true }
    )
      .populate('addresses')
      .populate('notes.createdBy', 'name email')
      .select('-password');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user
    });
  } catch (error: unknown) {
    console.error('Update user error:', error);

    if (isMongooseValidationError(error)) {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    if (isMongooseDuplicateKey(error)) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
