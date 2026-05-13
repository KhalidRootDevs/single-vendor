import connectDB from '@/lib/database';
import { Banner } from '@/models/Banner';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    await connectDB();

    const now = new Date();
    const banners = await Banner.find({
      active: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } }
          ]
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } }
          ]
        }
      ]
    })
      .sort({ order: 1, createdAt: -1 })
      .select('-__v');

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Get public banners error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
