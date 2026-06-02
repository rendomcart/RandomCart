import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper function to save buffer locally (formerly Cloudinary)
export const uploadToCloudinary = async (fileBuffer, folder) => {
  const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
  const uploadDir = path.join(__dirname, '..', 'uploads');
  const filePath = path.join(uploadDir, filename);
  
  await fs.writeFile(filePath, fileBuffer);
  
  return {
    url: `/uploads/${filename}`,
    public_id: `local-${filename}`
  };
};

// Helper function to delete local image
export const deleteFromCloudinary = async (public_id) => {
  if (!public_id || !public_id.startsWith('local-')) return;
  
  const filename = public_id.replace('local-', '');
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting local image:', error);
  }
};
