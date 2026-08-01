import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';
import { AppError } from './appError';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

export function isCloudinaryConfigured(): boolean {
  return Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
}

export function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<UploadApiResponse> {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      'Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      500
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `digital-gyaan/${folder}`,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError(error?.message || 'Image upload failed.', 502));
          return;
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId);
}

export function extractPublicId(cloudinaryUrl: string): string | null {
  const match = /\/digital-gyaan\/([^/.]+\/[^/.]+)\./.exec(cloudinaryUrl);
  return match ? `digital-gyaan/${match[1]}` : null;
}
