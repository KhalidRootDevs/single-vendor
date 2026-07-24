import { Settings } from '@/models/Settings';
import { v2 as cloudinary } from 'cloudinary';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

function validateFile(file: Blob): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be under 10 MB');
  }
  if (
    'type' in file &&
    (file as File).type &&
    !ALLOWED_MIME_TYPES.has((file as File).type)
  ) {
    throw new Error(
      'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed'
    );
  }
}

// Prefers environment variables so secrets stay out of MongoDB.
export const configureCloudinary = async (): Promise<typeof cloudinary> => {
  const envCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const envApiKey = process.env.CLOUDINARY_API_KEY;
  const envApiSecret = process.env.CLOUDINARY_API_SECRET;

  if (envCloudName && envApiKey && envApiSecret) {
    cloudinary.config({
      cloud_name: envCloudName,
      api_key: envApiKey,
      api_secret: envApiSecret,
      secure: true
    });
    return cloudinary;
  }

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
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
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
  validateFile(file);

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

export const deleteMultipleFromCloudinary = async (
  publicIds: string[]
): Promise<void> => {
  const cloudinaryInstance = await configureCloudinary();

  if (publicIds.length === 0) return;

  await Promise.all(
    publicIds.map((publicId) => cloudinaryInstance.uploader.destroy(publicId))
  );
};

export const getCloudinaryConfig = async () => {
  const settings = await Settings.getSettings();
  const cloudinaryConfig = settings.advanced.cloudinary;

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || cloudinaryConfig.cloudName,
    uploadPreset: cloudinaryConfig.uploadPreset,
    folder: cloudinaryConfig.folder
  };
};

export default cloudinary;
