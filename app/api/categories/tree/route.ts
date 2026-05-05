import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Category } from '@/models/Category';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const maxDepth = parseInt(searchParams.get('maxDepth') || '3');

    const baseQuery: any = { parentId: null };
    if (activeOnly) baseQuery.active = true;

    const mainCategories = await Category.find(baseQuery)
      .sort({ order: 1, name: 1 })
      .populate({
        path: 'subCategories',
        match: activeOnly ? { active: true } : {},
        options: { sort: { order: 1, name: 1 } },
        populate:
          maxDepth >= 2
            ? {
                path: 'subCategories',
                match: activeOnly ? { active: true } : {},
                options: { sort: { order: 1, name: 1 } },
                populate:
                  maxDepth >= 3
                    ? {
                        path: 'subCategories',
                        match: activeOnly ? { active: true } : {},
                        options: { sort: { order: 1, name: 1 } }
                      }
                    : undefined
              }
            : undefined
      });

    return NextResponse.json({ categories: mainCategories });
  } catch (error) {
    console.error('Get category tree error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
