import { NextRequest, NextResponse } from 'next/server';

import { Product } from '@/models/Product';
import { verifyToken } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
import connectDB from '@/lib/database';
import { logAuditEvent } from '@/lib/audit';
import {
  extractPublicIdFromUrl,
  isMongooseValidationError,
  isMongooseDuplicateKey
} from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const product = await Product.findById(params.id).populate(
      'categoryId',
      'name slug'
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
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

    const decodedPut = verifyToken(token);
    if (decodedPut.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();

    // Base fields
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price')
      ? parseFloat(formData.get('price') as string)
      : undefined;
    const compareAtPrice = formData.get('compareAtPrice')
      ? parseFloat(formData.get('compareAtPrice') as string)
      : undefined;
    const cost = formData.get('cost')
      ? parseFloat(formData.get('cost') as string)
      : undefined;
    const sku = formData.get('sku') as string;
    const barcode = formData.get('barcode') as string;
    const categoryId = formData.get('categoryId') as string;
    const tags = formData.get('tags')
      ? JSON.parse(formData.get('tags') as string)
      : undefined;
    const stock = formData.get('stock')
      ? parseInt(formData.get('stock') as string)
      : undefined;
    const weight = formData.get('weight')
      ? parseFloat(formData.get('weight') as string)
      : undefined;
    const length = formData.get('length')
      ? parseFloat(formData.get('length') as string)
      : undefined;
    const width = formData.get('width')
      ? parseFloat(formData.get('width') as string)
      : undefined;
    const height = formData.get('height')
      ? parseFloat(formData.get('height') as string)
      : undefined;
    const active =
      formData.get('active') !== null
        ? formData.get('active') === 'true'
        : undefined;
    const featured =
      formData.get('featured') !== null
        ? formData.get('featured') === 'true'
        : undefined;

    // Handle variants
    const variants = formData.get('variants')
      ? JSON.parse(formData.get('variants') as string)
      : undefined;

    const seo = formData.get('seo')
      ? JSON.parse(formData.get('seo') as string)
      : undefined;

    const imageFiles = formData.getAll('images') as File[];
    const keepExistingImages = formData.get('keepExistingImages') === 'true';

    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if SKU or barcode already exists (excluding current product)
    if (sku && sku !== product.sku) {
      const existingSku = await Product.findOne({
        sku,
        _id: { $ne: params.id }
      });
      if (existingSku) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 409 }
        );
      }
    }

    if (barcode && barcode !== product.barcode) {
      const existingBarcode = await Product.findOne({
        barcode,
        _id: { $ne: params.id }
      });
      if (existingBarcode) {
        return NextResponse.json(
          { error: 'Barcode already exists' },
          { status: 409 }
        );
      }
    }

    // Validate variant SKUs for uniqueness across the database
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        if (variant.sku) {
          const existingVariant = await Product.findOne({
            'variants.sku': variant.sku,
            _id: { $ne: params.id }
          });
          if (existingVariant) {
            return NextResponse.json(
              { error: `Variant SKU "${variant.sku}" already exists` },
              { status: 409 }
            );
          }
        }
      }
    }

    let imageUrls = keepExistingImages ? product.images : [];

    // Upload new product-level images
    if (imageFiles.length > 0) {
      for (const imageFile of imageFiles) {
        try {
          const uploadResult = await uploadToCloudinary(imageFile);
          imageUrls.push(uploadResult.secure_url);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          return NextResponse.json(
            { error: 'Failed to upload images' },
            { status: 500 }
          );
        }
      }
    }

    // Process variant image uploads if any
    if (variants) {
      for (const variant of variants) {
        if (variant.newImages && Array.isArray(variant.newImages)) {
          const uploadedVariantImages: string[] = [];
          for (const image of variant.newImages) {
            try {
              const uploadResult = await uploadToCloudinary(image);
              uploadedVariantImages.push(uploadResult.secure_url);
            } catch (uploadError) {
              console.error('Variant image upload error:', uploadError);
            }
          }
          variant.images = [
            ...(variant.images || []),
            ...uploadedVariantImages
          ];
        }
        delete variant.newImages; // Cleanup
      }
    }

    // Prepare update payload
    const updateData: Record<string, unknown> = {
      ...(name && { name }),
      ...(description && { description }),
      ...(price !== undefined && { price }),
      ...(compareAtPrice !== undefined && { compareAtPrice }),
      ...(cost !== undefined && { cost }),
      ...(sku !== undefined && { sku }),
      ...(barcode !== undefined && { barcode }),
      ...(categoryId && { categoryId }),
      ...(tags !== undefined && { tags }),
      ...(stock !== undefined && { stock }),
      ...(weight !== undefined && { weight }),
      ...(length !== undefined && { length }),
      ...(width !== undefined && { width }),
      ...(height !== undefined && { height }),
      ...(active !== undefined && { active }),
      ...(featured !== undefined && { featured }),
      ...(seo !== undefined && { seo }),
      ...(variants !== undefined && { variants }),
      ...(imageUrls.length > 0 && { images: imageUrls })
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name slug');

    logAuditEvent({
      adminId: decodedPut.userId,
      adminEmail: decodedPut.email,
      action: 'UPDATE_PRODUCT',
      resourceType: 'Product',
      resourceId: params.id,
      after: updateData,
      ip: request.headers.get('x-forwarded-for') || undefined
    }).catch(() => {});

    return NextResponse.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error: unknown) {
    console.error('Update product error:', error);

    if (isMongooseValidationError(error)) {
      const errors = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    if (isMongooseDuplicateKey(error)) {
      return NextResponse.json(
        { error: 'SKU or barcode already exists' },
        { status: 409 }
      );
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

    const decodedDel = verifyToken(token);
    if (decodedDel.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Optional: Delete Cloudinary images
    for (const imageUrl of product.images) {
      const publicId = extractPublicIdFromUrl(imageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    await Product.findByIdAndDelete(params.id);

    logAuditEvent({
      adminId: decodedDel.userId,
      adminEmail: decodedDel.email,
      action: 'DELETE_PRODUCT',
      resourceType: 'Product',
      resourceId: params.id,
      before: { name: product.name, sku: product.sku },
      ip: request.headers.get('x-forwarded-for') || undefined
    }).catch(() => {});

    return NextResponse.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
