import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Category } from '@/models/Category';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const includeChildren = searchParams.get('includeChildren') === 'true';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const parentCategory = await Category.findById(params.id);
    if (!parentCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const query: any = { parentId: params.id };
    if (activeOnly) query.active = true;

    let subCategoriesQuery = Category.find(query).sort({ order: 1, name: 1 });

    if (includeChildren) {
      subCategoriesQuery = subCategoriesQuery.populate({
        path: 'subCategories',
        match: activeOnly ? { active: true } : {},
        options: { sort: { order: 1, name: 1 } }
      });
    }

    const subCategories = await subCategoriesQuery.exec();

    return NextResponse.json({
      parentCategory: {
        _id: parentCategory._id,
        name: parentCategory.name,
        slug: parentCategory.slug,
        image: parentCategory.image
      },
      subCategories
    });
  } catch (error) {
    console.error('Get sub-categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
