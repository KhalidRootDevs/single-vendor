import connectDB from '@/lib/database';
import { Banner } from '@/models/Banner';
import { verifyToken } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { isMongooseValidationError } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function requireAdmin(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = verifyToken(token);
    return decoded.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const active = searchParams.get('active');

    const query: Record<string, unknown> = {};
    if (active === 'true') query.active = true;
    if (active === 'false') query.active = false;

    const skip = (page - 1) * limit;
    const [banners, total] = await Promise.all([
      Banner.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Banner.countDocuments(query)
    ]);

    return NextResponse.json({
      banners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get admin banners error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const link = formData.get('link') as string;
    const buttonText = formData.get('buttonText') as string;
    const active = formData.get('active') === 'true';
    const startDateRaw = formData.get('startDate') as string | null;
    const endDateRaw = formData.get('endDate') as string | null;
    const imageFile = formData.get('image') as File | null;

    if (!title || !description || !link || !buttonText) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json(
        { error: 'Banner image is required' },
        { status: 400 }
      );
    }

    const lastBanner = await Banner.findOne()
      .sort({ order: -1 })
      .select('order');
    const order = lastBanner ? lastBanner.order + 1 : 1;

    let imageUrl: string;
    let imagePublicId: string;
    try {
      const result = await uploadToCloudinary(imageFile, {
        folder: 'banners',
        transformation: [
          { width: 1200, height: 600, crop: 'fill' },
          { quality: 'auto' },
          { format: 'webp' }
        ]
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    } catch (err) {
      console.error('Banner image upload error:', err);
      return NextResponse.json(
        { error: 'Failed to upload banner image' },
        { status: 500 }
      );
    }

    const banner = await Banner.create({
      title,
      description,
      imageUrl,
      imagePublicId,
      link,
      buttonText,
      active,
      order,
      startDate: startDateRaw ? new Date(startDateRaw) : undefined,
      endDate: endDateRaw ? new Date(endDateRaw) : undefined
    });

    return NextResponse.json(
      { message: 'Banner created successfully', banner },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create banner error:', error);
    if (isMongooseValidationError(error)) {
      const errors = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
