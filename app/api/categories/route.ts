import connectDB from '@/lib/database';
import { Category } from '@/models/Category';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50'); // Increased for hierarchical data
    const search = searchParams.get('search') || '';
    const featured = searchParams.get('featured');
    const active = searchParams.get('active');
    const includeSubCategories =
      searchParams.get('includeSubCategories') === 'true';
    const parentId = searchParams.get('parentId'); // null for main categories, specific ID for sub-categories
    const level = searchParams.get('level'); // 0 for main categories, 1 for sub-categories, etc.

    // Build query
    const query: any = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    // Featured filter
    if (featured !== null && featured !== 'all') {
      query.featured = featured === 'true';
    }

    // Active filter
    if (active !== null && active !== 'all') {
      query.active = active === 'true';
    }

    // Parent filter - get main categories or specific sub-categories
    if (parentId === 'null' || parentId === '') {
      query.parentId = null; // Main categories only
    } else if (parentId) {
      query.parentId = parentId; // Specific sub-categories
    }

    // Level filter (if you want to filter by depth)
    if (level !== null && level !== '') {
      // Note: Your current model doesn't have a level field, but you can calculate it
      // For now, we'll use parentId to determine level
    }

    const skip = (page - 1) * limit;

    // Build population for sub-categories if requested
    let categoriesQuery = Category.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    // If including sub-categories, populate them recursively
    if (includeSubCategories) {
      categoriesQuery = categoriesQuery.populate({
        path: 'subCategories',
        match: { active: true }, // Only include active sub-categories
        options: { sort: { name: 1 } },
        populate: {
          path: 'subCategories',
          match: { active: true },
          options: { sort: { name: 1 } }
          // You can add more levels here if needed
        }
      });
    } else {
      // Always populate basic parent info
      categoriesQuery = categoriesQuery.populate({
        path: 'parentId',
        select: 'name slug'
      });
    }

    const categories = await categoriesQuery.exec();
    const total = await Category.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
