import { NextRequest, NextResponse } from 'next/server';

import { Address } from '@/models/Address';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/database';
import { isMongooseValidationError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

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
    const userId = decoded.userId;

    const addressId = params.id;
    const updateData = await request.json();

    // Find address and verify ownership
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Update address
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Address updated successfully',
      address: updatedAddress
    });
  } catch (error: unknown) {
    console.error('Update address error:', error);

    if (isMongooseValidationError(error)) {
      const errors = Object.values(error.errors).map((err) => err.message);
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
    const userId = decoded.userId;

    const addressId = params.id;

    // Find address and verify ownership
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Delete address
    await Address.findByIdAndDelete(addressId);

    // Remove address reference from user (optional - you might want to keep the reference)
    // await User.findByIdAndUpdate(userId, {
    //   $pull: { addresses: addressId },
    // });

    return NextResponse.json({
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Set address as default
export async function PATCH(
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
    const userId = decoded.userId;

    const addressId = params.id;

    // Find address and verify ownership
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Set this address as default and others as non-default
    await Address.updateMany(
      { userId, _id: { $ne: addressId } },
      { $set: { isDefault: false } }
    );

    address.isDefault = true;
    await address.save();

    return NextResponse.json({
      message: 'Address set as default successfully',
      address
    });
  } catch (error) {
    console.error('Set default address error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
