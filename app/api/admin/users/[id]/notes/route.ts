import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';

export const dynamic = 'force-dynamic';

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
