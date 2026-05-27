import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const MAX_CATEGORY_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const categoryImageMulterOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_CATEGORY_IMAGE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          `Only image files are allowed (jpeg, png, webp, gif). Got: ${file.mimetype}`,
        ),
        false,
      );
    }
  },
};
