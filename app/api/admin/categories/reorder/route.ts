import { type NextRequest, NextResponse } from 'next/server';

import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';
import { Category } from '@/models/Category';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { categoryIds } = await request.json();

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid category IDs array' },
        { status: 400 }
      );
    }

    // Update the order for each category
    const updatePromises = categoryIds.map((id, index) =>
      Category.findByIdAndUpdate(id, { order: index }, { new: true })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    console.error('Reorder categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
