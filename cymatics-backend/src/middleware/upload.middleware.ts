import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { config } from '@/config';
import { FileUploadError } from '@/utils/errors';
import { generateUniqueFilename, sanitizeFilename } from '@/utils/helpers';

// Ensure upload directory exists
const uploadDir = path.resolve(config.upload.path);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const sanitizedName = sanitizeFilename(file.originalname);
    const uniqueName = generateUniqueFilename(sanitizedName);
    cb(null, uniqueName);
  },
});

// File filter function
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  const fileExtension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  if (allowedMimeTypes.includes(mimeType) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new FileUploadError('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize, // 5MB by default
    files: 5, // Maximum 5 files
  },
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string) => {
  return upload.single(fieldName);
};

// Middleware for multiple file upload
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
  return upload.array(fieldName, maxCount);
};

// Middleware for multiple fields
export const uploadFields = (fields: { name: string; maxCount?: number }[]) => {
  return upload.fields(fields);
};

// Helper function to delete uploaded file
export const deleteFile = (filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(uploadDir, filename);

    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Helper function to get file URL
export const getFileUrl = (filename: string): string => {
  return `/uploads/${filename}`;
};

// Helper function to check if file exists
export const fileExists = (filename: string): boolean => {
  const filePath = path.join(uploadDir, filename);
  return fs.existsSync(filePath);
};

// Helper function to get file info
export const getFileInfo = (filename: string): { size: number; mtime: Date } | null => {
  try {
    const filePath = path.join(uploadDir, filename);
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      mtime: stats.mtime,
    };
  } catch (error) {
    return null;
  }
};

// Cleanup old files (optional utility)
export const cleanupOldFiles = (maxAgeInDays: number = 30): Promise<number> => {
  return new Promise((resolve, reject) => {
    const maxAge = Date.now() - (maxAgeInDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        reject(err);
        return;
      }

      const deletePromises = files.map(file => {
        return new Promise<void>((resolveFile, rejectFile) => {
          const filePath = path.join(uploadDir, file);

          fs.stat(filePath, (statErr, stats) => {
            if (statErr) {
              rejectFile(statErr);
              return;
            }

            if (stats.mtime.getTime() < maxAge) {
              fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                  rejectFile(unlinkErr);
                } else {
                  deletedCount++;
                  resolveFile();
                }
              });
            } else {
              resolveFile();
            }
          });
        });
      });

      Promise.all(deletePromises)
        .then(() => resolve(deletedCount))
        .catch(reject);
    });
  });
};
