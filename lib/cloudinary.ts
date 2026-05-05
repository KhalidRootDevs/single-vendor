import { Settings } from '@/models/Settings';
import { v2 as cloudinary } from 'cloudinary';
import { useSearchParams } from 'next/navigation';

// Configure Cloudinary with settings from database
export const configureCloudinary = async (): Promise<typeof cloudinary> => {
  try {
    const settings = await Settings.getSettings();
    const cloudinaryConfig = settings.advanced.cloudinary;

    if (
      !cloudinaryConfig.cloudName ||
      !cloudinaryConfig.apiKey ||
      !cloudinaryConfig.apiSecret
    ) {
      throw new Error('Cloudinary configuration is incomplete in settings');
    }

    cloudinary.config({
      cloud_name: cloudinaryConfig.cloudName,
      api_key: cloudinaryConfig.apiKey,
      api_secret: cloudinaryConfig.apiSecret,
      secure: cloudinaryConfig.secure
    });

    return cloudinary;
  } catch (error) {
    console.error('Failed to configure Cloudinary from settings:', error);

    // Fallback to environment variables if database configuration fails
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
      secure: true
    });

    return cloudinary;
  }
};

export const uploadToCloudinary = async (
  file: Blob,
  options?: {
    folder?: string;
    transformation?: Array<{
      width?: number;
      height?: number;
      crop?: 'fill' | 'limit' | 'scale' | 'fit' | 'thumb';
      quality?: 'auto' | number;
      format?: 'webp' | 'jpg' | 'png' | 'auto';
      [key: string]: unknown;
    }>;
    resourceType?: 'image' | 'video' | 'auto' | 'raw';
  }
): Promise<{ secure_url: string; public_id: string }> => {
  const cloudinaryInstance = await configureCloudinary();
  const settings = await Settings.getSettings();
  const cloudinaryConfig = settings.advanced.cloudinary;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    cloudinaryInstance.uploader
      .upload_stream(
        {
          resource_type: options?.resourceType || 'image',
          folder: options?.folder || cloudinaryConfig.folder || 'categories',
          upload_preset: cloudinaryConfig.uploadPreset || undefined,
          transformation: options?.transformation || [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { format: 'webp' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id
            });
          } else {
            reject(new Error('Upload failed'));
          }
        }
      )
      .end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  const cloudinaryInstance = await configureCloudinary();
  await cloudinaryInstance.uploader.destroy(publicId);
};

// Utility function for specific upload types
export const uploadCategoryImage = async (file: Blob) => {
  return uploadToCloudinary(file, {
    folder: 'categories',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto' },
      { format: 'webp' }
    ]
  });
};

export const uploadProductImage = async (file: Blob) => {
  return uploadToCloudinary(file, {
    folder: 'products',
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto' },
      { format: 'webp' }
    ]
  });
};

export const uploadUserAvatar = async (file: Blob) => {
  return uploadToCloudinary(file, {
    folder: 'avatars',
    transformation: [
      { width: 300, height: 300, crop: 'fill' },
      { quality: 'auto' },
      { format: 'webp' }
    ]
  });
};

// Batch operations
export const deleteMultipleFromCloudinary = async (
  publicIds: string[]
): Promise<void> => {
  const cloudinaryInstance = await configureCloudinary();

  if (publicIds.length === 0) return;

  if (publicIds.length === 1) {
    await cloudinaryInstance.uploader.destroy(publicIds[0]);
    return;
  }

  // Delete multiple images
  await Promise.all(
    publicIds.map((publicId) => cloudinaryInstance.uploader.destroy(publicId))
  );
};

// Get Cloudinary configuration from settings (useful for frontend)
export const getCloudinaryConfig = async () => {
  const settings = await Settings.getSettings();
  const cloudinaryConfig = settings.advanced.cloudinary;

  return {
    cloudName: cloudinaryConfig.cloudName,
    uploadPreset: cloudinaryConfig.uploadPreset,
    folder: cloudinaryConfig.folder
  };
};

export default cloudinary;

// Example uses

// // Example 1: Upload a category image
// const categoryImage = await uploadCategoryImage(file);

// // Example 2: Upload a product image
// const productImage = await uploadProductImage(file);

// // Example 3: Upload with custom options
// const customUpload = await uploadToCloudinary(file, {
//   folder: "custom-folder",
//   resourceType: "image",
//   transformation: [
//     { width: 500, height: 500, crop: "fill" },
//     { quality: 80 },
//   ],
// });

// // Example 4: Delete an image
// await deleteFromCloudinary("your-public-id");

// // Example 5: Delete multiple images
// await deleteMultipleFromCloudinary(["id1", "id2", "id3"]);

// // Example 6: Get Cloudinary config for frontend
// const config = await getCloudinaryConfig();
