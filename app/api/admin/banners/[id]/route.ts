import connectDB from '@/lib/database';
import { Banner } from '@/models/Banner';
import { verifyToken } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
import { extractPublicIdFromUrl, isMongooseValidationError } from '@/lib/utils';
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const banner = await Banner.findById(params.id).select('-__v');
    if (!banner)
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('Get banner error:', error);
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

    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const banner = await Banner.findById(params.id);
    if (!banner)
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const link = formData.get('link') as string;
    const buttonText = formData.get('buttonText') as string;
    const activeRaw = formData.get('active');
    const active = activeRaw !== null ? activeRaw === 'true' : banner.active;
    const startDateRaw = formData.get('startDate') as string | null;
    const endDateRaw = formData.get('endDate') as string | null;
    const imageFile = formData.get('image') as File | null;

    const updateData: Record<string, unknown> = {
      ...(title && { title }),
      ...(description && { description }),
      ...(link && { link }),
      ...(buttonText && { buttonText }),
      active,
      startDate: startDateRaw ? new Date(startDateRaw) : banner.startDate,
      endDate: endDateRaw ? new Date(endDateRaw) : banner.endDate
    };

    if (imageFile && imageFile.size > 0) {
      const publicId =
        banner.imagePublicId || extractPublicIdFromUrl(banner.imageUrl);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (err) {
          console.error('Failed to delete old banner image:', err);
        }
      }

      try {
        const result = await uploadToCloudinary(imageFile, {
          folder: 'banners',
          transformation: [
            { width: 1200, height: 600, crop: 'fill' },
            { quality: 'auto' },
            { format: 'webp' }
          ]
        });
        updateData.imageUrl = result.secure_url;
        updateData.imagePublicId = result.public_id;
      } catch (err) {
        console.error('Banner image upload error:', err);
        return NextResponse.json(
          { error: 'Failed to upload banner image' },
          { status: 500 }
        );
      }
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-__v');

    return NextResponse.json({
      message: 'Banner updated successfully',
      banner: updatedBanner
    });
  } catch (error) {
    console.error('Update banner error:', error);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const banner = await Banner.findByIdAndUpdate(
      params.id,
      { active: body.active },
      { new: true }
    ).select('-__v');

    if (!banner)
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

    return NextResponse.json({ message: 'Banner updated', banner });
  } catch (error) {
    console.error('Patch banner error:', error);
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

    if (!requireAdmin(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const banner = await Banner.findById(params.id);
    if (!banner)
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });

    const publicId =
      banner.imagePublicId || extractPublicIdFromUrl(banner.imageUrl);
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (err) {
        console.error('Failed to delete banner image from Cloudinary:', err);
      }
    }

    await Banner.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete banner error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
