import { type NextRequest, NextResponse } from 'next/server';

import { Category } from '@/models/Category';
import { verifyToken } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import connectDB from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const category = await Category.findById(params.id);

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const category = await Category.findById(params.id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    if (parentId && parentId !== 'none') {
      if (parentId === params.id) {
        return NextResponse.json(
          { error: 'A category cannot be its own parent' },
          { status: 400 }
        );
      }

      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        );
      }

      if (parentCategory.parentId?.toString() === params.id) {
        return NextResponse.json(
          {
            error:
              'Circular reference detected: parent category cannot be a child of this category'
          },
          { status: 400 }
        );
      }
    }

    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        name,
        _id: { $ne: params.id }
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: 'Category name already exists' },
          { status: 409 }
        );
      }
    }

    let imageUrl = category.image;

    if (imageFile) {
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
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      params.id,
      {
        ...(name && { name }),
        ...(description !== null && { description }),
        image: imageUrl,
        featured,
        active,
        parentId: parentId && parentId !== 'none' ? parentId : null
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error: any) {
    console.error('Update category error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

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

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const category = await Category.findById(params.id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    await Category.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
