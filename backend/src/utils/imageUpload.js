const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Configure multer for memory storage (we'll handle file saving manually)
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  // Check if the file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 6 // Maximum 6 portfolio images
  }
});

/**
 * Generate a unique filename for uploaded images
 * @param {string} originalName - Original filename
 * @param {string} userId - User ID for organization
 * @returns {string} - Unique filename
 */
function generateFileName(originalName, userId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName).toLowerCase();
  return `portfolio_${userId}_${timestamp}_${random}${extension}`;
}

/**
 * Save portfolio images to disk
 * @param {Array} files - Array of file objects from multer
 * @param {string} userId - User ID for organization
 * @returns {Promise<Array>} - Array of saved file paths
 */
async function savePortfolioImages(files, userId) {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadDir = path.join(__dirname, '../../uploads/portfolio');

  // Ensure upload directory exists
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }

  const savedFiles = [];

  for (const file of files) {
    try {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`File ${file.originalname} exceeds 5MB limit`);
      }

      // Validate image type
      if (!file.mimetype.startsWith('image/')) {
        throw new Error(`File ${file.originalname} is not a valid image`);
      }

      // Generate unique filename
      const filename = generateFileName(file.originalname, userId);
      const filepath = path.join(uploadDir, filename);

      // Save file to disk
      await writeFile(filepath, file.buffer);

      // Return relative path for database storage
      const relativePath = `/uploads/portfolio/${filename}`;
      savedFiles.push({
        originalName: file.originalname,
        filename: filename,
        path: relativePath,
        size: file.size,
        mimetype: file.mimetype
      });

    } catch (error) {
      console.error(`Error saving file ${file.originalname}:`, error);
      throw new Error(`Failed to save image ${file.originalname}: ${error.message}`);
    }
  }

  return savedFiles;
}

/**
 * Delete portfolio image from disk
 * @param {string} filepath - Relative file path
 * @returns {Promise<boolean>} - Success status
 */
async function deletePortfolioImage(filepath) {
  try {
    const fullPath = path.join(__dirname, '../..', filepath);
    await fs.promises.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Error deleting portfolio image:', error);
    return false;
  }
}

/**
 * Validate image file
 * @param {Object} file - File object
 * @returns {Object} - Validation result
 */
function validateImage(file) {
  const errors = [];

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    errors.push('File size must be less than 5MB');
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('Only JPEG, PNG, and WebP images are allowed');
  }

  // Check dimensions (optional - would require image processing library)
  // For now, we'll rely on frontend validation

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Process multiple portfolio images
 * @param {Array} files - Array of file objects
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Processing result
 */
async function processPortfolioImages(files, userId) {
  if (!files || files.length === 0) {
    return { success: true, images: [] };
  }

  try {
    // Validate all files first
    const validationErrors = [];
    for (let i = 0; i < files.length; i++) {
      const validation = validateImage(files[i]);
      if (!validation.isValid) {
        validationErrors.push(`File ${i + 1}: ${validation.errors.join(', ')}`);
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: 'Image validation failed',
        details: validationErrors
      };
    }

    // Save all files
    const savedImages = await savePortfolioImages(files, userId);

    return {
      success: true,
      images: savedImages
    };

  } catch (error) {
    console.error('Error processing portfolio images:', error);
    return {
      success: false,
      error: error.message || 'Failed to process images'
    };
  }
}

module.exports = {
  upload,
  savePortfolioImages,
  deletePortfolioImage,
  validateImage,
  processPortfolioImages,
  generateFileName
};