import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { Category } from '@/models/Category';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const category = await Category.findById(params.id)
      .populate({
        path: 'parentId',
        select: 'name slug parentId',
        populate: { path: 'parentId', select: 'name slug parentId' }
      })
      .populate({
        path: 'subCategories',
        match: { active: true },
        options: { sort: { order: 1, name: 1 } },
        select: 'name slug image active'
      });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const breadcrumb: { _id: unknown; name: string; slug: string }[] = [];
    let current: any = category;

    while (current) {
      breadcrumb.unshift({
        _id: current._id,
        name: current.name,
        slug: current.slug
      });
      current =
        current.parentId && typeof current.parentId === 'object'
          ? current.parentId
          : null;
    }

    return NextResponse.json({ category, breadcrumb });
  } catch (error) {
    console.error('Get category hierarchy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
