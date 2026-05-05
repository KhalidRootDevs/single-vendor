import { NextRequest, NextResponse } from 'next/server';

import { Address } from '@/models/Address';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    const {
      label,
      fullName,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      isDefault
    } = await request.json();

    // Validate required fields
    if (
      !label ||
      !fullName ||
      !address ||
      !city ||
      !state ||
      !zipCode ||
      !phone
    ) {
      return NextResponse.json(
        { error: 'All address fields are required' },
        { status: 400 }
      );
    }

    // Create new address
    const newAddress = await Address.create({
      userId,
      label,
      fullName,
      address,
      city,
      state,
      zipCode,
      country: country || 'United States',
      phone,
      isDefault: isDefault || false
    });

    // Add address reference to user
    await User.findByIdAndUpdate(userId, {
      $push: { addresses: newAddress._id }
    });

    return NextResponse.json(
      {
        message: 'Address created successfully',
        address: newAddress
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create address error:', error);

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

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;

    // Get all addresses for the user
    const addresses = await Address.find({ userId }).sort({
      isDefault: -1,
      createdAt: -1
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
