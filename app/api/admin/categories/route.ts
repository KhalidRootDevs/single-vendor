import { type NextRequest, NextResponse } from 'next/server';

import { verifyToken } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import connectDB from '@/lib/database';
import { Category } from '@/models/Category';
import { isMongooseValidationError, isMongooseDuplicateKey } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const featured = formData.get('featured') === 'true';
    const active = formData.get('active') === 'true';
    const imageFile = formData.get('image') as Blob | null;
    const parentId = formData.get('parentId') as string | null;

    // Validate required fields
    if (!name || !imageFile) {
      return NextResponse.json(
        { error: 'Category name and image are required' },
        { status: 400 }
      );
    }

    if (parentId && parentId !== 'none') {
      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        );
      }
    }

    // Check if category name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name already exists!' },
        { status: 409 }
      );
    }

    // Generate unique slug
    const slug = await Category.generateSlug(name);

    // Upload image to Cloudinary
    let imageUrl = '';
    try {
      const uploadResult = await uploadToCloudinary(imageFile);
      imageUrl = uploadResult.secure_url;
    } catch (uploadError) {
      console.error('Image upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Create category
    const category = await Category.create({
      name,
      description,
      image: imageUrl,
      featured,
      active,
      slug,
      parentId: parentId && parentId !== 'none' ? parentId : null
    });

    return NextResponse.json(
      {
        message: 'Category created successfully',
        category: {
          _id: category._id,
          name: category.name,
          description: category.description,
          image: category.image,
          featured: category.featured,
          active: category.active,
          slug: category.slug,
          parentId: category.parentId,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt
        }
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Create category error:', error);

    if (isMongooseValidationError(error)) {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    if (isMongooseDuplicateKey(error)) {
      return NextResponse.json(
        { error: 'Category with this name or slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const featured = searchParams.get('featured');
    const active = searchParams.get('active');
    const parentId = searchParams.get('parentId');

    // Build query
    const query: Record<string, unknown> = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    // Featured filter - apply when featured is not null/undefined and not "all"
    if (featured !== null && featured !== undefined && featured !== 'all') {
      query.featured = featured === 'true';
    }

    // Active filter - apply when active is not null/undefined and not "all"
    if (active !== null && active !== undefined && active !== 'all') {
      query.active = active === 'true';
    }

    // ParentId filter - handle null, "null", "none", and valid IDs
    if (parentId !== null && parentId !== undefined) {
      if (parentId === 'null' || parentId === 'none' || parentId === '') {
        query.parentId = null;
      } else {
        query.parentId = parentId;
      }
    }

    const skip = (page - 1) * limit;

    // Get categories with pagination
    const categories = await Category.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('parentId', 'name slug')
      .select('-__v');

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
