import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Category } from '@/models/Category';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const featuredOnly = searchParams.get('featuredOnly') === 'true';

    const query: any = { parentId: null };
    if (activeOnly) query.active = true;
    if (featuredOnly) query.featured = true;

    const mainCategories = await Category.find(query)
      .sort({ order: 1, name: 1 })
      .select('name slug image description featured active order');

    return NextResponse.json({ categories: mainCategories });
  } catch (error) {
    console.error('Get main categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
