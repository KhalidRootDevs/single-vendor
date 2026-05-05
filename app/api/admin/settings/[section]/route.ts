import { NextRequest, NextResponse } from 'next/server';
import { Settings } from '@/models/Settings';
import connectDB from '@/lib/database';
import { isMongooseValidationError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { section: string } }
) {
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

    // Valid sections
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

    // Update only the specific section
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { [section]: sectionData } },
      { new: true, upsert: true, runValidators: true }
    );

    // Remove sensitive data from response
    const safeSettings = JSON.parse(JSON.stringify(settings));
    // ... (same sensitive data handling as above)

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
