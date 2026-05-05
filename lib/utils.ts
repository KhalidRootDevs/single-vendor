import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts the public ID from a Cloudinary URL with comprehensive format support
 * @param url - The Cloudinary URL
 * @returns The public ID or null if not a valid Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Remove URL parameters if any
    const cleanUrl = url.split('?')[0];

    // Check if it's a Cloudinary URL
    if (!cleanUrl.includes('res.cloudinary.com')) {
      return null;
    }

    // Split the URL by slashes
    const parts = cleanUrl.split('/');

    // Find the index of 'upload' in the path
    const uploadIndex = parts.indexOf('upload');

    if (uploadIndex === -1) {
      return null;
    }

    // The public ID starts after the upload segment and any transformations/version
    // We need to find where the actual public ID begins
    let publicIdStartIndex = uploadIndex + 1;

    // Skip transformation parameters and version
    for (let i = publicIdStartIndex; i < parts.length; i++) {
      const part = parts[i];

      // Skip transformation parameters (they usually contain underscores and letters)
      if (part.match(/^[a-z]_[^\/]+$/)) {
        publicIdStartIndex = i + 1;
        continue;
      }

      // Skip version (starts with 'v' followed by numbers)
      if (part.match(/^v\d+$/)) {
        publicIdStartIndex = i + 1;
        continue;
      }

      // If we reach here, we've found the start of the public ID
      break;
    }

    // Join the remaining parts to form the public ID
    const publicIdParts = parts.slice(publicIdStartIndex);

    if (publicIdParts.length === 0) {
      return null;
    }

    // Reconstruct the public ID and remove file extension
    let publicId = publicIdParts.join('/');

    // Remove file extension
    const lastDotIndex = publicId.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      publicId = publicId.substring(0, lastDotIndex);
    }

    return publicId || null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
}

export default function objectToFormData(
  obj: any,
  ignore: string[] | null | undefined = []
) {
  const formData = new FormData();

  if (!Array.isArray(ignore)) {
    ignore = [];
  }

  Object.keys(obj).forEach((key: any) => {
    if (!ignore.includes(key) && obj[key] !== '') {
      if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any, index: number) => {
          if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach((subKey) => {
              formData.append(`${key}[${index}][${subKey}]`, item[subKey]);
            });
          } else {
            formData.append(`${key}[]`, item);
          }
        });
      } else {
        formData.append(key, obj[key]);
      }
    }
  });

  return formData;
}
