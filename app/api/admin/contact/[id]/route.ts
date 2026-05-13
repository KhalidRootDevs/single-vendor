import connectDB from '@/lib/database';
import { Contact } from '@/models/Contact';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = verifyToken(token);
    return decoded.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const submission = await Contact.findById(params.id).select('-__v');
    if (!submission)
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );

    if (submission.status === 'new') {
      await Contact.findByIdAndUpdate(params.id, { status: 'read' });
      submission.status = 'read';
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Get submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status } = await request.json();
    const validStatuses = ['new', 'read', 'replied', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const submission = await Contact.findByIdAndUpdate(
      params.id,
      { status },
      { new: true }
    ).select('-__v');

    if (!submission)
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );

    return NextResponse.json({ message: 'Status updated', submission });
  } catch (error) {
    console.error('Update submission status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const submission = await Contact.findByIdAndDelete(params.id);
    if (!submission)
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );

    return NextResponse.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Delete submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
