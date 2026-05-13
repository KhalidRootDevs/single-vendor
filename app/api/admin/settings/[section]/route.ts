import { NextRequest, NextResponse } from 'next/server';
import { Settings } from '@/models/Settings';
import connectDB from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { isMongooseValidationError } from '@/lib/utils';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { section: string } }
) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();

    const section = params.section;
    const body = await request.json();
    const sectionData = body[section];

    if (!sectionData) {
      return NextResponse.json(
        { error: 'Section data is required' },
        { status: 400 }
      );
    }

    const validSections = [
      'general',
      'payment',
      'shipping',
      'email',
      'cms',
      'advanced'
    ];

    if (!validSections.includes(section)) {
      return NextResponse.json(
        { error: 'Invalid settings section' },
        { status: 400 }
      );
    }

    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { [section]: sectionData } },
      { new: true, upsert: true, runValidators: true }
    );

    const safeSettings = JSON.parse(JSON.stringify(settings));

    return NextResponse.json({
      settings: safeSettings,
      message: `${
        section.charAt(0).toUpperCase() + section.slice(1)
      } settings updated successfully`
    });
  } catch (error: unknown) {
    console.error(`Update ${params.section} settings error:`, error);

    if (isMongooseValidationError(error)) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
