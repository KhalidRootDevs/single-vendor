import connectDB from '@/lib/database';
import { Banner } from '@/models/Banner';
import { verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = (await request.json()) as {
      banners: Array<{ id: string; order: number }>;
    };

    if (!Array.isArray(body.banners)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    await Promise.all(
      body.banners.map(({ id, order }) =>
        Banner.findByIdAndUpdate(id, { order })
      )
    );

    return NextResponse.json({ message: 'Banners reordered successfully' });
  } catch (error) {
    console.error('Reorder banners error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
