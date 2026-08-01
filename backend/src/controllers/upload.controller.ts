import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { uploadBufferToCloudinary, deleteFromCloudinary, extractPublicId } from '../utils/cloudinary';

// Validates the actual file bytes against known image signatures, since a
// client-supplied mimetype/extension can be spoofed (multer's fileFilter
// only checks the declared mimetype, not file content).
const SIGNATURES: { bytes: number[]; offset?: number }[] = [
  { bytes: [0xff, 0xd8, 0xff] }, // JPEG
  { bytes: [0x89, 0x50, 0x4e, 0x47] }, // PNG
  { bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF
  { bytes: [0x52, 0x49, 0x46, 0x46] }, // WEBP (RIFF header; 'WEBP' follows at offset 8)
];

function isValidImageBuffer(buffer: Buffer): boolean {
  return SIGNATURES.some((sig) => {
    const offset = sig.offset || 0;
    return sig.bytes.every((byte, i) => buffer[offset + i] === byte);
  });
}

function assertValidImage(file: Express.Multer.File): void {
  if (!isValidImageBuffer(file.buffer)) {
    throw new AppError('File content does not match a supported image format.', 400);
  }
}

export const uploadSingleImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No image file was provided.', 400);
  }
  assertValidImage(req.file);

  const folder = (req.body.folder as string) || 'media';
  const result = await uploadBufferToCloudinary(req.file.buffer, folder);

  res.status(201).json({
    success: true,
    data: {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    },
  });
});

export const uploadMultipleImages = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    throw new AppError('No image files were provided.', 400);
  }
  files.forEach(assertValidImage);

  const folder = (req.body.folder as string) || 'media';
  const results = await Promise.all(
    files.map((file) => uploadBufferToCloudinary(file.buffer, folder))
  );

  res.status(201).json({
    success: true,
    data: results.map((r) => ({
      url: r.secure_url,
      publicId: r.public_id,
      width: r.width,
      height: r.height,
    })),
  });
});

export const deleteImage = catchAsync(async (req: Request, res: Response) => {
  const { url, publicId } = req.body as { url?: string; publicId?: string };
  const idToDelete = publicId || (url ? extractPublicId(url) : null);

  if (!idToDelete) {
    throw new AppError('A valid publicId or Cloudinary url is required.', 400);
  }

  await deleteFromCloudinary(idToDelete);
  res.status(204).send();
});
